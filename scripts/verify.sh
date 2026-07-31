#!/bin/bash
#
# Full verification loop for Caryo Marketplace
#
# ONE command that runs everything a change needs before it lands:
#   unit/integration tests + static checks + REAL-BROWSER click testing.
#
# Usage:
#   ./scripts/verify.sh              # default gate: frontend + backend + smoke e2e
#   ./scripts/verify.sh --frontend   # type-check, lint, translations, jest
#   ./scripts/verify.sh --backend    # gradle test
#   ./scripts/verify.sh --smoke     # e2e: seo-smoke + auth specs (always green)
#   ./scripts/verify.sh --e2e        # ALL Playwright specs — 17 legacy tests are
#                                    # still being triaged (see .claude/skills/verify)
#   ./scripts/verify.sh --full       # frontend + backend + ALL e2e specs
#
# The e2e step manages its own servers:
#   - backend: uses :8080 if healthy, otherwise starts the dev stack
#   - frontend: builds a PRODUCTION standalone bundle and serves it on :3220.
#     A cold dev server compiles every route on first hit and times the whole
#     suite out, and prod parity is what we actually want to test.
#     Reuse a running server via E2E_BASE_URL, skip rebuild via E2E_SKIP_BUILD=1.
#     (ports 3000-3005 belong to another project on this machine)
#
set -eo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$REPO_ROOT/frontend"
BACKEND_DIR="$REPO_ROOT/backend/caryo-backend"
E2E_PORT="${E2E_PORT:-3220}"
E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:$E2E_PORT}"
API_URL="http://localhost:8080"

RUN_FRONTEND=0; RUN_BACKEND=0; RUN_E2E=0; SMOKE_ONLY=0
if [ $# -eq 0 ]; then
    # Default gate: everything that is guaranteed-green. The full e2e suite
    # graduates into the default once the legacy spec triage lands.
    RUN_FRONTEND=1; RUN_BACKEND=1; RUN_E2E=1; SMOKE_ONLY=1
fi
for arg in "$@"; do
    case "$arg" in
        --frontend) RUN_FRONTEND=1 ;;
        --backend)  RUN_BACKEND=1 ;;
        --e2e)      RUN_E2E=1 ;;
        --smoke)    RUN_E2E=1; SMOKE_ONLY=1 ;;
        --full)     RUN_FRONTEND=1; RUN_BACKEND=1; RUN_E2E=1; SMOKE_ONLY=0 ;;
        *) echo -e "${RED}Unknown option: $arg${NC}"; exit 1 ;;
    esac
done

STARTED_FRONTEND_PID=""
cleanup() {
    if [ -n "$STARTED_FRONTEND_PID" ]; then
        kill "$STARTED_FRONTEND_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT

step() { echo ""; echo -e "${BLUE}=== $1 ===${NC}"; }

# ==========================================
# Frontend static checks + unit tests
# ==========================================
if [ "$RUN_FRONTEND" -eq 1 ]; then
    cd "$FRONTEND_DIR"
    step "Frontend: type-check"
    npm run type-check
    step "Frontend: lint"
    npm run lint
    step "Frontend: translation validation"
    npm run translation:validate | tail -6
    step "Frontend: unit tests"
    npm run test 2>&1 | tail -5
    echo -e "${GREEN}✅ Frontend checks passed${NC}"
fi

# ==========================================
# Backend tests
# ==========================================
if [ "$RUN_BACKEND" -eq 1 ]; then
    cd "$BACKEND_DIR"
    step "Backend: unit tests"
    SPRING_PROFILES_ACTIVE=test ./gradlew test --no-daemon 2>&1 | tail -5
    echo -e "${GREEN}✅ Backend tests passed${NC}"
fi

# ==========================================
# E2E click testing in a real browser
# ==========================================
if [ "$RUN_E2E" -eq 1 ]; then
    step "E2E: ensuring backend is up"
    if ! curl -sf --max-time 3 "$API_URL/actuator/health" > /dev/null 2>&1; then
        echo -e "${YELLOW}Backend not running — starting dev stack...${NC}"
        (cd "$BACKEND_DIR" && docker compose -p caryo_dev -f .devenv/docker-compose.dev.yml up -d)
        WAITED=0
        until curl -sf --max-time 3 "$API_URL/actuator/health" > /dev/null 2>&1; do
            sleep 5; WAITED=$((WAITED + 5))
            if [ $WAITED -ge 300 ]; then
                echo -e "${RED}❌ Backend did not become healthy in 5 minutes${NC}"; exit 1
            fi
        done
    fi
    echo -e "${GREEN}Backend healthy${NC}"

    step "E2E: ensuring frontend is up on $E2E_BASE_URL"
    if ! curl -sfo /dev/null --max-time 3 "$E2E_BASE_URL/en" 2>/dev/null; then
        cd "$FRONTEND_DIR"
        if [ "${E2E_SKIP_BUILD:-0}" != "1" ]; then
            echo -e "${YELLOW}Building production standalone bundle...${NC}"
            SITE_URL=$E2E_BASE_URL npm run build > /tmp/caryo-verify-build.log 2>&1 || {
                echo -e "${RED}❌ Frontend build failed:${NC}"; tail -20 /tmp/caryo-verify-build.log; exit 1; }
        fi
        SERVER_JS=$(find .next/standalone -maxdepth 2 -name server.js | head -1)
        if [ -z "$SERVER_JS" ]; then
            echo -e "${RED}❌ No standalone server.js — run without E2E_SKIP_BUILD${NC}"; exit 1
        fi
        SDIR=$(dirname "$SERVER_JS")
        # Always replace static assets wholesale: mixing chunks from two builds
        # breaks all JS/CSS and produces misleading failures
        rm -rf "$SDIR/.next/static" "$SDIR/public"
        cp -R .next/static "$SDIR/.next/static"
        cp -R public "$SDIR/public"
        echo -e "${YELLOW}Starting production server on :$E2E_PORT...${NC}"
        PORT=$E2E_PORT HOSTNAME=127.0.0.1 NEXTAUTH_URL=$E2E_BASE_URL \
            NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-local-verify-secret}" \
            NEXT_PUBLIC_API_URL=$API_URL \
            node "$SERVER_JS" > /tmp/caryo-verify-frontend.log 2>&1 &
        STARTED_FRONTEND_PID=$!
        WAITED=0
        until curl -sfo /dev/null --max-time 3 "$E2E_BASE_URL/en" 2>/dev/null; do
            sleep 2; WAITED=$((WAITED + 2))
            if ! kill -0 "$STARTED_FRONTEND_PID" 2>/dev/null; then
                echo -e "${RED}❌ Frontend server crashed:${NC}"
                tail -20 /tmp/caryo-verify-frontend.log; exit 1
            fi
            if [ $WAITED -ge 60 ]; then
                echo -e "${RED}❌ Frontend did not come up in 1 minute${NC}"; exit 1
            fi
        done
    fi
    echo -e "${GREEN}Frontend responding${NC}"

    step "E2E: Playwright click tests (chromium)"
    cd "$FRONTEND_DIR"
    if [ "$SMOKE_ONLY" -eq 1 ]; then
        E2E_BASE_URL=$E2E_BASE_URL npx playwright test --project=chromium seo-smoke auth
    else
        E2E_BASE_URL=$E2E_BASE_URL npx playwright test --project=chromium
    fi
    echo -e "${GREEN}✅ E2E click tests passed${NC}"
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}🎉 Verification loop complete — all green${NC}"
echo -e "${GREEN}=========================================${NC}"
