# AutoTrader Marketplace Frontend Development Plan

## Project Structure

```plaintext
frontend/
├── components/        # Reusable UI components (buttons, forms, modals, etc.)
├── pages/             # Next.js pages (Home, Listings, Login, etc.)
├── serv#### 3. Monitor & Optimize:
- Monitor user interactions and app performance using tools like **Vercel's built-in monitoring**.
- **Analytics Implementation**:
  - Set up Google Tag Manager (GTM) for flexible tag management.
  - Consider privacy-compliant alternatives like **Plausible** or **Fathom Analytics** if data privacy is a concern.
  - Create custom events to track critical user flows (e.g., listing creation, contact form completion).es/          # API services (fetch data from backend)
├── store/             # Redux state management
├── styles/            # Tailwind CSS and global styles
├── public/            # Static assets (images, fonts, etc.)
└── utils/             # Utility functions
```

## **Frontend Development Roadmap**

### **Phase 0: Setup & Initial Configuration**

#### 1. Project Initialization
- **Tooling**: Set up a **Next.js** app with **TypeScript** for type safety and better developer experience.
- **CSS Framework**: Integrate **Tailwind CSS** for responsive, utility-first styling.
- **Routing**: Leverage **Next.js routing** for seamless navigation between pages and dynamic routes.
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
Organize the frontend project into modular, scalable parts:

```plaintext
frontend/
├── components/        # Reusable UI components (buttons, forms, modals, etc.)
├── pages/             # Next.js pages (Home, Listings, Login, etc.)
├── services/          # API services (fetch data from backend)
├── store/             # Redux state management
├── styles/            # Tailwind CSS and global styles
├── public/            # Static assets (images, fonts, etc.)
└── utils/             # Utility functions
```

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
  - **Note for Next.js**: Next.js typically respects the `baseUrl` and `paths` in `tsconfig.json` automatically. If you\'re using a `src` directory, your path might be `"@/*": ["./src/*"]`. Custom Webpack aliases in `next.config.js` are often not needed for this specific purpose if `tsconfig.json` is set up correctly.

#### 4. Internationalization (i18n) Setup
- ✅ Add support for Arabic and English, with Arabic as the default language.
- ✅ Use **next-i18next** for internationalization and automatic language detection.
- ✅ Organize translations in:
  ```plaintext
  public/
  └── locales/
      ├── ar/
      │   └── common.json
      └── en/
          └── common.json
  ```
- ✅ Create a language switcher (e.g., in the header or settings dropdown).
- Implement the following best practices:
  - ✅ **Default Language Fallback**: Configure `fallbackLng: 'ar'` in `next-i18next.config.js` to prevent undefined behavior.
  - ✅ **Persist Language Selection**: Store user preference in cookies with `setCookie('NEXT_LOCALE', lang)`.
  - ✅ **Locale Detection**: Implement detection order: `['cookie', 'localStorage', 'navigator', 'htmlTag']`.
  - ✅ **Translation Keys Convention**: Use semantic namespacing for translation keys (e.g., `header.login`).
  - ⏳ **Date/Number Localization**: Use `Intl.DateTimeFormat` and `Intl.NumberFormat` for locale-specific formatting.
- ✅ Ensure RTL (Right-to-Left) layout support when Arabic is active:
  - ✅ Tailwind supports RTL with `dir="rtl"` on the `<html>` or `<body>` tag.
  - ✅ You can dynamically set it using:
    ```tsx
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} />
    ```

- ✅ Example next-i18next configuration (`frontend/next-i18next.config.js`):
  ```js
  module.exports = {
    i18n: {
      defaultLocale: 'ar',
      locales: ['en', 'ar'], // Updated to match actual configuration
      fallbackLng: 'ar',
      detection: {
        order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
        caches: ['cookie'],
      },
    },
  };
  ```

### **Phase 1: Core Components & Pages**

#### 1. User Authentication
- ✅ **Authentication Solution**: Implement authentication using **NextAuth.js**.
  - It provides built-in support for JWT, social logins (OAuth), email/password, and other providers.
  - Handles session management securely (e.g., using HttpOnly cookies by default), reducing boilerplate and improving security.
- ✅ **Login/Signup Pages**:
  - Implement **Login** and **Signup** pages. Forms can be managed with **React Hook Form**.
  - `NextAuth.js` will manage the core authentication flow (e.g., credentials provider for email/password).
- ✅ **Protected Routes**: Set up **middleware** or use `NextAuth.js` helper functions (like `getSession` or `useSession`) to protect pages and API routes based on authentication status.
  
#### 2. Navigation & Layout  
- Implement **responsive navigation** (Header and Sidebar) using **Tailwind CSS**.
- Ensure **mobile-first design** for seamless mobile experiences.
- Use semantic HTML and ARIA landmarks (e.g., `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`) for better accessibility.

#### 3. Pages:
- **Home Page**: Display featured cars and categories.
- **Listings Page**: Display all car listings in a grid or card layout with search, filter, and pagination options.
- **Car Details Page**: Show detailed information about a single car listing.
- **User Dashboard**: Show user’s own listings and allow for actions like **pause/resume**, **delete**, etc.
- **Admin Dashboard**: Enable admin functionalities like listing approval, archiving, and marking listings as sold.

#### 4. Reusable Components:
- **Listing Card**: Display car details like make, model, price, and location in a compact card format.
- **Search Filter**: Allow users to filter listings by price, location, brand, etc. Leverage **React Select** for dropdowns.
- **Pagination**: Implement a simple pagination component for navigating through car listings.
- **Loading States**: Create skeleton UIs using Tailwind CSS + Framer Motion for improved perceived performance while data is loading.
  - Implement for listings, detail pages, and dashboard views.
  - Use consistent loading patterns across the application.

### **Phase 2: Dynamic Features**

#### 1. Location System:
- Use a **Location Selector** dropdown to let users choose a location for their car listing.
- Integrate with the **Location API** from the backend to fetch cities and regions dynamically.

#### 2. Car Listings:
- **Listing Form**: Create a form where users can add car details (make, model, price, photos, location, etc.). Use **React Hook Form** for handling the form state and validation.
- **Image Upload**: Integrate **Cloud Storage (S3)** for image uploads. You can use **react-dropzone** for drag-and-drop image uploads.

#### 3. State Management:
- **Primary State Management (Shared/Complex/Remote)**: Utilize **Redux Toolkit** for managing global application state, especially for shared data, complex state logic, and data fetched from the server (potentially via RTK Query).\n  - **RTK Query**: Leverage RTK Query (part of Redux Toolkit) for data fetching and caching, simplifying interactions with the backend API and managing server state.
- **Local/UI State Management (Simple/Component-Specific)**: For simpler UI state (e.g., modal visibility, form input toggles) or component-level state that doesn\'t need to be shared globally, consider:\n  - **React Context API**: Suitable for passing data through the component tree without prop drilling for moderately complex state.
  - **Zustand**: A lightweight, flexible state management solution that can be a good alternative for managing local or domain-specific state without the boilerplate of Redux, especially when Redux feels like overkill.
- **Guideline**:
  - Use Redux Toolkit (+ RTK Query) where it adds clear value: for state that is shared across many components, is complex, or represents remote data that needs caching and synchronization.
  - Avoid over-engineering: Don’t use Redux for trivial UI state that can be easily managed locally within a component or with a simpler solution like Zustand or Context.
- **Hybrid Approach**: A combination of Redux Toolkit (with RTK Query) for global/remote state and Zustand/Context API for more localized or simpler UI state can provide a clean, scalable, and efficient state management strategy.
- **Example**:
  - Redux Toolkit: User authentication status, fetched car listings, global filters.
  - Zustand/Context: State for a multi-step form wizard, visibility of a specific UI element.

#### 4. Routing and Navigation:
- Use **Next.js dynamic routing** to allow deep linking to individual car listing pages (e.g., `/listings/[id]`).
- Implement **clean URLs** using Next.js’s built-in **file-based routing** and **URL parameters**.

### **Phase 3: Performance Optimization**

#### 1. Code Splitting & Lazy Loading:
- **Next.js** supports **automatic code splitting** for pages. You can enhance this by lazy loading heavy components (e.g., modals, maps).
- Implement **dynamic imports** for components that are not immediately necessary.

#### 2. Image Optimization:
- Use **Next.js Image** component to automatically optimize images for different screen sizes and resolutions (WebP, AVIF).

#### 3. Progressive Web App (PWA):
- Integrate **next-pwa** to make the app work offline and support installation on mobile devices.
- Ensure users can access car listings even when they have an unstable or slow internet connection.

#### 4. SEO Optimization
- Use **Next.js Head** component to manage meta tags for SEO (title, description, and keywords).
- Implement **SSG (Static Site Generation)** for car listings to enhance SEO and improve page load speeds.

#### 5. Performance Optimization — Expanded
- **Bundle Analysis**
  - Install and configure `@next/bundle-analyzer`:
    ```bash
    npm install @next/bundle-analyzer
    ```
  - Analyze chunks and reduce vendor bloat.

- **Caching Strategy**
  - SWR/React Query for API caching.
  - Next.js for SSR, SSG, ISR to suit different pages:
    - Listings (SSG/ISR)
    - Dashboard (SSR)

- **Error Monitoring**
  - Integrate Sentry early for runtime error tracking:
    ```bash
    npm install @sentry/nextjs
    ```
  - Configure sourcemaps uploading in CI/CD for accurate stack traces in production.
  - Set up error boundaries to gracefully handle component-level failures.
  
### **Phase 4: User Interactions & Alerts**

#### 1. Notifications:
- Implement **toast notifications** (using a library like **react-toastify**) for actions like adding a listing, successful login, or validation errors.
- Show **in-app alerts** when a listing is near expiration or needs to be renewed.

#### 2. Listing Expiry & Renewal:
- Add a **renewal reminder** if a listing is about to expire, and give users an option to renew their listing directly from the dashboard.

#### 3. User Interactions & Alerts — Expanded
- **Global Error Handling**
  - Centralize with a custom hook or context.
  - Use a global error boundary + `useErrorToast` for unified UX.

### **Phase 5: Testing & Quality Assurance**

#### 1. Unit Tests:
- Write unit tests using **Jest** and **React Testing Library** to ensure key components work as expected (e.g., form validation, listing cards, pagination).

#### 2. End-to-End Tests:
- Use **Cypress** for testing the entire user flow (e.g., signing up, listing a car, searching listings, and filtering results).

#### 3. Performance Testing:
- Use tools like **Lighthouse** to test performance and ensure the app loads fast on mobile devices, especially in areas with low-speed internet.

#### 4. Testing & QA — Expanded
- **Integration Testing**
  - Test component interactions (e.g., form + API + success toast).

- **Accessibility Testing**
  - Integrate axe-core with Jest or Cypress for a11y audits:
    ```bash
    npm install --save-dev @axe-core/react
    ```
- **Visual Regression Testing**
  - Use Chromatic (Storybook) or Percy for snapshot UI testing.

- **Storybook Integration (Recommended)**
  - Build components in isolation and document them.
  - Use as a design system reference for developers and designers.

### **Phase 6: Deployment & CI/CD**

#### 1. CI/CD Pipeline:
- Set up continuous integration and deployment using **GitHub Actions** or **CircleCI**. This will automate testing, linting, and deployment to **Vercel** or **Netlify** (for seamless Next.js deployment).

#### 2. Hosting:
- Deploy the frontend on **Vercel** or **Netlify** for fast, scalable hosting. Both platforms integrate well with **Next.js**.

#### 3. Monitor & Optimize:
- Monitor user interactions and app performance using tools like **Google Analytics**, **Sentry**, and **Vercel’s built-in monitoring**.

#### 4. Deployment & CI/CD — Expanded
- **Environment Management**
  - Different .env files for preview, staging, and production.
  - Set up GitHub Actions matrix for multi-env workflows.

- **Rollback Strategy**
  - Vercel has built-in rollbacks.
  - Alternatively, use feature toggles for safe deployment.

## General Cross-Cutting Enhancements
- **Internationalization (i18n)**
  - Integrate `next-i18next` for multi-language support.
  - Add support for `en` (English) and `ar` (Arabic) with RTL layout handling for Arabic. Arabic will be the default language.
  - Implement proper configuration:
    ```js
    // In next-i18next.config.js
    module.exports = {
      i18n: {
        defaultLocale: 'ar',
        locales: ['en', 'ar'], // Updated to match actual configuration
        fallbackLng: 'ar',
        detection: {
          order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
          caches: ['cookie'], // Cache detected language preference
        }
      }
    }
    ```
  - Organize translations with semantic keys:
    ```json
    {
      "header": {
        "login": "Login",
        "logout": "Logout"
      }
    }
    ```
  - Persist language selection in cookies:
    ```typescript
    i18n.changeLanguage(lang);
    setCookie('NEXT_LOCALE', lang, { maxAge: 60 * 60 * 24 * 365 }); // 1 year
    ```
  - Implement RTL support for Arabic:
    ```tsx
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} />
    ```
  - Use `Intl.DateTimeFormat` and `Intl.NumberFormat` for proper date and currency formatting based on locale.
  - **RTL Testing & Validation**:
    - Set up visual testing specifically for RTL layouts in Storybook.
    - Create RTL-specific test cases to ensure proper layout flipping.
    - Test text alignment, icon positioning, and component flow in RTL mode.
  - **Performance Considerations**:
    - **How to Avoid Slowness (Optimization Strategies):**
      - **Code Splitting & Dynamic Imports:** Only load the translation files needed for the current language and page (as described in your plan).
      - **Namespace-based Loading:** Load only the translation namespaces required for each page/component.
      - **Efficient Language Detection:** Use server-side language detection to avoid unnecessary client-side redirects or re-renders.
      - **Memoization:** Memoize translation components to avoid unnecessary re-renders.
      - **Conditional CSS:** Only load RTL styles when needed.
      - **Bundle Analysis:** Regularly analyze and monitor bundle size, especially after adding new languages.
    - **Bundle Size Optimization**:
      - Implement namespace-based loading to load only required translations for each page
      - Use dynamic imports for language files: `import(`../locales/${locale}/messages`)`
      - Configure code splitting per language to avoid downloading all translations at once:
        ```js
        // next.config.js
        module.exports = {
          i18n: {
            // existing config...
          },
          webpack: (config) => {
            // Create separate chunk for each locale
            config.optimization.splitChunks.cacheGroups.i18n = {
              name: 'i18n',
              test: /locales/,
              chunks: 'all',
            };
            return config;
          },
        }
        ```
    - **Runtime Performance**:
      - **Translation Compilation:** Use translation compilation in production with `react-i18next` to avoid runtime parsing. This is best achieved by pre-compiling translation JSON files or using tools like `i18next-scanner` to generate static translation resources for production builds.
      - **Memoization:** Memoize translation functions and components to prevent unnecessary re-renders. For example:
        ```jsx
        import { Trans } from 'react-i18next';
        import React from 'react';

        const MemoizedTransComponent = React.memo(({ i18nKey }) => {
          return <Trans i18nKey={i18nKey} />;
        });
        ```
        Or, for hooks:
        ```jsx
        import { useTranslation } from 'react-i18next';
        import { useMemo } from 'react';

        function MyComponent() {
          const { t } = useTranslation();
          const label = useMemo(() => t('my.key'), [t]);
          return <span>{label}</span>;
        }
        ```
      - **Avoid Nested Translation Keys:** Avoid nested translation keys in performance-critical components. Deeply nested keys can increase lookup time and reduce maintainability. Prefer flat or shallow key structures for frequently used or performance-sensitive translations. Memoization is especially important in large lists or frequently re-rendered components.
    - **Server-Side Considerations**:
      - **Efficient Language Detection:** Implement efficient language detection (preferably on the server) to avoid unnecessary client-side redirects and ensure users see the correct language immediately.
      - **Pre-compute Translations During SSR:** Pre-compute common translations during server-side rendering (SSR) to avoid hydration mismatches and ensure the initial HTML matches the user's language.
      - **Static Generation with Revalidation:** Use `getStaticProps` with revalidation (Incremental Static Regeneration) for pages with translations that rarely change, improving performance and scalability.
      - **Streaming SSR with Suspense:** Consider implementing streaming SSR with React Suspense boundaries around i18n content to progressively render pages as soon as translations are ready, improving time-to-first-byte and perceived performance.
    - **RTL Performance**:
      - Use CSS logical properties (e.g., `margin-inline-start` instead of `margin-left`) to avoid duplicated RTL styles
      - Implement conditional CSS loading based on direction to avoid unnecessary RTL stylesheets:
        ```tsx
        {locale === 'ar' && <link rel="stylesheet" href="/styles/rtl-specific.css" />}
        ```
      - Consider using CSS variables for direction-sensitive values instead of duplicating entire style rules
    - **i18n Analysis & Monitoring**:
      - Add bundle analyzer configurations specifically for tracking i18n-related bundle size
      - Set up performance monitoring to compare metrics between different languages
      - Create custom performance marks to measure translation loading and application times:
        ```js
        performance.mark('i18n-load-start');
        await i18n.loadNamespaces(['common']);
        performance.mark('i18n-load-end');
        performance.measure('i18n-load', 'i18n-load-start', 'i18n-load-end');
        ```

- **Frontend Security**
  - Use HttpOnly cookies for auth where possible.
  - Escape dynamic HTML. Avoid `dangerouslySetInnerHTML` unless sanitized.
  - Validate all user inputs.

- **Code Documentation**
  - Use JSDoc or TSDoc for key functions and utility libraries.

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
Use OpenAPI or typed API clients (e.g., tRPC, Axios wrapper) to ensure both web and mobile use the same contract.

### 3. Auth Strategy
- **Web Frontend**: Utilize **NextAuth.js** for comprehensive authentication. It can be configured to issue standard JWTs that can be understood by the backend.
- **Mobile App**: If the mobile app uses the same backend:
  - It can authenticate directly against the backend API using the same JWT-based strategy. The backend will issue JWTs that the mobile app can store securely (e.g., in SecureStorage).
  - Ensure the JWTs issued by `NextAuth.js` (for web) and directly by the backend (for mobile or other clients) are compatible if they need to be consumed by the same backend services.
- **Shared Helpers**: Shared login/logout helpers might need to be adapted for platform-specific token handling if not using a fully shared auth module via the monorepo.

### 4. Code Standards
Maintain unified linting, formatting, and naming conventions across all apps for consistent DX (Developer Experience).

## Progressive Enhancement
As the product matures, consider the following progressive enhancements:

- **Web Push Notifications**:
  - Implement web push notifications (e.g., using Firebase Cloud Messaging or a similar service via the Service Worker) for important events like listing renewals, admin approvals, or new messages.
  - This can significantly improve user engagement and retention.

- **Offline Form Submission Queue**:
  - For critical forms (like new listing creation or contact forms), implement an offline submission queue.
  - Utilize Service Workers to cache form data (e.g., in IndexedDB or localStorage) when the user is offline.
  - Sync the queued submissions automatically when the connection is restored (Background Sync API).

---
