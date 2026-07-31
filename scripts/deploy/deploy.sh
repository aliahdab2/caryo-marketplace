#!/bin/bash
#
# Safe Deployment Script for Caryo Marketplace
#
# ONE entrypoint, TWO callers (same pattern as jawab24):
#   - Manually:  ssh to the server, then  bash scripts/deploy/deploy.sh
#   - GitHub:    .github/workflows/deploy.yml SSHes in and runs this same script
#
# What it does:
#   1. Validates environment variables
#   2. Pulls latest code (skip with --no-pull)
#   3. Backs up the database
#   4. Builds containers
#   5. Restarts the stack
#   6. Runs health checks and verifies endpoints
#
# Usage: ./scripts/deploy/deploy.sh [--no-pull]
#

set -e

echo ""
echo "🚀 Caryo Safe Deployment"
echo "========================"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SKIP_PULL=0
for arg in "$@"; do
    case "$arg" in
        --no-pull) SKIP_PULL=1 ;;
        *) echo -e "${RED}Unknown option: $arg${NC}"; exit 1 ;;
    esac
done

# Determine deploy directory: server checkout first, else the repo this
# script lives in (works for local runs from any cwd)
if [ -d "/var/www/caryo" ]; then
    DEPLOY_DIR="/var/www/caryo"
else
    DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fi

cd "$DEPLOY_DIR"
echo -e "${BLUE}📁 Deploy directory: $DEPLOY_DIR${NC}"

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE="env/production.env"

# docker compose v2 with fallback to legacy docker-compose
if docker compose version > /dev/null 2>&1; then
    COMPOSE="docker compose"
else
    COMPOSE="docker-compose"
fi
DC="$COMPOSE -f $COMPOSE_FILE --env-file $ENV_FILE"
echo ""

# ==========================================
# Step 1: Check Environment Variables
# ==========================================
echo -e "${BLUE}Step 1/6: Checking environment variables...${NC}"
if ! bash ./scripts/deploy/check-env.sh; then
    echo -e "${RED}❌ Environment check failed. Aborting deployment.${NC}"
    exit 1
fi
echo ""

# ==========================================
# Step 2: Pull Latest Code
# ==========================================
if [ "$SKIP_PULL" -eq 1 ]; then
    echo -e "${YELLOW}Step 2/6: Skipping git pull (--no-pull)${NC}"
else
    echo -e "${BLUE}Step 2/6: Pulling latest code...${NC}"
    git fetch origin main
    git reset --hard origin/main
fi
COMMIT=$(git rev-parse --short HEAD)
echo -e "${GREEN}✅ Deploying commit: $COMMIT${NC}"
echo ""

# ==========================================
# Step 3: Database Backup
# ==========================================
echo -e "${BLUE}Step 3/6: Backing up database...${NC}"
# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

if docker ps --format '{{.Names}}' | grep -q '^caryo-db$'; then
    mkdir -p backups
    BACKUP_FILE="backups/pre-deploy-$(date +%Y%m%d-%H%M%S)-$COMMIT.sql.gz"
    if docker exec caryo-db pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"; then
        echo -e "${GREEN}✅ Backup saved: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))${NC}"
        # Keep only the 10 most recent backups
        ls -t backups/pre-deploy-*.sql.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    else
        echo -e "${RED}❌ Database backup failed. Aborting deployment.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  No running database container — skipping backup (first deploy?)${NC}"
fi
echo ""

# ==========================================
# Step 4: Build Containers
# ==========================================
echo -e "${BLUE}Step 4/6: Building containers...${NC}"
$DC build --pull
echo -e "${GREEN}✅ All containers built${NC}"
echo ""

# ==========================================
# Step 5: Deploy Containers
# ==========================================
echo -e "${BLUE}Step 5/6: Deploying containers...${NC}"
$DC up -d --remove-orphans
echo -e "${GREEN}✅ Containers started${NC}"
echo ""

# ==========================================
# Step 6: Health Checks
# ==========================================
echo -e "${BLUE}Step 6/6: Running health checks...${NC}"

MAX_WAIT=180
WAITED=0

health_of() {
    docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}running{{end}}' "$1" 2>/dev/null || echo "missing"
}

while [ $WAITED -lt $MAX_WAIT ]; do
    DB_H=$(health_of caryo-db)
    BACKEND_H=$(health_of caryo-backend)
    FRONTEND_H=$(health_of caryo-frontend)
    NGINX_H=$(health_of caryo-nginx)

    echo "   DB: $DB_H | Backend: $BACKEND_H | Frontend: $FRONTEND_H | Nginx: $NGINX_H"

    if [ "$DB_H" = "healthy" ] && [ "$BACKEND_H" = "healthy" ] && [ "$FRONTEND_H" = "healthy" ] && [ "$NGINX_H" = "healthy" ]; then
        echo ""
        echo -e "${GREEN}✅ All containers healthy!${NC}"
        break
    fi

    for c in caryo-backend caryo-frontend caryo-nginx; do
        STATE=$(docker inspect --format='{{.State.Status}}' "$c" 2>/dev/null || echo "missing")
        if [ "$STATE" = "exited" ] || [ "$STATE" = "dead" ]; then
            echo -e "${RED}❌ Container $c crashed!${NC}"
            docker logs "$c" --tail 30
            exit 1
        fi
    done

    sleep 5
    WAITED=$((WAITED + 5))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${YELLOW}⚠️  Health check timeout - containers may still be starting${NC}"
fi
echo ""

# ==========================================
# Final Verification
# ==========================================
echo -e "${BLUE}Verifying deployment...${NC}"

HTTP_PORT="${HTTP_PORT:-80}"

if curl -sf "http://localhost:${HTTP_PORT}/actuator/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API responding${NC}"
else
    echo -e "${YELLOW}⚠️  API not responding yet (may need more time)${NC}"
fi

if curl -sf "http://localhost:${HTTP_PORT}/" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend responding${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend not responding yet (may need more time)${NC}"
fi

echo ""
echo "=================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=================================="
echo ""
echo "📊 Container Status:"
docker ps --filter "name=caryo-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "🌐 Website: ${PUBLIC_URL:-http://localhost:${HTTP_PORT}}"
echo "📝 Commit:  $COMMIT"
echo ""
