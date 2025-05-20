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
  - [x] Implement JWT-based authentication with token-based stateless sessions
  - [x] Configure proper CORS and security headers
  - [x] Set up proper error handling for authentication failures

- [x] **Implement Register API** (accepts user details and stores in DB)
  - [x] Accept username/email and password (with confirmation)
  - [x] Collect and validate email address (mandatory)
  - [x] Add full name field (mandatory)
  - [x] Add phone number field (optional, for 2FA and recovery)
  - [x] Add location field (optional, for localized experience)
  - [x] Require acceptance of Terms of Service and Privacy Policy
  - [x] Sanitize and validate all input fields
  - [x] Store passwords securely using BCrypt encoding

- [x] **Social Authentication**
  - [x] Implement Google Sign-In integration
  - [x] Create social login endpoint to handle OAuth token verification
  - [x] Auto-create user accounts for new social login users
  - [x] Associate social profile with existing users (by email)
  - [x] Handle profile picture synchronization
  - [x] Add tests for social login functionality

- [x] **Implement Login API** (returns JWT on successful login)
  - [x] Support username/email and password authentication
  - [x] Return JWT token with appropriate expiration
  - [x] Include user roles and basic user info in the response
  - [x] Handle invalid credentials with proper error messages

- [x] **Role-based Access Control** (admin/user roles)
  - [x] Implement role-based authorization with Spring Security
  - [x] Define user and admin roles and permissions
  - [x] Secure endpoints based on user role
  - [x] Support dynamic role assignment during registration

- [x] **Test Authentication APIs** with Postman or integration tests
  - [x] Unit tests for core authentication logic
  - [x] Integration tests for registration and login flows
  - [x] Test edge cases (existing usernames, invalid inputs, etc.)
  - [x] Test social authentication flows
  - [x] Ensure proper error handling and validation

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

- [x] **PostgreSQL Setup** (create DB schema for users, listings, etc.)
  - [x] Configured in docker-compose.dev.yml with proper database initialization
  - [x] Exposed on port 5432 for local development tools
  - [x] PgAdmin integration for easier database management
- [ ] **Flyway for DB Migrations** (auto versioning of database schema)
- [x] **Set up Redis** (implemented caching annotations for location data)
  - [x] Configured in docker-compose.dev.yml with persistent volume
  - [x] Integration documentation in /docs/redis-integration-guide.md
  - [x] Cache configuration for different data types
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
- [x] **Create production-grade Dockerfile for Backend**
  - [x] Multi-stage build (JDK for build → JRE for runtime)
  - [x] Health check configuration
  - [x] Proper security (non-root user)
  - [x] Compatible docker-compose.yml for local development
  - [x] Production environment configuration
- [x] **Enhance docker compose.yml for local dev** 
  - [x] Comprehensive docker-compose.dev.yml configuration with:
    - [x] PostgreSQL with health checks, exposed ports, and initialization scripts
    - [x] MinIO with automatic bucket creation and properly configured permissions
    - [x] MailDev for email testing (web interface on port 1080)
    - [x] PgAdmin for database management (web interface on port 5050)
    - [x] Redis for caching with persistent volume
    - [x] Development-specific Dockerfile (Dockerfile.dev) with remote debugging
    - [x] Hot-reload configuration with volume mounts
    - [x] Enhanced logging and debugging for development
  
- [ ] **Set up CI/CD pipeline** (GitHub Actions: test, build, deploy)
- [x] **Implement Secrets Management** (env vars for local, GitHub Secrets/Vault for prod)
  - [x] HashiCorp Vault integration for secure secrets storage
  - [x] Local development setup with Docker Compose
  - [x] Spring Boot integration for retrieving secrets
  - [x] GitHub Actions integration documentation
  - [x] Migration strategy from hardcoded secrets
- [x] **Enable Monitoring & Health Checks** (Spring Boot Actuator)
- [ ] **Deploy to a cloud platform** (AWS, DigitalOcean, etc.)

### Phase 6: Listing Lifecycle Management (✅ Partially Complete)

#### ✅ Core Listing Status Model (Completed)
  - `isApproved`, `isSold`, `isArchived`, `isUserActive` flags implemented in CarListing model
  - Admin approval functionality in place (approve, archive, mark as sold)
  - User pause/resume listing functionality implemented

#### ✅ REST API Enhancements (Completed)
  - Listing visibility logic updated in public APIs to filter by:
    - `isApproved = true`
    - `isSold = false`
    - `isArchived = false`
    - `isUserActive = true`

#### 🔄 Domain Events Structure (Partially Implemented)
  - ✅ Initial structure for event package created
  - ✅ `ListingApprovedEvent` class implemented
  - ✅ Event classes implementation completed:
    - ✅ `ListingExpiredEvent`
    - ✅ `ListingMarkedAsSoldEvent`
    - ✅ `ListingRenewalInitiatedEvent` (with validation for duration 1-365 days)
  - ❌ Event publishing not yet integrated:
    - Need to inject ApplicationEventPublisher in services
    - Update service methods to publish events on status changes
  - ❌ Event listeners not yet implemented:
    - Create listener package and handler classes
    - Implement event handler methods for emails, logging, etc.

#### 🚧 Package-Based Expiration & Renewal (Planned - Depends on Phase 7)
  - ❌ Calculate expiration based on `listing.createdAt` + `adPackage.durationDays`
  - ❌ Notifications & renewal process:
    - Email/in-app notifications before expiration
    - Options to renew, upgrade, mark as sold, or let expire
  - ❌ Automatic archival for expired listings

#### 🧑‍💻 Frontend Adjustments (Planned)
  - ❌ User dashboard to display listing status
  - ❌ UI controls for pause/resume actions
  - ❌ Renewal/upgrade call-to-action elements
  - ❌ Admin dashboard enhancements

### Phase 7: Pricing & Ad Services (🚧 Coming Up)
📦 **Ad Package System**
  - Entity: `AdPackage` with:
    - `name`, `price`, `durationDays`, `numberOfPhotosAllowed`, `features`
  - Admin APIs:
    - CRUD operations for ad packages
  - UI for managing packages

🔁 **Ad Services & Renewal Logic**
  - APIs:
    - Fetch available packages
    - Renew/upgrade existing listings
  - Users:
    - Select package on creation
    - Renew with same or different package
  - Admin:
    - Adjust package prices and features
  - (Optional): Integrate with payment provider (Stripe, PayPal)
  - Add-ons (optional):
    - Highlight ads
    - Vehicle history reports

## Technical Stack

- **Backend**:

  - Spring Boot
  - PostgreSQL 
  - Redis for caching
  - JWT Authentication
  - MinIO/S3 for file storage
  - MailDev for email testing
  - Swagger/OpenAPI Documentation
  - JUnit, Mockito for testing
  - Docker & Docker Compose for development environment

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
