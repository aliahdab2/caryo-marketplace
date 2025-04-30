# Car Marketplace Application

A full-stack application for buying and selling cars, featuring authentication, car listings, and user management.

## Project Documentation

For detailed information about this project, refer to these documents:

- [Development Plan](DEVELOPMENT_PLAN.md) - Complete roadmap for the project
- [System Design](docs/system_design.md) - Architecture and technology choices
- [Testing Plan](docs/testing_plan.md) - Testing strategy and approach

## Project Structure

```
autotrader-marketplace/
├── backend/
│   └── autotrader-backend/   # Spring Boot Java backend
└── frontend/                 # Frontend (coming soon)
```

## Backend

The backend is built with Spring Boot and provides RESTful APIs for authentication and car listings.

See [backend/autotrader-backend/README.md](backend/autotrader-backend/README.md) for detailed backend documentation, including:

- Setup instructions
- API documentation
- Running tests
- Development notes

## API Documentation

Detailed API documentation is available in [backend/autotrader-backend/API_DOCUMENTATION.md](backend/autotrader-backend/API_DOCUMENTATION.md), which includes:

- Authentication endpoints
- Car listing endpoints
- Request/response formats
- Examples using cURL

## Getting Started

### Prerequisites

- Java 21
- Gradle
- Node.js (for frontend, coming soon)
- PostgreSQL (for production)

### Running the Application

#### Backend

```bash
cd backend/autotrader-backend
./gradlew bootRun
```

#### Frontend (coming soon)

```bash
cd frontend
npm start
```

## Contributing

1. Create feature branches from `develop`
2. Write tests for new features
3. Run ALL tests locally before submitting PRs
4. Submit PRs to the `develop` branch

## License

This project is licensed under the MIT License.
