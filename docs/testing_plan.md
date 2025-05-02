# Testing Strategy

This document outlines the testing approach for the Autotrader Marketplace application.

## Unit Testing
- **Backend:** JUnit 5 and Mockito are used for unit testing individual classes.
    - **Services/Controllers:** Often tested with Mockito to mock dependencies (repositories, other services).
    - **Utility Classes/POJOs:** Classes like `FileValidator` or simple data objects are typically tested as plain Java objects without Spring context. Different configurations can be tested by directly instantiating the class with various parameters in the test setup (`@BeforeEach`).
- **Frontend:** Jest and React Testing Library are used for testing React components in isolation.

## Integration Testing
- **Backend:** Spring Boot Test (`@SpringBootTest`) is used for integration testing components within the Spring context.
    - **Database Interaction:** TestContainers or an in-memory database (like H2, configured in `application-test.properties`) are used to test repository and service layers involving database operations.
    - **API Endpoints:** `MockMvc` is used to test controller endpoints without needing a running server.
    - **External Services (e.g., S3):** Mock beans (using `@MockBean`) or local mock servers (like LocalStack via TestContainers) can be used.

## E2E Testing
- Cypress for frontend/backend testing

## Code Coverage Goals
- Unit Tests: 80%+ coverage for backend services
- E2E Tests: 100% critical user journeys
