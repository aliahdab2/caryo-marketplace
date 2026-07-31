# Caryo Marketplace — Local CI
# Usage: make help

.PHONY: help ci test-backend test-frontend lint-frontend build-frontend \
        integration services services-up services-down \
        translation seo e2e clean

BACKEND_DIR  := backend/caryo-backend
FRONTEND_DIR := frontend

# ──────────────────────────────────────────────
# Full CI pipeline
# ──────────────────────────────────────────────

ci: test-backend test-frontend translation seo ## Run the full CI pipeline (backend + frontend + translation + seo)

verify: ## Full verification loop: tests + real-browser click testing (see scripts/verify.sh for scoped flags)
	./scripts/verify.sh

# ──────────────────────────────────────────────
# Backend
# ──────────────────────────────────────────────

test-backend: ## Run backend unit tests
	cd $(BACKEND_DIR) && SPRING_PROFILES_ACTIVE=test ./gradlew clean test --no-daemon

build-backend: ## Build backend without tests
	cd $(BACKEND_DIR) && ./gradlew assemble --no-daemon

# ──────────────────────────────────────────────
# Frontend
# ──────────────────────────────────────────────

test-frontend: lint-frontend build-frontend ## Run frontend lint + build + tests
	cd $(FRONTEND_DIR) && npm test -- --watchAll=false --passWithNoTests

lint-frontend: ## Run ESLint on frontend
	cd $(FRONTEND_DIR) && npm run lint

build-frontend: ## Build Next.js frontend
	cd $(FRONTEND_DIR) && npm run build

install-frontend: ## Install frontend dependencies
	cd $(FRONTEND_DIR) && npm ci --prefer-offline --no-audit

# ──────────────────────────────────────────────
# Integration tests (requires Docker)
# ──────────────────────────────────────────────

integration: services-up ## Start Docker services and run integration tests
	@echo "Waiting for services to be healthy..."
	@sleep 15
	cd $(BACKEND_DIR) && SPRING_PROFILES_ACTIVE=integration,test ./gradlew integrationTest --info --no-daemon
	@$(MAKE) services-down

services-up: ## Start Docker services (db, minio, redis)
	cd $(BACKEND_DIR) && docker compose -f docker-compose.dev.yml up -d db minio createbuckets redis
	@echo "Services starting... use 'make services-down' to stop them."

services-down: ## Stop Docker services
	cd $(BACKEND_DIR) && docker compose -f docker-compose.dev.yml down

services: services-up ## Alias for services-up

# ──────────────────────────────────────────────
# Translation & SEO
# ──────────────────────────────────────────────

translation: ## Run translation validation
	cd $(FRONTEND_DIR) && npm run translation:validate

translation-full: ## Run all translation checks (summary, detailed, orphaned)
	cd $(FRONTEND_DIR) && npm run translation:summary
	cd $(FRONTEND_DIR) && npm run translation:detailed
	cd $(FRONTEND_DIR) && npm run translation:orphaned

seo: ## Run SEO structured data tests
	cd $(FRONTEND_DIR) && npm test -- --testPathPattern=seo --watchAll=false --passWithNoTests --coverageThreshold='{}'

# ──────────────────────────────────────────────
# E2E tests (requires Docker + backend + frontend running)
# ──────────────────────────────────────────────

e2e: ## Run Playwright E2E tests (assumes backend + frontend are running)
	cd $(FRONTEND_DIR) && npx playwright test --project=chromium

e2e-install: ## Install Playwright browsers
	cd $(FRONTEND_DIR) && npx playwright install --with-deps chromium

# ──────────────────────────────────────────────
# Utilities
# ──────────────────────────────────────────────

clean: ## Remove build artifacts
	cd $(BACKEND_DIR) && ./gradlew clean
	cd $(FRONTEND_DIR) && rm -rf .next node_modules/.cache

# ──────────────────────────────────────────────
# Help
# ──────────────────────────────────────────────

help: ## Show this help
	@echo ""
	@echo "Caryo Marketplace — Local CI"
	@echo "============================"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make ci               Run full CI pipeline"
	@echo "  make test-backend     Run only backend unit tests"
	@echo "  make test-frontend    Run only frontend tests"
	@echo "  make integration      Run integration tests (needs Docker)"
	@echo ""

.DEFAULT_GOAL := help
