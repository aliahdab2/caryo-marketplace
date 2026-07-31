# i18n Server-Side Rendering Migration Plan

**Status:** Planned — not started
**Goal:** Fully-translated server-rendered HTML per locale (Arabic first), eliminating the English-fallback flash and completing the SEO work landed in `2f3c0e89`.

## Why

After `2f3c0e89`, the site server-renders real content, but translations still
load in the browser: the server renders the inline English fallback of every
`t('key', 'Fallback')` call, then the client swaps in the real strings. For an
Arabic-first market this is backwards — `/ar` pages SSR English UI labels, and
`<html>` gets its `lang`/`dir` only client-side (RTL flash).

## Current surface (measured 2026-07-31)

| Metric | Count |
|---|---|
| Files using `useTranslation` (react-i18next) | 109 |
| Files using `useLazyTranslation` | 34 |
| `<Trans>` component usages | 5 files |
| Translation namespaces | 24 × 2 locales (856 keys, 100% parity) |
| `changeLanguage` call sites | 5 |
| Server-side `lang`/`dir` on `<html>` | **none** (client effect only) |

## Decision: keep react-i18next, add SSR — do NOT migrate to next-intl

143 files consume the react-i18next hook API. Migrating to next-intl would
rewrite imports and key access in every one of them for zero user-visible gain
over the official i18next App Router SSR recipe, which keeps the existing API
and JSON files untouched. Revisit next-intl only if we ever leave
react-i18next for other reasons.

## Phases

### Phase 0 — RTL/lang flash fix (independent quick win, ~half day)

- Set `lang={locale}` and `dir={locale === 'ar' ? 'rtl' : 'ltr'}` on `<html>`
  **server-side** in the locale layout (today only `suppressHydrationWarning`
  is set; I18nProvider mutates `document.documentElement` in an effect).
- Remove the now-redundant client mutation.
- **Gate:** `curl /ar` shows `<html lang="ar" dir="rtl">` in raw HTML.

### Phase 1 — Server-side resource loading + synchronous client hydration (~1–2 days)

The core of the migration (official i18next app-router pattern):

1. `src/app/i18n/server.ts`: per-request `createInstance()` that loads
   namespace JSON from the filesystem (`public/locales/{lng}/{ns}.json`) —
   no HTTP fetch on the server.
2. Locale layout loads the `common` namespace server-side and passes
   `{ locale, resources }` to `I18nProvider`.
3. `I18nProvider` initializes the client instance **synchronously** with the
   injected resources (`initImmediate: false`), so the first client render
   matches the server HTML. The HTTP backend stays for lazily loaded
   namespaces after hydration. Remove the remaining `mounted`/`isLoading`
   state entirely.
4. Language switching (5 call sites) keeps working: it navigates to the other
   locale prefix, which re-runs the server load.
- **Gates:** `curl /ar` body contains Arabic `common` strings (not English
  fallbacks); zero hydration-mismatch warnings in the browser console;
  full Jest suite green.

### Phase 2 — Namespace preloading for SEO-critical routes (~1–2 days)

`useLazyTranslation` (34 files) loads page namespaces client-side, so page-
specific labels still SSR as fallbacks after Phase 1. Fix where it matters:

- Add an explicit route → namespaces map (home, cars/search, listing detail,
  dealer profile, auth pages).
- Each of those layouts/pages passes its namespaces to the server loader so
  the SSR HTML is fully translated.
- Dashboard/admin routes are behind auth (no SEO value) — leave lazy.
- **Gate:** `/ar/cars/...` and `/ar/listings/[id]` SSR HTML contains zero
  English fallback strings from their own namespaces.

### Phase 3 — Localized metadata + hardening (~1 day)

- `generateMetadata` on listing/dealer/home pages currently hardcodes English
  (`"... | Caryo Marketplace"`). Localize titles/descriptions per locale using
  the server loader.
- Add an SSR smoke check to the local CI script: production build → curl
  `/en` + `/ar` + one listing → assert lang/dir, Arabic content, JSON-LD.
- Update I18nProvider/layout tests for the new props.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Hydration mismatches (server strings ≠ client first paint) | Synchronous client init from injected resources (Phase 1.3); verify console on all key pages |
| Payload growth (resources inlined into HTML) | Only inject the namespaces the route needs; `common` is small; monitor page size in the Phase 3 smoke check |
| `useLazyTranslation` double-loading a preloaded namespace | It already checks `isNamespaceLoaded` — verify with the debug utility |
| Regression risk concentrated in one provider | Each phase is an independent commit verified by the production-build harness before the next starts |

## Explicitly out of scope

- next-intl migration (documented above)
- Translating listing user content (belongs to the AI-translation backend
  feature, already present server-side)
- Auth.js v5, Spring Boot 4 (separate tracks)

## Definition of done

`curl -s https://<host>/ar/listings/<id>` returns HTML where: `<html lang="ar"
dir="rtl">`, all UI labels are Arabic, Vehicle JSON-LD present, and the
browser console shows no hydration warnings — with the full Jest suite and
translation validation green.
