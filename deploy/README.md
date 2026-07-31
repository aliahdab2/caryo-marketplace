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

Internal ports deliberately avoid jawab24's 3000–3002 range. To co-host both
stacks on one server, set `HTTP_PORT`/`HTTPS_PORT` in `env/production.env` and
route from the front proxy or Cloudflare.

## TLS

Two options:

- **Cloudflare in front (recommended to start)**: point DNS through Cloudflare
  with "Full" SSL; keep nginx on port 80.
- **Certbot on the server**: obtain certs, place `fullchain.pem`/`privkey.pem`
  in `deploy/nginx/ssl/`, uncomment the 443 block in `deploy/nginx/caryo.conf`.

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
