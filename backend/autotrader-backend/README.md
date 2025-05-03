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

The project includes a complete development environment managed by the `./dev-env.sh` script. This script uses Docker Compose to set up the Spring Boot application, PostgreSQL database, MinIO object storage, and Adminer database management tool.

**Available Commands:**

```bash
# Start the development environment (creates containers if needed)
./dev-env.sh start

# Stop the development environment
./dev-env.sh stop

# Restart the development environment (stop and then start)
./dev-env.sh restart

# Rebuild the environment (stops, removes volumes, pulls images, builds app, starts)
./dev-env.sh rebuild

# Check the status of running containers
./dev-env.sh status

# View the logs from all containers (follow mode)
./dev-env.sh logs

# Run a quick health check of all services
./dev-env.sh health

# Run tests within the app container
./dev-env.sh test

# Show this help message
./dev-env.sh help
```

**Accessing Services:**

Once started, the services are available at:

- **Spring Boot App:** [http://localhost:8080](http://localhost:8080)
- **API Documentation (Swagger UI):** [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
- **MinIO Console:** [http://localhost:9001](http://localhost:9001) (Login: `minioadmin`/`minioadmin`)
- **Adminer (PostgreSQL GUI):** [http://localhost:8081](http://localhost:8081) (Server: `postgres`, User: `postgres`, Password: `postgres`, DB: `autotrader`)
- **Debug Port:** Attach your IDE debugger to port `5005`.

### Running Locally (Without Docker)

If you prefer to run the application directly on your host machine:

1.  **Ensure PostgreSQL is running** and accessible.
2.  **Configure `src/main/resources/application.properties`** with your local database credentials.
3.  **Run the application:**
    ```bash
    ./gradlew bootRun
    ```

## API Documentation

Detailed API documentation is available:

- **Swagger UI:** Accessible at `/swagger-ui/index.html` when the application is running.
- **OpenAPI Spec:** Available at `/v3/api-docs`.
- **Static Documentation:** See [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

### Authentication Endpoints

- `POST /auth/signup` - Register a new user
- `POST /auth/signin` - Login and receive JWT token

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
storage.type=s3
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

#### API Tests with Postman/Newman

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
