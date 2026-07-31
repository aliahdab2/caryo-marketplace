#!/bin/bash
#
# Environment Variables Checker for Caryo production deploys
# Run automatically by scripts/deploy/deploy.sh, or standalone:
#
#   ./scripts/deploy/check-env.sh
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Checking Environment Variables"
echo "=================================="

# Resolve repo root from this script's location so it works from anywhere
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$REPO_ROOT/env/production.env"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ $ENV_FILE not found!${NC}"
    echo "   Copy env/production.env.example to env/production.env and fill it in."
    exit 1
fi

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

ERRORS=0
WARNINGS=0

require() {
    local name="$1"
    local value="${!name}"
    if [ -z "$value" ] || [ "$value" = "CHANGE_ME" ]; then
        echo -e "${RED}❌ $name is missing or still CHANGE_ME${NC}"
        ERRORS=1
    else
        echo -e "${GREEN}✅ $name${NC}"
    fi
}

recommend() {
    local name="$1"
    local value="${!name}"
    if [ -z "$value" ]; then
        echo -e "${YELLOW}⚠️  $name is empty (feature disabled)${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✅ $name${NC}"
    fi
}

echo ""
echo "Required:"
require PUBLIC_URL
require DB_NAME
require DB_USER
require DB_PASSWORD
require JWT_SECRET
require NEXTAUTH_SECRET
require MINIO_ACCESS_KEY
require MINIO_SECRET_KEY
require OPENAI_API_KEY

case "$PUBLIC_URL" in
    */)
        echo -e "${RED}❌ PUBLIC_URL must not end with a slash${NC}"
        ERRORS=1
        ;;
    http://*|https://*) ;;
    *)
        echo -e "${RED}❌ PUBLIC_URL must start with http:// or https://${NC}"
        ERRORS=1
        ;;
esac

echo ""
echo "Recommended:"
recommend EMAIL_USERNAME
recommend SENTRY_DSN
recommend GOOGLE_CLIENT_ID

echo ""
if [ "$ERRORS" -ne 0 ]; then
    echo -e "${RED}❌ Environment check failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Environment check passed ($WARNINGS warnings)${NC}"
