# Caryo Marketplace

Car buying/selling platform for Syria.

## Stack

- **Backend**: Spring Boot 3.5.3 + Java 21 (required) + PostgreSQL + Flyway
- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS + react-i18next (EN + AR with RTL)
- **State**: React Query (server) + Zustand (client)
- **Forms**: React Hook Form + Zod
- **Testing**: Jest + Playwright (frontend), JUnit + Testcontainers (backend)

## Key Directories

```
backend/autotrader-backend/src/main/java/com/autotrader/autotraderbackend/
  controller/ service/ repository/ model/ payload/ exception/ config/

frontend/src/
  app/[locale]/   components/   hooks/queries/   services/   lib/   types/
  public/locales/{en,ar}/  ← translation JSON files
```

## Quick Commands

```bash
make ci                # full CI pipeline
make test-backend      # backend unit tests
make test-frontend     # frontend lint + build + tests
make translation       # translation validation
```

## Essential Rules

- **Follow best practices and industry standards** — use framework-recommended patterns, no shortcuts or quick workarounds
- **Java 21 required** — `sdk use java 21.0.8-zulu`
- **No `any` in TypeScript** — define proper types
- **All user-facing text via i18n** — `t('key')` with no fallback strings
- **Flat camelCase translation keys** — no nesting, no dot notation
- **Feature-specific translation namespaces** — don't dump keys in `common.json`
- **Testcontainers for integration tests** — never H2
- **Flyway for DB changes** — never manual DDL, migrations are immutable
- **RTL support** — all UI must work for Arabic

## Git Commits

- Never include `Co-Authored-By:` lines, AI attribution, or any trailer/footer with Claude's email in commit messages.
- Commit messages should contain only the subject and optional body — no trailers.
- The commit author should always be the user.

## Skills (use `/skill-name` for detailed workflows)

- `/translate` — i18n management: validate, add keys, fix issues
- `/new-migration` — create a Flyway migration with correct versioning
- `/new-endpoint` — scaffold full-stack API endpoint
- `/review` — code review against project standards
- `/local-ci` — run the right CI checks for what changed
- `/diagnose` — troubleshoot environment, build, or test issues
