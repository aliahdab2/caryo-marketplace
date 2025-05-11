# AutoTrader Marketplace Development Plan

This repository contains the development plan for the AutoTrader Marketplace project, a full-stack application for buying and selling cars.

## Project Structure

```
autotrader-marketplace/
├── backend/         # Spring Boot backend services
├── frontend/        # Frontend application (coming soon)
└── docs/            # Project documentation
```

## Backend Development Roadmap

This section outlines the development plan for the AutoTrader Marketplace backend.

### Phase 1: User Authentication ✅

- [x] **Setup Spring Security** with JWT for authentication
- [x] **Implement Register API** (accepts user details and stores in DB)
- [x] **Implement Login API** (returns JWT on successful login)
- [x] **Role-based Access Control** (admin/user roles)
- [x] **Test Authentication APIs** with Postman or integration tests

### Phase 2: Car Listings ✅

- [x] **Create Listing API** (upload car info + image)
- [x] **Get User's Listings API** (return listings for the authenticated user)
- [x] **Get All Listings API** (return a paginated list of approved listings)
- [x] **Filter Listings API** (by price, location, brand, etc. using JPA Specifications/Criteria API)
- [x] **Car Details API** (single listing view for approved listings)
- [x] **Admin Approval** (listings require admin approval before being visible - implemented with `approved` flag)
- [x] **Image Upload** (with S3-compatible storage)
- [x] **Test Basic Operations** (for listings)
- [x] **Test Remaining CRUD Operations** (update and delete)

### Phase 2.1: Simplified Location System (Inspired by Blocket) ✅

- [x] **Location Data Model** ✅
  - Implement flat `locations` table (id, name, slug, country_code, latitude, longitude)
  - Include `display_name_ar` and `display_name_en` directly in the model for easy rendering
  - Support for URL-friendly slugs generated consistently via a `slugify()` utility
  - Add `region` field for optional grouping (e.g., "Central Syria")
  - Add `is_active` flag to enable/disable locations without deletion
  - Create indexes on `slug` and `country_code` for faster queries

- [x] **Location Data Seeding** ✅
  - Seed major cities and regions in Syria using reliable datasets
  - Include proper UTF-8 encoding for Arabic names
  - Generate search-friendly slugs for all locations

- [x] **Location API Endpoints** ✅
  - Create endpoints to fetch locations by country (GET ?country=SY)
  - Implement search functionality (GET /search?q=dam)
  - Add caching for location data (Redis or in-memory)
  - Expose endpoints for both Arabic and English location names
  - Implement admin-only endpoints for managing locations

- [x] **Integration with Listings** ✅
  - Add location_id foreign key to CarListing entity
  - Enhance filter API to support location-based searches via ?location=damascus
  - Include location details in listing responses (both Arabic and English names)
  - Update existing listings to use the new location system
  - Add location filtering to existing search/filter APIs

- [ ] **Location-based UI Components**
  - Create dropdown/autocomplete city selector in listing form
  - Add location filter to search/listings page
  - Display location name prominently on listing cards and details

### Phase 3: Infrastructure & Optimizations (Partially Complete)

- [ ] **PostgreSQL Setup** (create DB schema for users, listings, etc.)
- [ ] **Flyway for DB Migrations** (auto versioning of database schema)
- [x] **Set up Redis** (implemented caching annotations for location data)
- [x] **Add basic logging** with Lombok's @Slf4j annotation (leveraging Spring Boot's logging infrastructure)
- [x] **Configure application.properties** (database connections, security, file storage)
- [x] **Validate file uploads** (size, format - jpeg, png, webp, etc.)
- [ ] **Implement file cleanup** (mechanism to remove old/unreferenced files)
      _See [docs/file_cleanup_strategies.md](docs/file_cleanup_strategies.md) for design options and recommendations._

### Phase 4: APIs and Testing ✅

- [x] **REST APIs for Car Listings** (DTOs, Validation, Error Handling)
- [x] **Unit tests** with JUnit (for controllers, services, and repositories)
- [x] **Integration tests using Testcontainers** (PostgreSQL, S3/MinIO)
- [x] **Ensure test coverage for key error scenarios** (auth failures, validation errors, upload limits, etc.)
- [x] **API Documentation** (markdown-based for all endpoints)
- [x] **Swagger/OpenAPI Documentation** (for all public APIs)
- [x] **Exception handling** (implemented GlobalExceptionHandler with appropriate status codes and messages)
- [ ] **API Rate Limiting/Throttling** (optional for security)

### Phase 5: Deployment (In Progress)

- [x] **Dockerize Storage** (set up MinIO with Docker Compose)
- [ ] **Create production-grade Dockerfile for Backend**
- [ ] **Enhance docker-compose.yml for local dev** (Backend, PostgreSQL)
- [ ] **Set up CI/CD pipeline** (GitHub Actions: test, build, deploy)
- [ ] **Implement Secrets Management** (env vars for local, GitHub Secrets/Vault for prod)
- [x] **Enable Monitoring & Health Checks** (Spring Boot Actuator)
- [ ] **Deploy to a cloud platform** (AWS, DigitalOcean, etc.)

### Phase 6: Listing Lifecycle Management

- [x] **Add Listing Status Flags** (isApproved)
  - Track listing status through its lifecycle.
  - Default state: `approved = false` (already implemented in CarListing model).
- [x] **Add Additional Status Flags** (isSold, isArchived)
  - Default states: `isSold = false`, `isArchived = false`.

- [x] **Implement User-Controlled Listing Visibility (Pause/Resume)**
  - Add `isUserActive` flag to `CarListing` model (default: `true` for new, approved listings not yet sold or archived).
  - Allow users to temporarily "pause" (hide) their own listings that are currently approved, not sold, and not archived by the system/admin.
  - Allow users to "resume" (unhide) their paused listings, provided the listing is not expired, sold, or archived by the system/admin.
  - Create API endpoints for user pause/resume actions (e.g., `PUT /api/listings/{id}/pause`, `PUT /api/listings/{id}/resume`).
  - Define behavior: User pausing a listing does not stop the package-based expiration timer.

- [ ] **Implement Package-Based Expiration & Renewal Workflow**
  - This feature depends on the "Ad Package Management System" from Phase 7.
  - Listing active duration will be determined by the `durationDays` (or similar) field from the selected `AdPackage`.
  - Calculate expiration date based on `listing.createdAt` (or `activatedAt`) + `adPackage.durationDays`.
  - **Notifications & Renewal Process:**
    - Send email/in-app notifications to users several days before their listing package is due to expire.
    - Notifications should include clear calls to action:
      - Option to "Renew" the current package (potentially for a fee).
      - Option to "Upgrade" to a different package (potentially with a longer duration or more features).
      - Option to "Mark as Sold."
      - Option to "Let it Expire."
  - **Automatic Archival:**
    - If a listing reaches its calculated expiration date and is not renewed or marked as sold, automatically set `isArchived = true` and populate an `archivedAt` timestamp.
    - Ensure this logic respects existing `isSold` or admin-set `isArchived` statuses.
  - The actual expiration period (e.g., 30, 60, 90 days) will be derived from the `AdPackage` associated with the listing.

- [x] **Admin Approval & Listing Workflow**
  - ✅ Implement admin review for approving listings before they go live. (Already implemented with `/{id}/approve` endpoint)
  - ✅ Admins can mark listings as sold or archived. (Implemented through dedicated admin endpoints)

- [x] **API Enhancements**
  - Ensure public listing APIs (e.g., get all listings, search) only return listings that are: `isApproved = true` AND `isSold = false` AND `isArchived = false` AND `isUserActive = true`.
  - APIs for renewal/upgrade will be part of Phase 7.

- [ ] **Frontend Adjustments**
  - User dashboard:
    - Display clear status for each listing (e.g., "Active," "Paused by You," "Awaiting Approval," "Expires in X days," "Expired," "Sold").
    - Provide controls for users to pause/resume their eligible listings.
    - Prominently display renewal/upgrade options for listings nearing expiration.
  - Admin dashboard:
    - Continue to support reviewing, approving, and manually archiving/marking listings as sold.
  - Implement email/in-app notifications for expiration warnings, confirmations, and renewal/upgrade actions.

### Phase 7: Pricing & Ad Services

- [ ] **Create Ad Package Management System** (Store, update, delete ad packages)
  - Each `AdPackage` should define:
    - `name` (e.g., "Basic," "Premium," "Free Trial")
    - `price`
    - `durationDays` (e.g., 30, 60, 90, or -1 for "until sold" if applicable)
    - `numberOfPhotosAllowed`
    - `otherFeatures` (e.g., "highlighted listing," "video upload")
  - Users select an ad package when creating or renewing a listing.
  - Add flexibility to adjust pricing and features easily through an admin interface.

- [ ] **Ad Services & Renewal/Upgrade Logic**
  - Implement API endpoints for:
    - Fetching available ad packages.
    - Allowing users to renew their listing with the same or a different package.
    - Allowing users to upgrade their listing's package.
  - Integrate with a payment gateway if renewals/upgrades are paid.
  - Optional add-ons like "Highlight Ad," "Vehicle History Reports" can be managed here.
  - Admins can adjust the prices for these services dynamically.

## Technical Stack

- **Backend**: 
  - Spring Boot
  - PostgreSQL (H2 for development)
  - JWT Authentication
  - Swagger/OpenAPI Documentation
  - JUnit, Mockito for testing

- **Frontend** (Planned):
  - React.js
  - Redux for state management
  - Material-UI for components
  - Jest and React Testing Library

## Documentation

- [System Design](docs/system_design.md) - Overall architecture and technology choices
- [Backend API Documentation](backend/autotrader-backend/API_DOCUMENTATION.md) - Details on API endpoints and usage
- [Database Schema](docs/database_schema.md) - Complete database structure and relationships
- [Testing Plan](docs/testing_plan.md) - Testing approach and coverage goals
- [Frontend Development Plan](docs/frontend_development_plan.md) - Detailed frontend implementation roadmap
