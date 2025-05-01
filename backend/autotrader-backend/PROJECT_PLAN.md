# Backend Development Roadmap

This document outlines the development plan for the AutoTrader Marketplace backend.

## Phase 1: User Authentication

- [x] **Setup Spring Security** with JWT for authentication
- [x] **Implement Register API** (accepts user details and stores in DB)
- [x] **Implement Login API** (returns JWT on successful login)
- [x] **Role-based Access Control** (admin/user roles)
- [x] **Test Authentication APIs** with Postman or integration tests

## Phase 2: Car Listings

- [ ] **Create Listing API** (upload car info + image)
  - [x] Implement dynamic validation for car model year (1920 - current year)
- [ ] **Get All Listings API** (return a paginated list)
- [ ] **Filter Listings API** (by price, location, brand, etc.)
- [ ] **Car Details API** (single listing view)
- [ ] **Admin Approval** (listings should require admin approval before being visible)
- [ ] **Image Upload** (with S3 or local file storage)
- [ ] **Test CRUD Operations** (for listings)

## Phase 3: Infrastructure & Optimizations

- [ ] **PostgreSQL Setup** (create DB schema for users, listings, etc.)
- [ ] **Flyway for DB Migrations** (auto versioning of database schema)
- [ ] **Set up Redis** (optional, for caching frequently accessed data like listings)
- [ ] **Add basic logging** with Spring Boot's logging features (SLF4J, Logback)
- [ ] **Configure application.properties** (database connections, security)

## Phase 4: APIs and Testing

- [ ] **REST APIs for Car Listings** (DTOs, Validation, Error Handling)
- [ ] **Unit tests** with JUnit (for controllers, services, and repositories)
- [ ] **Integration tests** (testing the complete flow)
- [ ] **Swagger/OpenAPI Documentation** (for all public APIs)
- [ ] **API Rate Limiting/Throttling** (optional for security)

## Phase 5: Deployment

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
