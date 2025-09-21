# GitHub Copilot Instructions for Caryo Marketplace

## Project Overview
Caryo Marketplace is a bilingual (English/Arabic) car marketplace application built with:
- Backend: Spring Boot 3.2.3 (Java 21)
- Database: PostgreSQL 16 (dev/prod), H2 (test)
- Frontend: Next.js

## Key Architectural Decisions

### Database Design
1. **Multi-Language Support**
   - Tables use `_en` and `_ar` suffix for bilingual fields
   - Example: `name_en`, `name_ar` for display names

2. **Database Environments**
   - Development/Production: PostgreSQL 16
   - Testing: H2 in-memory database
   - Migrations must be compatible with both

3. **Migration Patterns**
   - Version migrations in `db/migration/`
   - Environment-specific migrations in `db/postgresql/` or `db/h2/`
   - Always include rollback procedures
   - Validate pre/post conditions

### Code Style Guidelines

#### SQL
```sql
-- Prefer PostgreSQL 16 compatible syntax
INSERT INTO table_name (column1, column2) 
VALUES ('value1', 'value2')
ON CONFLICT (unique_column) DO UPDATE 
SET column1 = EXCLUDED.column1,
    column2 = EXCLUDED.column2;

-- Prefer: MERGE statements for upserts (PostgreSQL 16 fully supports)
```

#### Java/Spring Boot
```java
// Always include both English and Arabic fields
@Column(name = "name_en")
private String nameEn;

@Column(name = "name_ar")
private String nameAr;

// Use meaningful variable names
@Column(name = "listing_status")
@Enumerated(EnumType.STRING)
private ListingStatus listingStatus;
```

### Error Handling Standards
1. **Database Errors**
   - Always check for existence before operations
   - Use appropriate error codes and messages
   - Include Arabic translations for user-facing errors

2. **API Responses**
   - Follow standard REST practices
   - Include both English and Arabic messages
   - Use proper HTTP status codes

## Development Environment

### Docker Development Environment
```bash
# Start all services
./autotrader.sh dev start

# Rebuild and start
./autotrader.sh dev rebuild

# Stop all services
./autotrader.sh dev stop

# View logs
./autotrader.sh dev logs

# Access specific service logs
./autotrader.sh dev logs <service-name>
```

## Common Tasks

### Creating New Migrations
1. Check existing schema and dependencies
2. Use the template from `db/migration/TEMPLATE.sql`
3. Test against both H2 and PostgreSQL
4. Include validation queries
5. Document rollback procedure

### Running the Application
```bash
# Development with PostgreSQL
./gradlew bootRun --args='--spring.profiles.active=dev'

# Testing with H2
./gradlew bootRun
```

## Repository Structure
```
backend/
  autotrader-backend/
    src/
      main/
        resources/
          db/
            migration/    # Version migrations
            postgresql/   # PostgreSQL specific
            h2/          # H2 specific
          application.properties
          application-dev.properties
```

## Troubleshooting Guide

### Database Connection Issues
1. Check PostgreSQL service:
   ```bash
   brew services list | grep postgres
   ```
2. Verify user permissions:
   ```sql
   SELECT current_user;
   \du
   ```
3. Check database existence:
   ```sql
   \l
   ```

### Migration Failures
1. Verify SQL syntax compatibility
2. Check schema version history
3. Validate table/column existence
4. Review migration order

## Additional Notes

### Documentation
- Always update relevant documentation when making changes
- Include bilingual descriptions where applicable
- Document environment-specific configurations
- Follow the [Translation Guide for Developers](docs/translation_guide_for_developers.md) for i18n implementation

### Translation Guidelines
**CRITICAL: ALL translations must follow the project's translation guide strictly.**

- **MANDATORY**: Follow the [Translation Guide for Developers](docs/development/translation_guide_for_developers.md) for ALL i18n implementation
- **NO HARDCODED STRINGS**: Never use hardcoded text in UI components - always use translation keys
- **RTL COMPLIANCE**: The project supports Arabic RTL layout - all UI must work in both LTR and RTL modes
- **BILINGUAL SYSTEM**: Every user-facing string requires both English and Arabic translations

#### Critical Translation Rules:
1. **Flat Key Structure**: 
   - ✅ DO: `{"signIn": "Sign In", "username": "Username"}`
   - ❌ DON'T: `{"auth": {"signIn": "Sign In"}}`

2. **Namespace Organization**: 
   - ✅ DO: Organize by component/route (`login.json`, `dashboard.json`, `listings.json`)
   - ❌ DON'T: Organize by content type (`buttons.json`, `errors.json`)

3. **Key Naming**: 
   - ✅ DO: Use camelCase (`passwordRequirements`, `videoProTip`)
   - ❌ DON'T: Mix styles (`password_requirements`, `video-pro-tip`)

4. **Usage in Components**:
   ```typescript
   // ✅ Correct usage
   const { t } = useTranslation('listings');
   t('videoProTip', 'Pro tip: Videos increase engagement');
   
   // ❌ Wrong - hardcoded text
   "Pro tip: Videos increase engagement"
   
   // ❌ Wrong - nested key access
   t('listings.videoProTip')
   ```

5. **Complete Coverage**: 
   - Every key in `en/*.json` MUST exist in `ar/*.json`
   - Include fallback values in `t()` calls
   - Test in both languages before committing

6. **RTL Support**:
   - Use the `useRTL` hook for all components requiring RTL support
   - Apply `dir={dir}` and proper RTL utilities to all UI components
   - Test UI layout in both Arabic (RTL) and English (LTR)
   - Ensure text direction and icon positioning work correctly

## RTL (Right-to-Left) Support for Arabic

This project supports both Arabic (RTL) and English (LTR) languages. All components must properly implement RTL support using modern CSS logical properties as the primary approach.

### 🔧 RTL Implementation Strategy

**Primary Approach: CSS Logical Properties (Recommended - 90% of cases)**
```css
/* Modern CSS approach - works automatically in RTL/LTR */
.element {
  margin-inline-start: 1rem;  /* Replaces margin-left/margin-right */
  padding-inline-end: 0.5rem; /* Replaces padding-left/padding-right */
  border-inline-start: 2px solid; /* Replaces border-left/border-right */
  text-align: start; /* Replaces text-left/text-right */
}
```

**Secondary: Tailwind RTL utilities (for edge cases)**
```jsx
// Only when CSS logical properties aren't sufficient
<div className="ml-4 rtl:mr-4 rtl:ml-0">
```

**Minimal Hook: Only for conditional logic (rare cases)**
```typescript
// Use our existing useDirection hook from @/utils/direction
import { useDirection } from '@/utils/direction';

const { isRTL, direction, getClasses } = useDirection();
```

**Use the minimal hook ONLY when you need:**
- Conditional rendering based on direction
- Complex JavaScript calculations
- Dynamic class generation that CSS can't handle

```typescript
// Example: Using CSS logical properties (preferred)
function MyComponent() {
  return (
    <div className="text-start"> {/* Instead of text-left/text-right */}
      <div className="flex gap-4">
        <span className="ms-2"> {/* margin-inline-start */}
          Text
        </span>
      </div>
    </div>
  );
}

// Example: Using minimal hook only when needed
import { useDirection } from '@/utils/direction';

function ConditionalComponent() {
  const { isRTL } = useDirection();
  
  return (
    <div>
      {isRTL ? <ArabicSpecificComponent /> : <EnglishSpecificComponent />}
    </div>
  );
}
```

### 🚫 Common RTL Mistakes to Avoid

**❌ Don't use hardcoded directional classes:**
```typescript
// Wrong - not RTL aware
className="mr-4 ml-2 text-left"

// Better - CSS logical properties
className="me-4 ms-2 text-start"

// Fallback - Tailwind RTL utilities
className="mr-4 ml-2 rtl:ml-4 rtl:mr-2 text-left rtl:text-right"
```

**❌ Don't use `flex-row` without RTL consideration:**
```typescript
// Wrong - doesn't reverse in RTL
className="flex flex-row"

// Better - CSS logical approach
className="flex" // Default flex-row works with CSS logical properties

// Fallback - RTL-aware utility when needed
className={`flex ${flexDirection}`}
```

### 📋 RTL Implementation Checklist

**For every component, ensure:**

1. ✅ Use CSS logical properties (`ms-`, `me-`, `text-start`)
2. ✅ Set `dir="rtl"` on root HTML element (handled by layout)
3. ✅ Replace `ml-`/`mr-` with `ms-`/`me-` (margin-inline-start/end)
4. ✅ Replace `pl-`/`pr-` with `ps-`/`pe-` (padding-inline-start/end)
5. ✅ Use `text-start`/`text-end` instead of `text-left`/`text-right`
6. ✅ Use Tailwind RTL utilities only when CSS logical properties aren't sufficient
7. ✅ Import `useDirection` hook from `@/utils/direction` only for conditional logic
8. ✅ Test both Arabic and English layouts

### 🎯 Priority Components for RTL

**High Priority (User-Facing):**
- Authentication components (`GoogleSignInButton`, `SignInPromptModal`)
- Search and filter components
- Product cards and listings
- Navigation and menus
- Forms and inputs
- Modals and dialogs

**Medium Priority:**
- Admin panels
- Data tables
- Pagination
- Loading states

### 🔍 RTL Testing

Always test components in both languages:
- Switch to Arabic (عربي) in the language switcher
- Verify text flows right-to-left
- Check icon and button positioning
- Ensure proper spacing and alignment

### 📚 RTL Resources

- RTL Hook Documentation: `src/utils/direction.ts` (useDirection hook)
- RTL Styles: `src/app/rtl.css`
- RTL Implementation Guide: `docs/RTL_IMPLEMENTATION.md`
- Cursor Rules: `.cursorrules`

## ♿ Accessibility (A11Y) Guidelines

This project must be accessible to all users, including those with disabilities. All components must follow WCAG 2.1 AA standards and support screen readers, keyboard navigation, and assistive technologies.

### 🔧 Core Accessibility Requirements

**Always implement for every component:**

1. **Semantic HTML**
   - Use proper heading hierarchy (`<h1>`, `<h2>`, etc.)
   - Use semantic elements (`<button>`, `<nav>`, `<main>`, `<aside>`)
   - Avoid generic `<div>` and `<span>` where semantic alternatives exist

2. **Keyboard Navigation**
   - All interactive elements must be keyboard accessible
   - Logical tab order (follows reading direction: LTR/RTL)
   - Visible focus indicators (minimum 3:1 contrast ratio)
   - No keyboard traps (ESC to exit modals/dropdowns)

3. **Screen Reader Support**
   - ARIA labels for complex components when needed
   - Meaningful alt text for images (describe content and function)
   - Proper heading structure and document outline
   - Form labels, fieldsets, and error associations

4. **Color & Visual Design**
   - Minimum 4.5:1 contrast ratio for normal text (WCAG AA)
   - Minimum 3:1 contrast ratio for large text (18pt+ or 14pt+ bold)
   - Don't rely on color alone for information
   - Ensure interactive elements have clear visual states

### 📋 Accessibility Implementation Checklist

**For every component, ensure:**

1. ✅ **ARIA Labels**: `aria-label`, `aria-labelledby`, `aria-describedby`
2. ✅ **Focus Management**: `tabIndex`, `autoFocus`, focus trapping in modals
3. ✅ **Keyboard Support**: Enter/Space for buttons, Arrow keys for navigation
4. ✅ **Screen Reader**: Proper roles, states, and announcements
5. ✅ **Color Contrast**: Test with automated tools
6. ✅ **Alt Text**: Descriptive alternative text for images
7. ✅ **Form Labels**: Every input has an associated label
8. ✅ **Error Messages**: Accessible error announcements

### 🎯 Component-Specific Accessibility

**Buttons & Interactive Elements:**
```tsx
// ✅ Correct
<button
  aria-label="Add to favorites"
  onClick={handleFavorite}
>
  <HeartIcon aria-hidden="true" />
  Favorite
</button>

// ❌ Wrong - missing aria-label for icon-only button
<button onClick={handleFavorite}>
  <HeartIcon />
</button>
```

**Forms:**
```tsx
// ✅ Correct
<label htmlFor="email">Email Address</label>
<input
  id="email"
  type="email"
  aria-describedby="email-error"
  aria-invalid={hasError}
/>
{hasError && (
  <div id="email-error" role="alert">
    Please enter a valid email address
  </div>
)}
```

**Modals & Dialogs:**
```tsx
// ✅ Correct
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Confirm Delete</h2>
  <p id="modal-description">Are you sure you want to delete this item?</p>
  {/* Focus management and keyboard handling */}
</div>
```

**Images:**
```tsx
// ✅ Correct - descriptive alt text
<img
  src="car.jpg"
  alt="Red Toyota Camry 2020 with low mileage"
  loading="lazy"
/>

// ❌ Wrong - generic or missing alt
<img src="car.jpg" alt="Car" />
<img src="car.jpg" /> // Missing alt entirely
```

### 🔍 Accessibility Testing

**Manual Testing:**
- Navigate with keyboard only (Tab, Enter, Space, Arrow keys, Escape)
- Test with screen reader (NVDA, JAWS, VoiceOver, ORCA)
- Verify color contrast with WebAIM Contrast Checker
- Test focus indicators are visible and have 3:1 contrast
- Test with high contrast mode and reduced motion preferences
- Verify touch targets are minimum 44px × 44px

**Automated Testing:**
```bash
# Run accessibility tests
npm run test:a11y

# Lighthouse accessibility audit
npm run lighthouse:a11y
```

### 🛠️ Accessibility Tools & Libraries

**Recommended Libraries:**
- `@radix-ui/react-*` - Accessible, unstyled UI primitives
- `@headlessui/react` - Accessible component primitives
- `react-aria` - Adobe's accessibility-first component library
- `@reach/ui` - Accessible React components

**Development Tools:**
- `eslint-plugin-jsx-a11y` - ESLint rules for accessibility
- `react-devtools` - Accessibility audit in React DevTools
- Browser extensions: axe DevTools, WAVE Evaluation Tool

### 📚 Accessibility Resources

- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- Accessibility Testing Tools: axe-core, lighthouse, WAVE
- React A11Y: https://github.com/reactjs/react-a11y

### 🚫 Common Accessibility Mistakes to Avoid

- Missing alt text on images
- Non-semantic buttons (using `<div>` with click handlers)
- Missing form labels
- Poor color contrast
- No keyboard navigation support
- Missing focus indicators
- Non-descriptive link text ("Click here", "Read more")
- Tables without proper headers
- Missing ARIA labels on complex widgets

### 🎯 Additional Best Practices

**Progressive Enhancement:**
- Ensure core functionality works without JavaScript
- Provide fallbacks for disabled users (reduced motion, high contrast mode)
- Test with JavaScript disabled in browsers

**Performance & Accessibility:**
- Avoid layout shifts that can disorient screen reader users
- Use `prefers-reduced-motion` media queries for animations
- Optimize for touch targets (minimum 44px)

**Inclusive Design:**
- Consider different user capabilities and preferences
- Support multiple input methods (mouse, keyboard, touch, voice)
- Test with various assistive technologies

## 🔧 Code Quality Standards

### 📋 Linting Requirements

**All code must pass linting and testing without errors or warnings:**

1. ✅ **ESLint**: No ESLint errors or warnings
2. ✅ **TypeScript**: No TypeScript compilation errors
3. ✅ **Prettier**: Code must be properly formatted
4. ✅ **Import Order**: Imports must be organized correctly
5. ✅ **Unused Variables**: No unused imports or variables
6. ✅ **Missing Dependencies**: All hook dependencies included
7. ✅ **Frontend Tests**: All Jest/React Testing Library tests pass
8. ✅ **Backend Tests**: All unit and integration tests pass

**Before submitting code:**
```bash
# Frontend - Run linting and testing
npm run lint
npm run type-check
npm run format:check
npm run test

# Backend - Run linting and testing
./gradlew clean test integration

# Auto-fix issues where possible
npm run lint:fix
npm run format
```

**Common Issues to Avoid:**
- ❌ Unused imports or variables
- ❌ Missing dependencies in useEffect/useCallback
- ❌ Incorrect TypeScript types
- ❌ Inconsistent code formatting
- ❌ Missing semicolons or trailing commas
- ❌ Incorrect import order
- ❌ Failing tests (frontend or backend)
- ❌ Breaking existing functionality

**ESLint Configuration:**
- Follow project's ESLint rules in `eslint.config.mjs`
- Use `eslint-plugin-jsx-a11y` for accessibility linting
- Ensure React hooks rules are followed

7. **Database Fields**: 
   - Use `name_en` and `name_ar` pattern for bilingual database fields
   - Return localized content based on Accept-Language header
   - Support both single-language and bilingual API responses

8. **Performance**: 
   - Use `useLazyTranslation` for on-demand namespace loading
   - Load only required namespaces per component
   - Check `ready` state before rendering translated content

#### Common Translation Mistakes to Avoid:
- ❌ **Hardcoded strings**: `"Pro tip: Videos increase engagement"`
- ❌ **Partial translations**: Only English provided, missing Arabic
- ❌ **Nested keys in flat structure**: `t('auth.signIn')` when using namespace
- ❌ **Missing fallbacks**: `t('key')` without fallback value
- ❌ **Wrong namespace**: Using `common:` when key should be in specific namespace
- ❌ **Inconsistent naming**: Mixing `camelCase`, `snake_case`, `kebab-case`
- ❌ **RTL issues**: Using `margin-left` instead of `margin-inline-start`

#### Pre-commit Translation Checklist:
1. ✅ All UI text uses translation keys
2. ✅ Both English and Arabic translations provided
3. ✅ Keys follow flat camelCase structure
4. ✅ Proper namespace organization
5. ✅ Fallback values included in `t()` calls
6. ✅ Tested in both LTR and RTL modes
7. ✅ No hardcoded strings remaining

### Testing
- Write tests for both H2 and PostgreSQL environments
- Include rollback scenarios in tests
- Test bilingual content handling

### Security
- Never commit sensitive credentials
- Use environment variables for secrets
- Follow Spring Security best practices

## Reminders
1. Always test with both databases
2. Keep migrations idempotent
3. Include bilingual support
4. Document breaking changes
5. Follow established naming conventions

## Change Management
- Document all breaking changes
- Include upgrade instructions
- Provide rollback procedures
- Test migration paths
