# Local CI

Run the same checks that GitHub Actions runs, but locally.

## Prerequisites

| Tool       | Version | Check              |
|------------|---------|--------------------|
| Java (JDK) | 21+     | `java -version`    |
| Node.js    | 20+     | `node -v`          |
| Docker     | 24+     | `docker --version` |

## Quick start

```bash
# From the project root:
make help          # see all available commands
make ci            # run the full pipeline
```

## Available commands

| Command              | What it does                                        | Needs Docker? |
|----------------------|-----------------------------------------------------|---------------|
| `make ci`            | Full pipeline: backend + frontend + translation + seo | No           |
| `make test-backend`  | Backend unit tests (Gradle + JUnit)                 | No            |
| `make test-frontend` | Frontend lint + build + Jest tests                  | No            |
| `make lint-frontend` | ESLint only                                         | No            |
| `make build-frontend`| Next.js production build                            | No            |
| `make build-backend` | Gradle assemble (no tests)                          | No            |
| `make integration`   | Integration tests with Docker services              | Yes           |
| `make services-up`   | Start Docker services (db, minio, redis)            | Yes           |
| `make services-down` | Stop Docker services                                | Yes           |
| `make translation`   | Translation validation                              | No            |
| `make translation-full` | All translation checks (detailed, unused, orphaned) | No        |
| `make seo`           | SEO structured data tests                           | No            |
| `make e2e`           | Playwright E2E tests (backend + frontend must be running) | Yes    |
| `make e2e-install`   | Install Playwright browsers                         | No            |
| `make clean`         | Remove build artifacts                              | No            |

## Mapping to GitHub Actions workflows

| Makefile target      | GitHub Actions workflow                  |
|----------------------|------------------------------------------|
| `make test-backend`  | `unit-tests.yml`                         |
| `make test-frontend` | `ci-cd.yml` (frontend-build-and-test)    |
| `make integration`   | `integration-tests.yml`                  |
| `make translation`   | `translation-validation.yml`             |
| `make seo`           | `seo-testing.yml`                        |
| `make e2e`           | `e2e-tests.yml`                          |
| `make ci`            | All of the above (except integration/e2e)|

## Notes

- `make ci` does **not** include integration or E2E tests because they require Docker services. Run `make integration` separately.
- `make e2e` assumes the backend (port 8080) and frontend (port 3000) are already running.
- All commands run from the project root.
