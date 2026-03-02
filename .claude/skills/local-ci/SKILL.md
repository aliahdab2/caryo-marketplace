---
name: local-ci
description: Run the right CI checks locally based on what changed — smart test selection
user-invocable: true
---

# Smart Local CI

Run only the CI checks relevant to your changes, or the full pipeline.

## Step 1: Detect What Changed

```bash
git diff --name-only HEAD~1   # last commit
git diff --name-only          # uncommitted changes
git diff --name-only main     # vs main branch
```

## Step 2: Pick the Right Checks

| Files Changed | Commands to Run |
|---|---|
| `frontend/**` | `make lint-frontend && make build-frontend && make test-frontend` |
| `frontend/public/locales/**` | `make translation` |
| `frontend/src/**/*seo*` or structured data | `make seo` |
| `backend/**` | `make test-backend` |
| `backend/**/db/migration/**` | `make test-backend` (Flyway validates on startup) |
| `frontend/e2e/**` | `make e2e` (requires running backend + frontend) |
| Both frontend + backend | `make ci` |
| Not sure / pre-push | `make ci` (full pipeline) |

## Available Makefile Targets

| Target | What It Does |
|---|---|
| `make ci` | Full pipeline: backend tests + frontend lint/build/test + translation + SEO |
| `make test-backend` | Backend unit tests with test profile |
| `make test-frontend` | Frontend lint + build + Jest tests |
| `make lint-frontend` | ESLint only |
| `make build-frontend` | Next.js build only |
| `make build-backend` | Gradle assemble (no tests) |
| `make translation` | Translation validation |
| `make translation-full` | All translation checks (summary + detailed + orphaned) |
| `make seo` | SEO structured data tests |
| `make integration` | Integration tests (needs Docker) |
| `make e2e` | Playwright E2E tests (needs running app) |
| `make services-up` | Start Docker services (db, minio, redis) |
| `make services-down` | Stop Docker services |
| `make clean` | Remove build artifacts |

## Workflow

1. Detect what changed
2. Run the matching checks from the table above
3. Report results — pass/fail for each check
4. If anything fails, show the relevant error output and suggest fixes
