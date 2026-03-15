# Caryo Marketplace - Syrian Car Marketplace Platform

A modern, bilingual car marketplace platform for Syria built with Next.js 15, featuring comprehensive internationalization, advanced search capabilities, and a robust user management system.

## 🚗 **About Caryo.sy**

Caryo Marketplace is a comprehensive car trading platform designed for the Syrian market with:
- **Bilingual Support**: Full Arabic and English localization with RTL support
- **Age-Appropriate Access**: 16+ browsing, 18+ selling policy
- **Advanced Search**: Multi-criteria car search with filters
- **Dealer Management**: Separate dealer and private seller flows
- **Real-time Messaging**: Integrated communication system
- **SEO Optimized**: Dynamic sitemap and meta tag generation
- **Responsive Design**: Mobile-first approach with responsive components

## 🏗️ **Architecture Overview**

### **Technology Stack**
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom RTL support
- **Testing**: Jest + React Testing Library
- **Internationalization**: React i18next
- **State Management**: React Context + SWR
- **Forms**: React Hook Form with validation

### **Core Features**
- **Authentication System**: JWT-based auth with session management
- **Car Listings**: Advanced listing creation with media upload
- **Search & Filters**: Multi-criteria search with real-time filtering
- **User Dashboard**: Comprehensive dashboard for buyers, sellers, and dealers
- **Messaging System**: Real-time communication between users
- **Favorites System**: Save and manage favorite listings
- **Responsive Design**: Mobile-first with RTL support

## 📋 **Age Policy (Caryo.sy)**

Following industry standards and Syrian market needs:

| Activity | Age Requirement | DOB Required | Notes |
|----------|-----------------|--------------|-------|
| **Browse & Search** | 16+ | ❌ Optional | Low barrier for user acquisition |
| **Create Account** | 16+ | ❌ Optional | No DOB required during signup |
| **Sell Cars** | 18+ | ✅ Required | DOB must be provided to list cars |
| **Dealer Registration** | 18+ | ✅ Required | Business verification required |

**Implementation**: Context-based validation system that adapts requirements based on user actions.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Development Testing Hub

The project includes a centralized testing hub accessible at [http://localhost:3000/dev-testing](http://localhost:3000/dev-testing) that provides:

- Links to all component testing pages
- Easy access to UI component previews and tests
- Navigation to specific testing utilities

Available test pages include:
- Captcha verification testing
- Success alert component testing
- Image gallery testing

This hub makes it easier to test individual components in isolation and verify translations are working correctly.

## SEO Files Generation

**Important**: The `sitemap.xml` and `robots.txt` files are automatically generated and should NOT be committed to the repository.

### How it works:
- Files are generated during build via the `postbuild` script
- Uses `next-sitemap` package with environment-based configuration
- URLs are dynamically set based on `SITE_URL` environment variable

### Environment Setup:
```bash
# Development (.env.local)
SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Production
SITE_URL=https://caryo-marketplace.com
NEXT_PUBLIC_SITE_URL=https://caryo-marketplace.com
```

### Manual Generation:
```bash
npm run postbuild  # Generates sitemap.xml and robots.txt
```

This prevents localhost URLs from being committed and ensures proper SEO configuration in production.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## API Error Handling

The application implements a standardized approach to API error handling with:

- Consistent error objects
- User-friendly error messages with translations
- Proper error classification

For more details, see [API Error Handling Documentation](docs/api_error_handling.md).

## 🌍 **Internationalization (i18n) System**

Comprehensive bilingual support with advanced translation management:

### **Core Features**
- **React i18next Integration**: Full internationalization framework
- **Arabic/English Support**: Complete translation coverage with RTL support
- **Translation Namespaces**: Organized translation files by feature area
- **Automated Translation**: AI-powered translation tools for consistency
- **Translation Validation**: Automated checks for completeness and consistency
- **Translation Integrity**: Key synchronization and duplicate detection
- **Fallback Support**: Graceful handling of missing translations

### **Supported Languages**
- **English (en)** - Default language
- **Arabic (ar)** - Full RTL support with proper text direction

### **Translation Namespaces**

| Namespace | Purpose | File Location |
|-----------|---------|---------------|
| `common` | Common UI elements, buttons, navigation | `public/locales/{lang}/common.json` |
| `auth` | Authentication, login, signup, validation | `public/locales/{lang}/auth.json` |
| `admin` | Admin panel translations | `public/locales/{lang}/admin.json` |
| `admin-reports` | Admin reports management page | `public/locales/{lang}/admin-reports.json` |
| `blocked-users` | Blocked users management page | `public/locales/{lang}/blocked-users.json` |
| `dashboard` | Dashboard UI and navigation | `public/locales/{lang}/dashboard.json` |
| `profile` | User profile management | `public/locales/{lang}/profile.json` |
| `listings` | Car listings, details, management | `public/locales/{lang}/listings.json` |
| `search` | Search filters, results, sorting | `public/locales/{lang}/search.json` |
| `favorites` | Favorites system, saved listings | `public/locales/{lang}/favorites.json` |
| `validation` | Form validation messages | `public/locales/{lang}/validation.json` |
| `errors` | Error messages and API responses | `public/locales/{lang}/errors.json` |
| `messages` | Messaging system translations | `public/locales/{lang}/messages.json` |
| `home` | Homepage content and features | `public/locales/{lang}/home.json` |

### **Translation Management Tools**

The project includes a comprehensive translation management suite:

```bash
# Validate all translations
npm run translation validate

# Check translation integrity (key sync, duplicates)
npm run translation integrity-check

# Fix translation guide violations
npm run translation fix-guide

# Analyze translation usage in components
npm run translation usage-analysis

# Sync keys between languages
npm run translation sync-check
```

### **Translation Guidelines**
- **Flat Keys**: All keys use camelCase without dots (except for pluralization)
- **No Prefixes**: Namespace prefixes are handled by i18next, not in keys
- **Consistent Naming**: Keys follow consistent camelCase patterns
- **Complete Coverage**: All user-facing text must be translatable

## 🚀 **Key Features & Recent Improvements**

### **Age Policy Implementation (Caryo.sy)**
Smart age validation system adapted for Syrian market:
- **16+ Browsing**: Low barrier for user acquisition
- **18+ Selling**: Legal protection for transactions
- **Context-Based Validation**: Different requirements for different actions
- **Optional DOB**: No date of birth required during signup
- **Dealer Verification**: Business document validation for dealers

### **Advanced Translation System**
Comprehensive internationalization management:
- **13 Translation Namespaces**: Organized by feature area
- **Automated Translation Tools**: AI-powered consistency
- **Translation Integrity Checks**: Key synchronization and duplicate detection
- **Guide Compliance**: Automated fixing of translation violations
- **Usage Analysis**: Identify unused translation keys

### **Translation Management Tools**
Complete suite for translation maintenance:
```bash
# Core validation and analysis
npm run translation validate          # Validate all translations
npm run translation integrity-check   # Check key sync and duplicates
npm run translation usage-analysis    # Find unused keys

# Automated fixes
npm run translation fix-guide         # Fix guide violations
npm run translation sync-check        # Sync missing keys

# Maintenance workflows
npm run translation maintenance       # Complete translation workflow
```

### **Enhanced User Experience**
- **Hover Image Navigation**: autotrader.co.uk style image navigation
- **Advanced Messaging**: File uploads with validation and progress indicators
- **Responsive Media Gallery**: RTL-aware gallery with keyboard navigation
- **Smart Search Filters**: Real-time filtering with translation support
- **SEO Optimization**: Dynamic sitemap generation and meta tags

### **Technical Improvements**
- **TypeScript Coverage**: Comprehensive type safety
- **Testing Suite**: Jest + React Testing Library with RTL support
- **Error Boundaries**: Graceful error handling with user feedback
- **Performance Optimization**: Lazy loading and code splitting
- **Accessibility**: WCAG compliant with screen reader support

### **Recent Architectural Changes**
- **Namespace Organization**: Separated admin, profile, and validation namespaces
- **Translation Consolidation**: Unified translation management tools
- **Age Validation Refactor**: Context-based validation system
- **Removed Dependencies**: Cleaned up unused packages and scripts
- **Code Quality**: Enhanced linting and testing coverage
