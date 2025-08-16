# Frontend Reference and Development Plan

## Project Structure (Current)

```plaintext
frontend/
├── src/
│   ├── app/                 # Next.js App Router (pages, layouts, route handlers)
│   ├── components/          # Reusable UI/components (forms, modals, listings, layout)
│   ├── hooks/               # Reusable React hooks (incl. i18n, auth, SWR helpers)
│   ├── lib/                 # App-level libraries/config (e.g., auth config)
│   ├── services/            # API service wrappers and error handlers
│   ├── types/               # Centralized TypeScript types/interfaces
│   ├── utils/               # Utilities (i18n, formatting, sanitization)
│   ├── tests/               # Unit/integration tests
│   └── middleware.ts        # Edge middleware (auth, i18n, etc.)
├── public/
│   └── locales/             # i18n translations (flat keys)
│       ├── ar/
│       └── en/
├── scripts/
│   └── diagnostics/         # Dev diagnostics and helpers
└── docs/                    # Project documentation
```

## **Frontend Development Roadmap**

### **Phase 0: Setup & Initial Configuration**

#### 1. Project Initialization
- **Tooling**: Set up a **Next.js** app with **TypeScript** for type safety and better developer experience.
- **CSS Framework**: Integrate **Tailwind CSS** for responsive, utility-first styling.
- **Routing**: Use **Next.js App Router** (`src/app/`) with layouts, server components, and route handlers.
- **Linting & Formatting**: Set up **ESLint**, **Prettier**, and **Husky** (for pre-commit hooks) to ensure code quality and consistency.
  - Example: `npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-prettier husky lint-staged`
- **Version Control**: Initialize the project with **Git** and create the initial commit.

- **Environment Management**:
  - Use `.env.local`, `.env.development`, `.env.production` for environment-specific configurations.
  - Store keys like `NEXT_PUBLIC_API_URL`, auth-related keys, and S3 bucket names securely. Next.js has built-in support for environment variables (prefix public variables with `NEXT_PUBLIC_`).

```bash
npx create-next-app@latest frontend --typescript
cd frontend
npm install tailwindcss postcss autoprefixer
npx tailwindcss init
```

- **Dark Mode Support**:
  - Configure Tailwind for dark mode support:
    ```js
    // tailwind.config.js
    module.exports = {
      darkMode: 'class', // or 'media' for system preference
      // ...rest of config
    }
    ```
  - Add toggle functionality with dark mode state persistent across visits.

#### 2. Folder Structure
See Project Structure above. This project uses App Router and places all source files under `frontend/src/`.

#### 3. Absolute Imports & Path Aliases
- Configure `tsconfig.json` and `next.config.js` to enable absolute imports (e.g., `@/components/*` instead of `../../components/*`) for cleaner import paths.
  - **In `tsconfig.json`**:
    ```json
    {
      "compilerOptions": {
        // ... other options
        "baseUrl": ".",
        "paths": {
          "@/*": ["./*"] // Or your specific source folder e.g., "./src/*"
        }
      }
      // ... other configurations
    }
    ```
  - **Note for Next.js**: Next.js typically respects the `baseUrl` and `paths` in `tsconfig.json` automatically. If you're using a `src` directory, your path might be "@/*": ["./src/*"]. Custom Webpack aliases in `next.config.js` are often not needed for this specific purpose if `tsconfig.json` is set up correctly.

#### 4. Internationalization (i18n) Setup
- ✅ Languages: Arabic (`ar`) and English (`en`).
- ✅ Library: `i18next` + `react-i18next` with `i18next-http-backend` (not `next-i18next`).
- ✅ Translations live under `public/locales/{lng}/{ns}.json` and use flat keys only.
- ✅ Detection order: cookie → path → localStorage → navigator. Cookie key: `NEXT_LOCALE`. Fallback: `en`.
- ✅ RTL support by setting `<html dir>` based on the active language.

Minimal example for setting direction:
```tsx
<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} />
```

Key usage guideline (flat keys):
```json
{
  "login": "Login",
  "logout": "Logout",
  "listings_title": "Latest Listings"
}
```
Use `useTranslation('common')` and reference keys directly, e.g. `t('login')`.

### **Phase 1: Core Components & Pages**

#### 1. User Authentication
- ✅ **NextAuth.js** with App Router route handlers at `src/app/api/auth/[...nextauth]/route.ts` and config in `src/lib/auth-config.ts`.
- ✅ **Login/Signup pages** under `src/app/auth/`.
- ✅ **Protected routes** via middleware and `useAuthSession` hook.

#### 2. Navigation & Layout  
- Implement **responsive navigation** (Header and Sidebar) using **Tailwind CSS**.
- Ensure **mobile-first design** for seamless mobile experiences.
- Use semantic HTML and ARIA landmarks (e.g., `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`) for better accessibility.

#### 3. App Routes:
- **Home/Search**: Discover/search cars.
- **Listings**: Grid/card layout with filters and pagination.
- **Listing Details**: Detailed view with media gallery and specs.
- **Dashboard**: Listings management, saved searches, profile, settings.
- **Admin**: Listing review and moderation.

#### 4. Reusable Components:
- **Listing Card**: Display car details like make, model, price, and location in a compact card format.
- **Search Filter**: Allow users to filter listings by price, location, brand, etc. 
- **Pagination**: Implement a simple pagination component for navigating through car listings.
- **Loading States**: Create skeleton UIs using Tailwind CSS for improved perceived performance while data is loading.

### **Phase 2: Dynamic Features**

#### 1. Location System:
- Use a **Location Selector** dropdown to let users choose a location for their car listing.
- Integrate with the **Location API** from the backend to fetch cities and regions dynamically.

#### 2. Car Listings:
- **Listing Form**: Create a form where users can add car details (make, model, price, photos, location, etc.). Use **React Hook Form** for handling the form state and validation.
- **Image Upload**: Integrate cloud storage for image uploads.

#### 3. State & Data Fetching
- ✅ Prefer local/component state and minimal context.
- ✅ Remote data via **SWR** helpers (`src/hooks/useSWRFetch.ts`). Example:
```tsx
const { data, isLoading, error } = useSWRFetch<Listing[]>("/api/listings");
```
- ➕ Consider lightweight context only when necessary. No Redux/RTK Query is used.

#### 4. Routing and Navigation:
- Use **Next.js App Router** features (layouts, dynamic segments) to enable deep linking.

### **Phase 3: Performance Optimization**

#### 1. Code Splitting & Lazy Loading
- ✅ Next.js App Router provides automatic code splitting.
- 🔄 Use dynamic imports for heavy, non-critical components as needed.

#### 2. Image Optimization
- ✅ Use `next/image` with proper sizes and priorities where appropriate.
- ⏳ Placeholder blur and advanced strategies can be added as needed.

#### 3. Progressive Web App (PWA)
- ⏳ Not configured. Consider `next-pwa` and a service worker if offline support is required.

#### 4. SEO Optimization
- ✅ `next-seo` and `next-sitemap` are available.
- ✅ Use SSG/SSR/ISR per route needs (listing detail can leverage ISR).
- 🔄 Structured data tests present; expand as needed.

#### 5. Performance Optimization — Expanded
- **Bundle Analysis**
  - Use `@next/bundle-analyzer` during builds.
- **Caching Strategy**
  - SWR for API caching.
  - Use SSR/SSG/ISR by route:
    - Listings (SSG/ISR)
    - Dashboard (SSR)
- **Error Monitoring**
  - ⏳ Sentry not configured. Add `@sentry/nextjs` and sourcemaps if needed.
  - Use error boundaries for resilient UI states.

### **Phase 4: User Interactions & Alerts**

#### 1. Notifications
- ✅ Toast notifications for key user actions.
- ⏳ Preferences and advanced categories optional.

#### 2. Listing Expiry & Renewal
- ✅ Expiry notices and translations.
- ⏳ Renewal reminders and flows optional.

#### 3. User Interactions & Alerts — Expanded
- ✅ Centralized API error handler and translated messages.
- 🔄 App-wide error boundary recommended.

### **Phase 5: Testing & Quality Assurance**

#### 1. Unit Tests
- ✅ Jest + React Testing Library configured.
- 🔄 Expand core component and form validation tests.

#### 2. End-to-End Tests
- ⏳ Cypress recommended for critical flows.

#### 3. Performance Testing
- 🔄 Lighthouse audits recommended regularly.

### **Phase 6: Deployment & CI/CD**

#### 1. CI/CD Pipeline
- Use GitHub Actions to automate test, lint, type-check, and deploy to **Vercel**.

#### 2. Hosting
- Deploy the frontend on **Vercel** for fast, scalable hosting.

#### 3. Monitor & Optimize
- Use **Vercel analytics**; add **GTM/GA4** and **Sentry** as needed.

#### 4. Deployment & CI/CD — Expanded
- **Environment Management**
  - Different .env files for preview, staging, and production.
  - Set up GitHub Actions matrix for multi-env workflows.
- **Rollback Strategy**
  - Vercel supports rollbacks; use feature toggles for safe deploys.

## General Cross-Cutting Enhancements
- **Internationalization (i18n)**
  - Use `i18next` + `react-i18next` with HTTP backend.
  - Languages: `en` and `ar` (RTL). Fallback: `en`. Flat translation keys only.
  - Persist selection in cookie/localStorage. Update `<html dir>` dynamically.
  - Use `Intl.*` for locale-aware dates and numbers.
- **Frontend Security**
  - Prefer HttpOnly cookies for auth-sensitive data.
  - Sanitize HTML. Avoid `dangerouslySetInnerHTML` unless sanitized.
  - Validate all user inputs and handle API errors centrally.
- **Code Documentation**
  - Use TSDoc/JSDoc for key utilities and services.

## Shared Code Strategy (Web + Mobile)
To streamline development across web and mobile apps, we’ll extract shared logic into a common library or workspace:

### 1. Shared Package (Optional but Recommended)
Set up a monorepo using Turborepo or Nx.

Create a shared workspace/package for:

- API service definitions
- Auth helpers
- Form validation (e.g., Zod/Yup schemas)
- TypeScript types/interfaces (e.g., User, Listing, Location)

Example structure:
```plaintext
  ├── frontend/       # Web (Next.js)
  └── mobile/         # Mobile (React Native)
  └── shared/         # Reusable code (types, utils, services)
```

### 2. API Consistency
Use OpenAPI or typed API clients (e.g., Axios wrapper) to ensure both web and mobile use the same contract.

### 3. Auth Strategy
- **Web Frontend**: Utilize **NextAuth.js** for comprehensive authentication.
- **Mobile App**: If the mobile app uses the same backend, authenticate directly against the backend API using JWT.

### 4. Code Standards
Maintain unified linting, formatting, and naming conventions across all apps for consistent DX (Developer Experience).

## Progressive Enhancement
As the product matures, consider the following progressive enhancements:

- **Web Push Notifications**:
  - Implement web push notifications for important events like listing renewals, admin approvals, or new messages.
- **Offline Form Submission Queue**:
  - For critical forms (like new listing creation or contact forms), implement an offline submission queue using Service Workers and IndexedDB.

---
