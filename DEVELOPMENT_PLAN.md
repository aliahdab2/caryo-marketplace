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

### Phase 2: Car Listings

- [x] **Create Listing API** (upload car info + image)
- [x] **Get User's Listings API** (return listings for the authenticated user)
- [ ] **Get All Listings API** (return a paginated list)
- [ ] **Filter Listings API** (by price, location, brand, etc.)
- [ ] **Car Details API** (single listing view)
- [ ] **Admin Approval** (listings should require admin approval before being visible)
- [x] **Image Upload** (with S3-compatible storage)
- [x] **Test Basic Operations** (for listings)
- [ ] **Test Remaining CRUD Operations** (update and delete)

### Phase 3: Infrastructure & Optimizations

- [ ] **PostgreSQL Setup** (create DB schema for users, listings, etc.)
- [ ] **Flyway for DB Migrations** (auto versioning of database schema)
- [ ] **Set up Redis** (optional, for caching frequently accessed data like listings)
- [x] **Add basic logging** with Spring Boot's logging features (SLF4J, Logback)
- [x] **Configure application.properties** (database connections, security, file storage)

### Phase 4: APIs and Testing

- [x] **REST APIs for Car Listings** (DTOs, Validation, Error Handling)
- [x] **Unit tests** with JUnit (for controllers, services, and repositories)
- [x] **Integration tests** (testing the complete flow)
- [x] **API Documentation** (markdown-based for all endpoints)
- [x] **Swagger/OpenAPI Documentation** (for all public APIs)
- [ ] **API Rate Limiting/Throttling** (optional for security)

### Phase 5: Deployment

- [x] **Dockerize Storage** (set up MinIO with Docker Compose)
- [ ] **Dockerize Backend** (create a Docker image for deployment)
- [ ] **Set up CI/CD pipeline** (with GitHub Actions or Jenkins)
- [ ] **Deploy to a cloud platform** (AWS, DigitalOcean, etc.)

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
- [Testing Plan](docs/testing_plan.md) - Testing approach and coverage goals
