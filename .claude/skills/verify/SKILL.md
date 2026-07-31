---
name: verify
description: The mandatory verification loop after ANY code change — unit tests, static checks, AND real-browser click testing via Playwright. Run before claiming work is done, before committing, and always before pushing.
---

# Caryo Verification Loop

**Every change gets the full loop. "Tests pass" is not done — the app must be
exercised in a real browser.** This is the project's default way of working.

## One command

```bash
./scripts/verify.sh              # DEFAULT GATE: frontend + backend + ALL e2e
./scripts/verify.sh --frontend   # type-check + lint + translations + jest
./scripts/verify.sh --backend    # gradle test
./scripts/verify.sh --smoke      # e2e: seo-smoke + auth specs (fast subset)
```

The full e2e suite is green as of 2026-07-31 (legacy debt triaged: wizard walks
all 4 steps for real, messaging targets the leads route as dealer, favorites
uses the per-card toggle, subscription mocks the v1 API path). Keep it green —
a red default gate gets ignored, which is worse than no gate.

Scope to what changed: backend-only change → `--backend --smoke`; frontend
change → `--frontend --e2e` (or `--smoke` for small changes); anything touching
auth, SSR, i18n, routing, or layout → the full loop.

The script manages servers itself: starts the backend dev stack (docker) if
:8080 is down and a dev frontend on :3210 if needed, and kills what it started.

## Machine constraints (this workstation)

- Ports **3000–3005 belong to jawab24** — caryo frontend always runs on
  **3210** (dev/e2e) or **3220** (prod-parity standalone). Never kill node
  processes broadly (`pkill -f "next dev"` hits the other project).
- Backend dev stack: `caryo_dev` compose project,
  `backend/caryo-backend/.devenv/docker-compose.dev.yml`. CORS already allows
  3210/3220.
- Test accounts: `user/Password123!`, `admin/Admin123!`, `dealer/Dealer123!`.

## Click-testing conventions (learned the hard way)

- E2E specs live in `frontend/e2e/tests/`, run with
  `E2E_BASE_URL=http://localhost:3210 npx playwright test --project=chromium`.
- SSR guarantees (lang/dir, Vehicle JSON-LD, sitemap, security headers) are
  guarded by `seo-smoke.spec.ts` — it asserts on the RAW response; keep it
  green, it protects the July 2026 SEO work.
- Settings/notification toggles are `sr-only` checkboxes — click the parent
  `<label>`, not the input.
- Don't use `waitUntil: 'networkidle'` on authenticated pages — background
  polling keeps the network busy; use `'load'` plus a short timeout.
- The sign-in form is gated by SimpleVerification (auto-completes); wait for
  `[data-testid="success-icon"]` before clicking submit.
- If Playwright browsers are missing/mismatched: `npx playwright install
  chromium` (or launch with `channel: 'chrome'` to use installed Chrome).
- For ad-hoc visual checks beyond the specs, write a throwaway Playwright
  script, take screenshots, and READ them — rendered pages reveal bugs
  (raw i18n keys, untranslated names, broken images) that DOM greps miss.

## When prod-parity matters (SSR, headers, standalone)

Dev mode differs from production. For SSR/SEO/build changes, verify against a
standalone build:

```bash
cd frontend && SITE_URL=http://localhost:3220 npm run build
SDIR=$(dirname "$(find .next/standalone -maxdepth 2 -name server.js)")
rm -rf "$SDIR/.next/static" "$SDIR/public"
cp -R .next/static "$SDIR/.next/static" && cp -R public "$SDIR/public"
PORT=3220 NEXTAUTH_SECRET=local-test-secret NEXT_PUBLIC_API_URL=http://localhost:8080 node "$SDIR/server.js"
```

Always `rm -rf` the old static/public copies first — mixing hashed chunks from
two builds breaks all JS/CSS and produces misleading test results. Stop any
server already holding the port before starting a new one.
