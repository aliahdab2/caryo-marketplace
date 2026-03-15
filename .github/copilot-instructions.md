# Caryo Marketplace - AI Coding Instructions

> **For GitHub Copilot, VS Code AI, and other AI assistants**

## 🎯 Project Overview

- **Project**: Caryo Marketplace - Car buying/selling platform for Syria
- **Backend**: Spring Boot 3.2.3 + Java 21 (REQUIRED)
- **Frontend**: Next.js 15.5.2 + TypeScript
- **Database**: PostgreSQL (Docker)
- **Storage**: MinIO (S3-compatible)

## 🏆 CRITICAL: Always Follow Best Practices

**Every implementation MUST follow industry standards and best practices. No quick workarounds.**

### Frontend (Next.js/React)

| Pattern | Implementation |
|---------|----------------|
| **404 Pages** | Use `not-found.tsx` with `notFound()` from `next/navigation` |
| **Error Pages** | Use `error.tsx` with proper error boundaries |
| **Loading States** | Use `loading.tsx` or React Suspense |
| **Server State** | Use React Query (`@tanstack/react-query`) |
| **Client State** | Use Zustand (not Redux) |
| **Forms** | Use React Hook Form + Zod validation |
| **API Errors** | Use typed `ApiError` class with HTTP status codes |
| **SEO** | Use `generateMetadata()` for dynamic pages |
| **Styling** | Use Tailwind CSS with dark mode support |
| **i18n** | Use react-i18next with lazy loading |

### Backend (Spring Boot)

| Pattern | Implementation |
|---------|----------------|
| **Error Responses** | Use `ErrorResponse` class with status, message, details, timestamp |
| **Exception Handling** | Add handlers to `GlobalExceptionHandler` |
| **HTTP Status Codes** | Always return proper codes (200, 201, 400, 401, 403, 404, 500) |
| **Database Migrations** | Use Flyway (`V{number}__Description.sql`) |
| **Testing** | Use Testcontainers for integration tests (not H2) |
| **Validation** | Use Jakarta validation annotations |
| **Documentation** | Use OpenAPI/Swagger annotations |

### General Principles

1. **No Quick Workarounds** - Always use the framework's recommended approach
2. **Typed Everything** - Full TypeScript types, no `any`
3. **Proper Error Handling** - Never swallow errors, always handle gracefully
4. **RESTful APIs** - Follow REST conventions strictly
5. **Documentation** - Add JSDoc/Javadoc for public APIs
6. **Testing** - Write tests for new features
7. **RTL Support** - All UI must support Arabic (RTL)

## 🔧 Java Version Requirement

```bash
# This project REQUIRES Java 21
sdk use java 21.0.8-zulu

# Or using system java_home
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
```

## 📁 Key Directories

```
backend/caryo-backend/
├── src/main/java/.../
│   ├── controller/     # REST controllers
│   ├── service/        # Business logic
│   ├── repository/     # Data access
│   ├── model/          # JPA entities
│   ├── payload/        # DTOs (request/response)
│   ├── exception/      # Custom exceptions + GlobalExceptionHandler
│   └── config/         # Configuration classes
├── src/main/resources/
│   ├── db/migration/   # Flyway migrations (V1__, V2__, etc.)
│   └── messages/       # i18n messages (messages_en.properties, messages_ar.properties)

frontend/src/
├── app/[locale]/       # Next.js App Router pages
├── components/         # Reusable React components
├── hooks/queries/      # React Query hooks
├── services/           # API service functions
├── lib/                # Utilities (errors.ts, etc.)
├── types/              # TypeScript type definitions
└── public/locales/     # Translation JSON files (en/, ar/)
```

## 🚀 Common Commands

| Task | Command |
|------|---------|
| Backend build | `cd backend/caryo-backend && ./gradlew build` |
| Backend tests | `cd backend/caryo-backend && ./gradlew test` |
| Frontend dev | `cd frontend && npm run dev` |
| Frontend build | `cd frontend && npm run build` |
| Frontend tests | `cd frontend && npm test` |
| E2E tests | `cd frontend && npx playwright test` |

## ⚠️ Important Constraints

1. **Java 21 Required** - Spring Boot 3.2.3 requires Java 17+, we use Java 21
2. **PostgreSQL Required** - Use Testcontainers for tests, not H2
3. **RTL Support** - All UI components must support Arabic (RTL)
4. **All Tests Must Pass** - Before any deployment
5. **Translations** - All user-facing text must use i18n keys

## 🌐 Translation (i18n) Rules

**Full guide:** `docs/development/translation_guide_for_developers.md`

### Structure Rules

| Rule | Example |
|------|---------|
| **Flat keys** | `"memberSince"` not `"dealer.memberSince"` |
| **camelCase** | `"workingHours"` not `"working_hours"` or `"working-hours"` |
| **Feature namespaces** | Create `dealer.json` for dealer features |
| **No fallbacks in code** | `t('key')` not `t('key', 'Fallback')` |

### Namespace Organization

```
public/locales/en/
  common.json      # Shared (save, cancel, next, previous)
  auth.json        # Authentication
  dealer.json      # Dealer profile features
  listings.json    # Car listings
  dashboard.json   # Dashboard UI
```

### Usage Example

```typescript
// ✅ Correct
const { t } = useTranslation(['dealer', 'common']);
{t('memberSince')}          // From dealer.json
{t('common:saveChanges')}   // From common.json

// ❌ Wrong
const { t } = useTranslation('common');
{t('dealer.memberSince', 'Member since')}  // No dots, no fallbacks
```

## 📝 Code Examples

### Frontend: Proper 404 Handling

```typescript
// app/[locale]/resource/[id]/page.tsx
import { notFound } from 'next/navigation';

export default async function Page({ params }) {
  const data = await fetchResource(params.id);
  if (!data) notFound();
  return <ResourceClient data={data} />;
}

// app/[locale]/resource/[id]/not-found.tsx
export default function NotFound() {
  return <div>Resource not found</div>;
}
```

### Backend: Proper Error Response

```java
@ExceptionHandler(ResourceNotFoundException.class)
public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(new ErrorResponse(404, "Not found", ex.getMessage(), Instant.now().toString()));
}
```

---

*This file is read by AI assistants to understand project conventions.*
