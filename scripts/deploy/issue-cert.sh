#!/bin/bash
#
# Issue or renew the Let's Encrypt certificate for the Caryo production stack.
#
#   ./scripts/deploy/issue-cert.sh          # issue if missing, renew if due
#   ./scripts/deploy/issue-cert.sh --force  # force renewal even if not due
#   ./scripts/deploy/issue-cert.sh --staging # use the LE staging CA (dry runs)
#
# How it works:
#   1. nginx already serves /.well-known/acme-challenge/ from the shared
#      certbot_webroot volume (see deploy/nginx/conf/), on plain HTTP, in both
#      the TLS and non-TLS variants. So this works on a first deploy and on
#      every renewal without downtime.
#   2. certbot runs as a one-off container against that webroot.
#   3. The resulting cert is copied to deploy/nginx/ssl/, which nginx reads.
#   4. nginx is reloaded (or restarted, if it was serving plain HTTP and now
#      needs to pick up the TLS variant).
#
# Put this in cron on the server to keep the cert fresh, e.g.:
#   17 3 * * 1 cd /var/www/caryo && bash scripts/deploy/issue-cert.sh >> /var/log/caryo-cert.log 2>&1
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

FORCE=0
STAGING=0
for arg in "$@"; do
    case "$arg" in
        --force)   FORCE=1 ;;
        --staging) STAGING=1 ;;
        *) echo -e "${RED}Unknown option: $arg${NC}"; exit 1 ;;
    esac
done

if [ -d "/var/www/caryo" ]; then
    DEPLOY_DIR="/var/www/caryo"
else
    DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fi
cd "$DEPLOY_DIR"

ENV_FILE="env/production.env"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ $ENV_FILE not found${NC}"
    exit 1
fi
# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

# Domain: explicit CERT_DOMAIN wins, else derive from PUBLIC_URL
DOMAIN="${CERT_DOMAIN:-}"
if [ -z "$DOMAIN" ]; then
    DOMAIN="${PUBLIC_URL#*://}"
    DOMAIN="${DOMAIN%%/*}"
    DOMAIN="${DOMAIN%%:*}"
fi

if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "localhost" ]; then
    echo -e "${RED}❌ Cannot issue a certificate for '${DOMAIN:-<empty>}'.${NC}"
    echo "   Set CERT_DOMAIN in $ENV_FILE to a public hostname."
    exit 1
fi

if [ -z "${CERT_EMAIL:-}" ]; then
    echo -e "${RED}❌ CERT_EMAIL is not set in $ENV_FILE${NC}"
    echo "   Let's Encrypt requires an email for expiry notices."
    exit 1
fi

echo ""
echo -e "${BLUE}🔐 Certificate for ${DOMAIN}${NC}"
echo ""

if ! docker ps --format '{{.Names}}' | grep -q '^caryo-nginx$'; then
    echo -e "${RED}❌ caryo-nginx is not running.${NC}"
    echo "   Start the stack first: bash scripts/deploy/deploy.sh"
    exit 1
fi

CERTBOT_ARGS="certonly --webroot --webroot-path=/var/www/certbot"
CERTBOT_ARGS="$CERTBOT_ARGS -d $DOMAIN --email $CERT_EMAIL"
CERTBOT_ARGS="$CERTBOT_ARGS --agree-tos --no-eff-email --non-interactive"
[ "$FORCE" -eq 1 ]   && CERTBOT_ARGS="$CERTBOT_ARGS --force-renewal"
[ "$STAGING" -eq 1 ] && CERTBOT_ARGS="$CERTBOT_ARGS --staging"

echo -e "${BLUE}Running certbot...${NC}"
# shellcheck disable=SC2086
docker run --rm \
    -v caryo_certbot_conf:/etc/letsencrypt \
    -v caryo_certbot_webroot:/var/www/certbot \
    certbot/certbot $CERTBOT_ARGS

echo ""
echo -e "${BLUE}Installing certificate into deploy/nginx/ssl/...${NC}"
mkdir -p deploy/nginx/ssl

# certbot writes into the named volume; copy out via a throwaway container
docker run --rm \
    -v caryo_certbot_conf:/etc/letsencrypt:ro \
    -v "$DEPLOY_DIR/deploy/nginx/ssl:/out" \
    alpine:3 sh -c "
        set -e
        cp -L /etc/letsencrypt/live/$DOMAIN/fullchain.pem /out/fullchain.pem
        cp -L /etc/letsencrypt/live/$DOMAIN/privkey.pem   /out/privkey.pem
        chmod 644 /out/fullchain.pem
        chmod 600 /out/privkey.pem
    "

echo -e "${GREEN}✅ Certificate installed${NC}"
echo ""

# If nginx was running the plain-HTTP variant it has to restart (the entrypoint
# picks the variant); if it was already on TLS a reload is enough.
if docker exec caryo-nginx test -f /etc/nginx/conf.d/default.conf \
   && docker exec caryo-nginx grep -q "listen 443" /etc/nginx/conf.d/default.conf 2>/dev/null; then
    echo -e "${BLUE}Reloading nginx...${NC}"
    docker exec caryo-nginx nginx -t
    docker exec caryo-nginx nginx -s reload
else
    echo -e "${BLUE}Restarting nginx to switch to the TLS config...${NC}"
    docker restart caryo-nginx > /dev/null
fi

echo -e "${GREEN}✅ nginx now serving HTTPS for ${DOMAIN}${NC}"
echo ""
echo -e "${YELLOW}Reminder: set PUBLIC_URL=https://${DOMAIN} in $ENV_FILE and${NC}"
echo -e "${YELLOW}redeploy, so the app builds absolute URLs with https://.${NC}"
echo ""
