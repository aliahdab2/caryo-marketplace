# Autotrader Marketplace Backend

This is the backend service for the Autotrader Marketplace application, built with Spring Boot.

## Prerequisites

- Java 21 or higher
- Gradle (or use the included Gradle wrapper)
- PostgreSQL (for development and production; H2 is used in unit tests only)

## Project Structure

```
autotrader-backend/
├── src/main/java/com/autotrader/autotraderbackend/
│   ├── AutotraderBackendApplication.java    # Main application class
│   ├── config/                              # Configuration classes
│   ├── constants/                           # Constants
│   ├── controller/                          # REST controllers
│   ├── converter/                           # Type converters
│   ├── dto/                                 # Data transfer objects
│   ├── events/                              # Domain event classes
│   ├── exception/                           # Exception handlers
│   ├── health/                              # Health check components
│   ├── listeners/                           # Event listeners
│   ├── mapper/                              # Entity mappers
│   ├── model/                               # Entity models
│   ├── payload/                             # Request/response objects
│   ├── payment/                             # Payment system (Stripe, PayPal, bank transfer)
│   ├── repository/                          # Data access layer
│   ├── security/                            # Security and rate limiting
│   ├── service/                             # Service layer
│   ├── util/                                # Utility classes
│   └── validation/                          # Custom validators
└── src/main/resources/
    ├── application.properties               # Application configuration
    └── db/migration/                        # Flyway migrations (44 files)
```

## Getting Started

### Building the Application

```bash
./gradlew clean build
```

### Running the Application

```bash
./gradlew bootRun
```

The application will start on port 8080 by default.

> **Quick Start**: For a step-by-step guide on how to test the API endpoints and run the Postman tests, see the [Quick Start Guide](API.md#quick-start-guide) in the API documentation.

### Environment Configuration

The application uses different configurations for development and production:

- **Development**: Uses PostgreSQL via Docker Compose (`docker-compose.dev.yml`)
- **Production**: Requires PostgreSQL database connection
- **Unit Tests**: Uses H2 in-memory database for fast test execution

Configure the database connection in `application.properties` or use environment variables.

## API Documentation

The API endpoints are documented in detail in the [API.md](API.md) file, including:
- Request/response formats
- Authentication requirements
- Example usage with cURL
- Error handling

### Authentication Endpoints

- `POST /auth/signup` - Register a new user
- `POST /auth/signin` - Login and receive JWT token

### Status Endpoints

- `GET /status` - Check if service is running
- `GET /api/status` - Check if API is accessible

### Car Listing Endpoints

- `POST /api/listings` - Create a new car listing
- `GET /api/listings/my-listings` - Get all listings for the current user

- `GET /api/listings` - Get all car listings (paginated, with filters)
- `GET /api/listings/{id}` - Get car by ID
- `PUT /api/listings/{id}` - Update car listing
- `DELETE /api/listings/{id}` - Delete car listing

## Testing

### Testing Approach

Our testing strategy includes three layers:

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test interactions between components
3. **API Tests**: Test the full API from a client perspective

### Running Tests Locally

#### Unit and Integration Tests

To run the unit and integration tests:

```bash
# Navigate to the project directory
cd backend/autotrader-backend

# Run tests with Gradle
./gradlew test
```

These tests do not require a running application and should complete quickly.

#### API Tests with Postman/Newman

API tests validate the entire application from a client perspective and require a running instance of the application:

```bash
# Make sure the script is executable
chmod +x src/test/scripts/run_postman_tests.sh

# Run the script
./src/test/scripts/run_postman_tests.sh
```

This script will:
1. Start the Spring Boot application with test profile (mock email service)
2. Run Postman tests via Newman against the running application
3. Generate HTML test reports
4. Stop the application automatically when tests complete

**Email Testing**: Contact form and email service functionality is comprehensively tested via EmailServiceTest.java (unit tests) and ContactControllerTest.java (integration tests) using mock JavaMailSender, ensuring reliable tests without external SMTP dependencies.

The HTML test reports will be available at `build/test-reports/postman/report.html`.

#### Testing Manually with Postman

You can also run the tests manually using Postman:

1. Start the application:
   ```bash
   ./gradlew bootRun
   ```

2. Import the collection and environment into Postman:
   - Collection: `src/test/resources/postman/autotrader-api-tests.json`
   - Environment: `src/test/resources/postman/environment.json`

3. Run the collection in Postman

#### Using the Testing Scripts

Two scripts are provided to quickly test specific functionality:

1. `test_endpoints.sh` - Test basic HTTP endpoints
2. `test_auth.sh` - Test authentication endpoints

Make them executable before running:

```bash
chmod +x test_endpoints.sh test_auth.sh
```

Example authentication test:

```bash
./test_auth.sh
```

### Why API Tests Are Not in CI/CD

We've chosen not to include API tests in the CI/CD pipeline for the following reasons:

1. **Resource Constraints**: Starting a full Spring Boot application in CI/CD consumes significant resources.
2. **Timeouts**: These tests may cause workflow timeouts in GitHub Actions, especially if the application takes time to start.
3. **Flakiness**: API tests that require a running application can be more flaky in CI environments, leading to false negatives.
4. **Coverage Redundancy**: Our unit and integration tests already cover much of the same functionality in a more controlled environment.

### Test Coverage Goals

- Unit & Integration Tests: 80%+ code coverage
- Critical paths should have both unit tests and API tests

### Test Profiles

- **Default/Dev Profile**: PostgreSQL database for development
- **Test Profile**: H2 in-memory database for fast unit tests, mock email service
- **Integration Tests**: Testcontainers (PostgreSQL, MinIO) for realistic integration testing

### Test Tools

- **JUnit 5**: Primary testing framework
- **Spring Test**: For integration testing with test profiles
- **Mockito**: For mocking dependencies (email service, external APIs)
- **Postman/Newman**: For API testing with test profile
- **H2 Database**: In-memory database for testing
- **Mock Email Service**: TestEmailConfig provides mock JavaMailSender for reliable email testing

## Security

The application uses JWT (JSON Web Token) for authentication. All requests to protected endpoints should include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Internationalization (i18n)

The backend provides comprehensive internationalization support with:
- **Translated Error Messages**: All validation errors and user-facing messages are properly translated
- **Locale Detection**: Automatic locale detection from request headers
- **Message Source Integration**: Spring's MessageSource for centralized translation management
- **Fallback Support**: Graceful fallback to English for missing translations

**Supported Languages:**
- English (en) - Default
- Arabic (ar) - Full RTL support

**Translation Files:**
- `src/main/resources/messages.properties` - English translations
- `src/main/resources/messages_ar.properties` - Arabic translations

## Development Notes

### Database Access

Development uses PostgreSQL via Docker Compose. Access the database through:
- **pgAdmin**: http://localhost:5050 (configured in `docker-compose.dev.yml`)
- **Direct connection**: `jdbc:postgresql://localhost:5432/autotrader`

> **Note**: H2 is only used in unit tests (`testImplementation` dependency), not in development.

### Lombok

This project uses Lombok to reduce boilerplate code. Make sure your IDE has Lombok plugin installed.

## Project Roadmap

Refer to `PROJECT_PLAN.md` for the detailed project roadmap and planned features.

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Make sure you're including the JWT token in your request header
2. **Database Connection**: Verify your PostgreSQL connection details in production

### Logging

Set logging levels in `application.properties`:

```properties
logging.level.org.springframework.web=DEBUG
logging.level.com.autotrader=DEBUG
logging.level.org.springframework.security=DEBUG
```

## Contributing

1. Follow the standard Git flow (feature branches, pull requests)
2. Write tests for new features
3. Update documentation as needed
