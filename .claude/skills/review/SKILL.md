---
name: review
description: Review staged/changed code against project standards, anti-patterns, and best practices
user-invocable: true
---

# Code Review Against Project Standards

## Workflow

1. **Get the diff** — check what changed:
   ```bash
   git diff          # unstaged changes
   git diff --cached # staged changes
   git diff main...HEAD  # all changes vs main branch
   ```

2. **Review each changed file** against the checklists below

3. **Report findings** grouped by severity: Blocking / Warning / Suggestion

---

## Frontend Checklist

### Must-Have
- [ ] No `any` types in TypeScript — use proper types from `types/`
- [ ] No hardcoded user-facing strings — use `t('key')` translation keys
- [ ] No fallback strings in `t()` calls — `t('key')` not `t('key', 'Fallback')`
- [ ] Translation keys are flat camelCase — not dot notation or nested
- [ ] New keys added to BOTH `en/` and `ar/` locale files
- [ ] Feature-specific keys in dedicated namespace — not dumped in `common.json`
- [ ] Uses `notFound()` from `next/navigation` for 404s — not custom logic
- [ ] Error handling uses typed `ApiError` class — not string matching
- [ ] No prop drilling for global state — use Zustand stores
- [ ] RTL support considered for new UI components

### Should-Have
- [ ] React Query hooks for server state (not useState + useEffect fetch)
- [ ] React Hook Form + Zod for form validation
- [ ] `generateMetadata()` for SEO on new pages
- [ ] Loading states via `loading.tsx` or Suspense
- [ ] Error boundaries via `error.tsx`

---

## Backend Checklist

### Must-Have
- [ ] Exceptions handled via `GlobalExceptionHandler` — not ad-hoc try/catch
- [ ] Uses `ErrorResponse` class for error responses — consistent structure
- [ ] Proper HTTP status codes returned (not always 200)
- [ ] Jakarta validation annotations on request DTOs (`@NotNull`, `@Size`, etc.)
- [ ] Database changes via Flyway migration — never manual DDL
- [ ] Integration tests use Testcontainers — not H2
- [ ] No secrets or credentials hardcoded

### Should-Have
- [ ] OpenAPI `@Operation` / `@Tag` annotations on new endpoints
- [ ] Javadoc on public service methods
- [ ] Indexes added for new columns used in queries

---

## Anti-Patterns to Flag

| Anti-Pattern | Correct Approach |
|---|---|
| `message.includes('404')` | Use `ApiError` with `.status` property |
| Custom 404 component logic | Use Next.js `not-found.tsx` |
| H2 in integration tests | Testcontainers with PostgreSQL |
| `any` type | Define proper TypeScript types |
| Silent error swallowing | Handle with user-friendly messages |
| Feature keys in `common.json` | Create dedicated namespace file |
| Nested translation keys | Flat camelCase structure |
| Prop drilling across 3+ levels | Zustand store |

---

## Output Format

```
## Review: [file or PR description]

### Blocking
- [file:line] Description of issue

### Warnings
- [file:line] Description of concern

### Suggestions
- [file:line] Optional improvement

### Summary
X files reviewed, Y issues found (Z blocking)
```
