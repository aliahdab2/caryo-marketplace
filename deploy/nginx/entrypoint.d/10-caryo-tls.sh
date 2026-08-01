#!/bin/sh
#
# Selects the nginx server config at container start.
#
# nginx has no conditionals, and an `ssl_certificate` pointing at a missing
# file is a hard startup failure. So the variant is chosen here instead:
#
#   certs present -> TLS variant  (port 80 redirects to 443)
#   certs absent  -> HTTP variant (plain HTTP, loud warning)
#
# Runs from nginx:alpine's /docker-entrypoint.d/ hook before nginx starts.
# Mounted read-only from deploy/nginx/entrypoint.d/ — must stay executable.

set -e

CONF_SRC="/etc/nginx/caryo"
CONF_OUT="/etc/nginx/conf.d/default.conf"
CERT="/etc/nginx/ssl/fullchain.pem"
KEY="/etc/nginx/ssl/privkey.pem"

# The default.conf shipped in the image would otherwise bind :80 as well
rm -f /etc/nginx/conf.d/default.conf

if [ -s "$CERT" ] && [ -s "$KEY" ]; then
    : "${SERVER_NAME:=_}"
    echo "caryo: TLS certificate found — enabling HTTPS for '${SERVER_NAME}'"
    # Restrict envsubst to SERVER_NAME so nginx runtime vars ($host,
    # $remote_addr, $scheme, ...) survive untouched.
    envsubst '${SERVER_NAME}' < "$CONF_SRC/tls.conf.template" > "$CONF_OUT"
else
    echo "caryo: WARNING — no TLS certificate at $CERT; serving plain HTTP."
    echo "caryo: WARNING — do not expose this to the internet without TLS"
    echo "caryo:           terminated upstream (e.g. Cloudflare). To issue a"
    echo "caryo:           certificate, run scripts/deploy/issue-cert.sh."
    cp "$CONF_SRC/http-only.conf" "$CONF_OUT"
fi
