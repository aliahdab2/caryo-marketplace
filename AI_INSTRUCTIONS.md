# AI Coding Instructions for Caryo Marketplace

> **Universal instructions for all AI assistants (Claude, GPT, Copilot, etc.)**

## 🎯 Golden Rule

**Always implement features using industry best practices and standards. No shortcuts or quick workarounds.**

---

## Project Stack

| Layer | Technology |
|-------|------------|
| Backend | Spring Boot 3.2.3 + **Java 21** (required) |
| Frontend | Next.js 15.5.2 + TypeScript |
| Database | PostgreSQL |
| State | React Query (server) + Zustand (client) |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS |
| i18n | react-i18next (EN + AR with RTL) |
| Testing | Jest + Playwright (frontend), JUnit + Testcontainers (backend) |

---

## Best Practices Checklist

### ✅ Frontend

- [ ] Use Next.js App Router file conventions (`page.tsx`, `not-found.tsx`, `error.tsx`, `loading.tsx`)
- [ ] Use `notFound()` from `next/navigation` for 404s
- [ ] Use `generateMetadata()` for SEO
- [ ] Use typed `ApiError` class for error handling
- [ ] Use React Query hooks for data fetching
- [ ] Use Zustand for UI state (not prop drilling)
- [ ] Use React Hook Form + Zod for forms
- [ ] Support RTL layout for Arabic
- [ ] Add proper TypeScript types (no `any`)

### ✅ Backend

- [ ] Use `ErrorResponse` class for structured errors
- [ ] Add exception handlers to `GlobalExceptionHandler`
- [ ] Return proper HTTP status codes
- [ ] Use Flyway for database migrations
- [ ] Use Testcontainers for integration tests (not H2)
- [ ] Add OpenAPI annotations for documentation
- [ ] Use Jakarta validation annotations

### ✅ General

- [ ] Write tests for new features
- [ ] Add JSDoc/Javadoc comments
- [ ] Follow RESTful conventions
- [ ] Use translation keys for all user-facing text
- [ ] Handle errors gracefully with user-friendly messages

---

## File Structure Reference

```
.
├── backend/autotrader-backend/
│   └── src/
│       ├── main/java/.../
│       │   ├── controller/     # @RestController classes
│       │   ├── service/        # @Service business logic
│       │   ├── repository/     # JPA repositories
│       │   ├── model/          # @Entity classes
│       │   ├── payload/        # DTOs (request/response)
│       │   └── exception/      # Exceptions + GlobalExceptionHandler
│       └── main/resources/
│           ├── db/migration/   # Flyway SQL files
│           └── messages/       # i18n properties
│
└── frontend/src/
    ├── app/[locale]/           # Next.js pages
    ├── components/             # React components
    ├── hooks/queries/          # React Query hooks
    ├── services/               # API functions
    ├── lib/                    # Utilities
    └── types/                  # TypeScript types
```

---

## Quick Commands

```bash
# Backend
cd backend/autotrader-backend
sdk use java 21.0.8-zulu  # REQUIRED
./gradlew build
./gradlew test

# Frontend
cd frontend
npm run dev
npm test
npm run build
```

---

## 🌐 Translation (i18n) Rules

**Reference:** `docs/development/translation_guide_for_developers.md`

### Key Structure
- **Flat keys with camelCase** - NOT nested objects
- **Organize by namespace** (route/feature) - NOT by content type

```json
// ✅ DO: Flat camelCase keys
{
  "signIn": "Sign In",
  "memberSince": "Member since"
}

// ❌ DON'T: Nested or dot notation
{
  "auth": { "signIn": "Sign In" },
  "days.monday": "Monday"
}
```

### Namespace Organization
```
public/locales/en/
  common.json     # Shared UI (buttons, navigation)
  auth.json       # Login, signup, password reset
  dealer.json     # Dealer-specific (profile, hours)
  listings.json   # Car listings
  dashboard.json  # Dashboard UI
```

### Usage in Components
```typescript
// Load namespace(s)
const { t } = useTranslation(['dealer', 'common']);

// Use keys (NO fallback strings - value is in JSON)
{t('memberSince')}           // From primary namespace
{t('common:saveChanges')}    // Explicit namespace
```

### Rules Summary
| ❌ Don't | ✅ Do Instead |
|---------|---------------|
| Add feature keys to `common.json` | Create feature namespace (`dealer.json`) |
| Use dot notation (`days.monday`) | Use camelCase (`monday`) |
| Include fallback strings | Define in JSON file |
| Nest objects in JSON | Keep flat structure |

---

## Anti-Patterns to Avoid

| ❌ Don't | ✅ Do Instead |
|---------|---------------|
| String match errors (`message.includes('404')`) | Use typed `ApiError` with `status` property |
| Custom 404 logic in components | Use Next.js `not-found.tsx` |
| H2 for integration tests | Use Testcontainers with PostgreSQL |
| Hardcoded text | Use i18n translation keys |
| `any` type in TypeScript | Define proper types |
| Swallow errors silently | Handle with user-friendly messages |
| Prop drilling for global state | Use Zustand stores |
| Add feature keys to `common.json` | Create dedicated namespace |
| Nested translation keys | Use flat camelCase structure |

---

*Last updated: 2026-01-16*
