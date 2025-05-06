# Backend Development Roadmap

This document outlines the development plan for the AutoTrader Marketplace backend.

## Phase 1: User Authentication

- [x] **Setup Spring Security** with JWT for authentication
- [x] **Implement Register API** (accepts user details and stores in DB)
- [x] **Implement Login API** (returns JWT on successful login)
- [x] **Role-based Access Control** (admin/user roles)
- [x] **Test Authentication APIs** with Postman or integration tests

## Phase 2: Car Listings

- [x] **Create Listing API** (upload car info + image)
  - [x] Implement dynamic validation for car model year (1920 - current year)
  - [x] Support both JSON-only and multipart/form-data with image upload
  - [x] Implement robust file validation for uploaded images
- [x] **Get User's Listings API** (return listings for the authenticated user)
- [x] **Get All Listings API** (return a paginated list)
- [x] **Filter Listings API** (by price, location, brand, etc.)
- [x] **Car Details API** (single listing view)
- [x] **Admin Approval** (listings should require admin approval before being visible)
- [x] **Image Upload** (with S3 or local file storage)
  - [x] Set up MinIO as S3-compatible storage 
  - [x] Implement direct file upload endpoints
  - [x] Support for signed URLs for temporary file access
  - [x] Docker setup with automatic bucket creation
- [x] **Test Basic Operations** (for listings)
  - [x] Automated Postman tests for creating listings (with/without images)
  - [x] Tests for retrieving user's listings
- [x] **Test Remaining CRUD Operations** (update and delete)

## Phase 3: Infrastructure & Optimizations

- [ ] **PostgreSQL Setup** (create DB schema for users, listings, etc.)
- [ ] **Flyway for DB Migrations** (auto versioning of database schema)
- [ ] **Set up Redis** (optional, for caching frequently accessed data like listings)
- [x] **Add basic logging** with Lombok's @Slf4j annotation (leveraging Spring Boot's logging infrastructure)
  - [x] Implement logging for controller methods
  - [x] Log file upload operations and validation results
- [x] **Configure application.properties** (database connections, security, file storage)
  - [x] Configure S3 settings (endpoint URL, bucket name, credentials)
  - [x] Set up file size limits and allowed types

## Phase 4: APIs and Testing

- [x] **REST APIs for Car Listings** (DTOs, Validation, Error Handling)
  - [x] Create DTOs for request/response
  - [x] Implement comprehensive field validations
  - [x] Set up proper error handling for invalid data and files
- [x] **Unit tests** with JUnit (for controllers, services, and repositories)
  - [x] Test file validation with dedicated unit tests
  - [x] Test controllers for authentication and car listings
  - [x] Test services with mock repositories
- [x] **Integration tests** (testing the complete flow)
  - [x] Set up Postman collection for API testing
  - [x] Create automated test scripts
  - [x] Generate HTML test reports
- [x] **API Documentation**
  - [x] Comprehensive markdown documentation for all endpoints
  - [x] Examples for all requests/responses
  - [x] Curl samples for manual testing
- [ ] **Swagger/OpenAPI Documentation** (for all public APIs)
- [ ] **API Rate Limiting/Throttling** (optional for security)

## Phase 5: Deployment

- [x] **Dockerize Storage** (set up MinIO with Docker Compose)
  - [x] Configure containers with proper networking
  - [x] Set up volume persistence
  - [x] Add bucket auto-creation service for seamless setup
- [ ] **Dockerize Backend** (create a Docker image for deployment)
- [ ] **Set up CI/CD pipeline** (with GitHub Actions or Jenkins)
- [ ] **Deploy to a cloud platform** (AWS, DigitalOcean, etc.)

## Technical Stack

- **Framework**: Spring Boot
- **Database**: PostgreSQL (H2 for development)
- **Authentication**: JWT
- **Documentation**: Swagger/OpenAPI
- **Testing**: JUnit, Mockito
- **Build Tool**: Gradle
- **CI/CD**: GitHub Actions
