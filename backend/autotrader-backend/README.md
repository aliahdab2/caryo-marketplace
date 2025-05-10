# Autotrader Marketplace Backend

This is the backend service for the Autotrader Marketplace application, built with Spring Boot.

## Prerequisites

- Java 21 or higher
- Gradle (or use the included Gradle wrapper)
- PostgreSQL (for production, H2 is used for development)

## Project Documentation

For a complete overview of the project roadmap and architecture, refer to these project-level documents:

- [Development Plan](/DEVELOPMENT_PLAN.md) - Complete roadmap for the project
- [System Design](/docs/system_design.md) - Architecture and technology choices
- [Testing Plan](/docs/testing_plan.md) - Testing strategy and approach

## Project Structure

```
autotrader-backend/
├── scripts/                                 # Centralized script directory
│   ├── README.md                            # Documentation for all scripts
│   ├── scripts.sh                           # Master script for accessing all scripts
│   ├── dev/                                 # Development environment scripts
│   ├── test/                                # Testing scripts
│   ├── postman/                             # Postman-related scripts
│   └── utils/                               # Utility scripts and templates
├── src/main/java/com/autotrader/autotraderbackend/
│   ├── AutotraderBackendApplication.java    # Main application class
│   ├── config/                              # Configuration classes
│   ├── controller/                          # REST controllers
│   ├── model/                               # Entity models
│   ├── payload/                             # Request/response objects
│   ├── repository/                          # Data access layer
│   ├── security/                            # Security related classes
│   └── service/                             # Service layer
└── src/main/resources/
    └── application.properties               # Application configuration
```

## Getting Started

### Development Environment

The project includes a complete development environment with all necessary components:

```bash
# Start the development environment
./dev-env.sh start

# Or use the unified CLI
./autotrader.sh dev start
```

### Improved Script Infrastructure

The script infrastructure has been improved to provide a more organized and user-friendly experience:

#### 1. Unified CLI Interface

The `autotrader.sh` script provides a comprehensive command-line interface:

```bash
# Development environment management
./autotrader.sh dev start            # Start the development environment
./autotrader.sh dev start --rebuild  # Rebuild and start the environment
./autotrader.sh dev stop             # Stop the environment

# Testing
./autotrader.sh test all             # Run all tests
./autotrader.sh test auth            # Run only authentication tests
./autotrader.sh test reference-data  # Run reference data tests
./autotrader.sh test unit            # Run unit tests
./autotrader.sh test postman         # Run all Postman tests
```

#### 2. Centralized Testing

The testing infrastructure has been unified with:

```bash
# Run tests directly
./run-tests.sh all                   # Run all tests
./run-tests.sh postman auth          # Run specific Postman collection
./run-tests.sh unit                  # Run unit tests
```

#### 3. Fixed Postman Tests

The Postman tests have been improved with consistent API paths, better authentication handling, and improved token management.

# Check the status
./dev-env.sh status

# View the logs
./dev-env.sh logs

# Run tests
./dev-env.sh test

# Stop the development environment
./dev-env.sh stop
```

The development environment includes:
- Spring Boot application with hot reloading
- PostgreSQL database
- MinIO (S3-compatible storage)
- Adminer (database management UI)
- Redis (for caching)

For more details, see the [development environment documentation](.devenv/README.md).

### Building the Application Manually

If you prefer not to use the development environment, you can build and run the application manually:

```bash
./gradlew clean build
```

### Running the Application Manually

```bash
./gradlew bootRun
```

The application will start on port 8080 by default.

> **Quick Start**: For a step-by-step guide on how to test the API endpoints and run the Postman tests, see the [Quick Start Guide](API_DOCUMENTATION.md#quick-start-guide) in the API documentation.

### Environment Configuration

The application uses different configurations for development and production:

- **Development**: Uses H2 in-memory database by default
- **Production**: Requires PostgreSQL database connection

Configure the database connection in `application.properties` for production or use environment variables.

## API Documentation

The API endpoints are documented in detail in the [API_DOCUMENTATION.md](API_DOCUMENTATION.md) file, including:
- Request/response formats
- Authentication requirements
- Example usage with cURL
- Error handling

### Authentication Endpoints

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/signin` - Login and receive JWT token

### Status Endpoints

- `GET /status` - Check if service is running
- `GET /api/status` - Check if API is accessible

### Car Listing Endpoints

- `POST /api/listings` - Create a new car listing
- `GET /api/listings/my-listings` - Get all listings for the current user

Additional endpoints coming soon:
- `GET /api/listings` - Get all car listings
- `GET /api/listings/{id}` - Get car by ID
- `PUT /api/listings/{id}` - Update car listing
- `DELETE /api/listings/{id}` - Delete car listing

## Storage Configuration

This application uses MinIO as its S3-compatible storage backend.

### Setting up MinIO locally

1. Start MinIO using Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. Access the MinIO Console:
   - URL: http://localhost:9001
   - Username: minioadmin
   - Password: minioadmin

3. Create a bucket:
   - Login to the MinIO Console
   - Click "Create Bucket"
   - Name it "autotrader-assets"
   - Set access policy as needed

### Storage Configuration Properties

The following properties can be configured in `application.properties` or via environment variables:

```properties
storage.s3.endpointUrl=http://localhost:9000
storage.s3.accessKeyId=minioadmin
storage.s3.secretAccessKey=minioadmin
storage.s3.bucketName=autotrader-assets
storage.s3.region=us-east-1
storage.s3.pathStyleAccessEnabled=true
storage.s3.signedUrlExpirationSeconds=3600
```

### Storage Service Usage

The application uses a standardized S3-compatible interface for all storage operations. The `StorageService` interface provides the following operations:

- `store(MultipartFile file, String key)`: Upload a file
- `loadAsResource(String key)`: Download a file
- `delete(String key)`: Delete a file
- `getSignedUrl(String key, long expirationSeconds)`: Get a pre-signed URL for temporary access

All operations use the S3 protocol and work with any S3-compatible storage service (MinIO, AWS S3, etc.).

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

#### Enhanced Authentication Tests

We've significantly improved authentication test coverage with comprehensive test suites:

```bash
# Run enhanced authentication Postman tests
./src/test/scripts/run_enhanced_auth_tests.sh

# Run authentication error case integration tests
./gradlew test --tests "com.autotrader.autotraderbackend.controller.AuthControllerErrorCasesIntegrationTest"

# Run comprehensive JWT security tests
./gradlew test --tests "com.autotrader.autotraderbackend.security.jwt.ComprehensiveJwtSecurityTest"
```

See our [enhanced authentication testing documentation](docs/enhanced_auth_testing.md) for details.

#### Running API Tests with Postman/Newman

API tests validate the entire application from a client perspective and require a running instance of the application:

```bash
# Make sure the script is executable
chmod +x src/test/scripts/run_postman_tests.sh

# Run the script
./src/test/scripts/run_postman_tests.sh
```

This script will:
1. Start the Spring Boot application in the background
2. Run Postman tests via Newman against the running application
3. Generate HTML test reports
4. Stop the application automatically when tests complete

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

### Why API Tests Are Not in CI/CD

We've chosen not to include API tests in the CI/CD pipeline for the following reasons:

1. **Resource Constraints**: Starting a full Spring Boot application in CI/CD consumes significant resources.
2. **Timeouts**: These tests may cause workflow timeouts in GitHub Actions, especially if the application takes time to start.
3. **Flakiness**: API tests that require a running application can be more flaky in CI environments, leading to false negatives.
4. **Coverage Redundancy**: Our unit and integration tests already cover much of the same functionality in a more controlled environment.

### Test Coverage Goals

- Unit & Integration Tests: 80%+ code coverage
- Critical paths should have both unit tests and API tests

### Test Tools

- **JUnit 5**: Primary testing framework
- **Spring Test**: For integration testing
- **Mockito**: For mocking dependencies
- **Postman/Newman**: For API testing
- **H2 Database**: In-memory database for testing

## Security

The application uses JWT (JSON Web Token) for authentication. All requests to protected endpoints should include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Development Notes

### H2 Console

The H2 console is enabled in development mode and can be accessed at:

```
http://localhost:8080/h2-console
```

JDBC URL: Check the application startup logs for the current URL

Username: SA
Password: (leave empty)

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

## Using Scripts

We've centralized and simplified the script interface for the project:

### Simplified CLI Interface

We provide a streamlined command-line interface through the `autotrader.sh` script:

```bash
# Make it executable first
chmod +x autotrader.sh

# Get help
./autotrader.sh help
```

### Available Commands

The CLI has a simple, intuitive structure:

```bash
# Development environment commands
./autotrader.sh dev start     # Start the development environment
./autotrader.sh dev stop      # Stop the development environment
./autotrader.sh dev status    # Check environment status
./autotrader.sh dev logs      # View environment logs

# API server commands
./autotrader.sh api start     # Start the API server

# Test commands
./autotrader.sh test all      # Run all tests
./autotrader.sh test auth     # Test authentication endpoints
./autotrader.sh test endpoints # Test API endpoints
./autotrader.sh test reference-data # Test reference data

# Documentation commands  
./autotrader.sh docs generate # Generate API documentation
```

### Script Features

All scripts include:

- **Environment Checks**: Scripts verify if required services are running
- **Comprehensive Documentation**: Each script has a --help option
- **Consistent Output**: Color-coded and well-formatted output
- **Error Handling**: Proper error detection and reporting
- **Flexible Options**: Command-line options for different behaviors

### Advanced Usage

For more advanced use cases, individual scripts are available in the `scripts/` directory:

```
scripts/
├── README.md                 # Documentation for all scripts
├── dev/                      # Development environment scripts
├── test/                     # Testing scripts
├── postman/                  # Postman-related scripts
└── utils/                    # Utility scripts and templates
```

See the [scripts README](scripts/README.md) for complete documentation of all available scripts.
