---
name: translate
description: Manage translations (i18n) — validate, add keys, fix issues, check coverage for EN/AR locales
user-invocable: true
---

# Translation Management

This project uses **react-i18next** with lazy-loaded JSON namespaces supporting English (LTR) and Arabic (RTL).

## Translation File Structure

```
frontend/public/locales/
├── en/          # English (source of truth)
│   ├── common.json, auth.json, listings.json, dealer.json, dashboard.json,
│   │   home.json, profile.json, messages.json, favorites.json, payment.json,
│   │   contact.json, errors.json, admin.json, admin-reports.json,
│   │   blocked-users.json, datamanagement.json, mediaGallery.json
└── ar/          # Arabic (must mirror EN exactly)
    └── (same files)
```

## Key Rules

1. **Flat keys with camelCase** — never nested objects, never dot notation
   - GOOD: `"memberSince": "Member since"`
   - BAD: `"dealer.memberSince"` or `{ "dealer": { "memberSince": "..." } }`

2. **Feature-based namespaces** — don't dump everything in `common.json`
   - `common.json` = shared UI only (save, cancel, next, previous, loading)
   - Create feature files: `dealer.json`, `payment.json`, etc.

3. **No fallback strings in code** — value lives in the JSON file
   - GOOD: `t('memberSince')`
   - BAD: `t('memberSince', 'Member since')`

4. **Namespace loading** — components load only what they need
   ```typescript
   const { t } = useTranslation(['dealer', 'common']);
   t('memberSince')           // from dealer.json (primary)
   t('common:saveChanges')    // cross-namespace reference
   ```

5. **Both locales must stay in sync** — same keys in EN and AR

## Available npm Scripts

Run from `frontend/` directory:

| Command | Purpose |
|---------|---------|
| `npm run translation:validate` | Quick summary validation |
| `npm run translation:summary` | Output summary report |
| `npm run translation:detailed` | Detailed report with all issues |
| `npm run translation:missing` | Find missing keys (AR vs EN) |
| `npm run translation:duplicates` | Find duplicate keys across files |
| `npm run translation:fix-duplicates` | Auto-fix duplicates |
| `npm run translation:orphaned` | Find keys not used in code |
| `npm run translation:orphaned-safe` | Safe orphaned check (conservative) |
| `npm run translation:remove-orphaned` | Remove unused keys |
| `npm run translation:incomplete` | Check incomplete translations |
| `npm run translation:sync-check` | Check EN/AR sync status |
| `npm run translation:usage-analysis` | Analyze key usage in codebase |
| `npm run translation:maintenance` | Run full maintenance workflow |

## Workflow

When the user asks to work with translations:

1. **First**: Run `npm run translation:validate` from `frontend/` to see current status
2. **Adding keys**: Add to both `en/<namespace>.json` and `ar/<namespace>.json`
3. **After changes**: Run `npm run translation:sync-check` to verify EN/AR parity
4. **Cleanup**: Use `npm run translation:orphaned-safe` to find unused keys
5. **Full audit**: Run `npm run translation:maintenance` for comprehensive check
