# Caryo Production Deployment

One deploy script, two callers (same pattern as jawab24):

- **Manual**: SSH to the server → `bash scripts/deploy/deploy.sh`
- **GitHub**: Actions → "Deploy to Production" → Run workflow (SSHes in and runs the same script)

## First-time server setup

```bash
# 1. Install Docker (Ubuntu)
curl -fsSL https://get.docker.com | sh

# 2. Clone the repo
sudo mkdir -p /var/www/caryo && sudo chown $USER /var/www/caryo
git clone https://github.com/aliahdab2/caryo-marketplace.git /var/www/caryo
cd /var/www/caryo

# 3. Configure environment (NEVER commit the real file)
cp env/production.env.example env/production.env
nano env/production.env   # fill in every REQUIRED value

# 4. Deploy
bash scripts/deploy/deploy.sh
```

## What the script does

1. Validates `env/production.env` (aborts on missing/placeholder values)
2. `git pull` latest main (skip with `--no-pull`)
3. Backs up the database to `backups/` (keeps last 10, aborts deploy on failure)
4. Builds all containers
5. Restarts the stack (`docker-compose.prod.yml`)
6. Waits for health checks, then verifies `/` and `/actuator/health` through nginx

## Stack layout

Only nginx publishes host ports (`HTTP_PORT`/`HTTPS_PORT`, default 80/443).
Everything else stays inside the `caryo-network` Docker network:

| Service  | Internal address | Public route |
|----------|------------------|--------------|
| frontend | frontend:3100    | `/`          |
| backend  | backend:8080     | `/api/`, `/actuator/health` |
| minio    | minio:9000       | `/storage/`  |
| imgproxy | imgproxy:8080    | `/img/`      |
| postgres | db:5432          | —            |
| redis    | redis:6379       | —            |
| db-backup| —                | —            |

Internal ports deliberately avoid jawab24's 3000–3002 range. To co-host both
stacks on one server, set `HTTP_PORT`/`HTTPS_PORT` in `env/production.env` and
route from the front proxy or Cloudflare.

## TLS

nginx picks its server config at container start, based on whether a
certificate exists (`deploy/nginx/entrypoint.d/10-caryo-tls.sh`):

| `deploy/nginx/ssl/` | Config used | Behaviour |
|---------------------|-------------|-----------|
| has `fullchain.pem` + `privkey.pem` | `conf/tls.conf.template` | 443 serves the site; 80 serves only the healthcheck and ACME challenges, everything else 301s to HTTPS. HSTS on. |
| empty | `conf/http-only.conf` | Plain HTTP on 80, with a startup warning. |

Routing lives in `conf/locations.conf` and is shared by both variants — edit
it once and both stay in sync.

### Getting a certificate

```bash
# in env/production.env
CERT_DOMAIN=caryo.sy
CERT_EMAIL=you@example.com

bash scripts/deploy/deploy.sh       # stack up on plain HTTP
bash scripts/deploy/issue-cert.sh   # certbot -> deploy/nginx/ssl/ -> restart nginx
# then set PUBLIC_URL=https://caryo.sy and redeploy
```

Renewal is the same command; add it to cron:

```
17 3 * * 1 cd /var/www/caryo && bash scripts/deploy/issue-cert.sh >> /var/log/caryo-cert.log 2>&1
```

Use `--staging` first if you're iterating — Let's Encrypt rate-limits real
issuance aggressively.

### Or terminate TLS upstream

Point DNS through Cloudflare with "Full" SSL and leave nginx on port 80. Set
`PUBLIC_URL` to the `https://` address Cloudflare serves. The plain-HTTP
warning at startup is expected in this setup.

**Never** expose the plain-HTTP variant directly to the internet: JWTs and
passwords would travel in cleartext. `check-env.sh` fails the deploy if
`PUBLIC_URL` is `http://` on a non-local host.

## Backups

Two independent paths:

- **Pre-deploy**: `deploy.sh` snapshots to `backups/pre-deploy-*.sql.gz`,
  keeps the last 10, and aborts the deploy if the dump fails.
- **Scheduled**: the `db-backup` service dumps to `backups/scheduled-*.sql.gz`
  every `BACKUP_INTERVAL_SECONDS` (default 24h), keeping `BACKUP_KEEP`
  (default 14).

Both write to `backups/` on the host. That is the *same disk* as the database
— copy it off-box (rsync/S3) for it to count as a real backup, and test a
restore before you need one:

```bash
gunzip -c backups/scheduled-<...>.sql.gz | docker exec -i caryo-db psql -U $DB_USER $DB_NAME
```

## GitHub deploys

Add repository secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`.
The workflow is manual-trigger only (`workflow_dispatch`) and requires the
server checkout at `/var/www/caryo`.

## Rollback

```bash
cd /var/www/caryo
git reset --hard <previous-commit>
bash scripts/deploy/deploy.sh --no-pull
# DB if needed: gunzip -c backups/pre-deploy-<...>.sql.gz | docker exec -i caryo-db psql -U $DB_USER $DB_NAME
```
