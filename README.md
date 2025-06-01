# Caryo Marketplace Application

A modern full-stack application for buying and selling cars, featuring authentication, car listings, location-based filtering, and comprehensive admin management features.

## Project Status

The project is currently in active development with these key features implemented:
- User authentication with JWT and social login
- Car listing management (create, read, update, delete)
- Admin approval workflow for listings
- Location-based filtering system
- Multiple media uploads with S3-compatible storage
- Development environment with Docker Compose
- CI/CD workflows with GitHub Actions
- Secrets management with HashiCorp Vault

## Project Documentation

For detailed information about this project, refer to these documents:

- [Development Plan](DEVELOPMENT_PLAN.md) - Complete roadmap and current status
- [System Design](docs/system_design.md) - Architecture and technology choices
- [Testing Plan](docs/testing_plan.md) - Testing strategy and approach
- [CI/CD Documentation](.github/workflows/README.md) - GitHub Actions workflows
- [Secrets Management](docs/secrets_management.md) - HashiCorp Vault implementation
- [Spring Vault Integration](docs/spring_vault_integration.md) - Spring Boot and Vault integration
- [GitHub Actions and Vault](docs/vault_github_actions_integration.md) - CI/CD pipeline with Vault
- [Migrating to Vault](docs/migrating_to_vault.md) - Strategy for migrating secrets
- [Redis Integration](backend/autotrader-backend/docs/redis-integration-guide.md) - Guide for Redis caching
- [MailDev Integration](backend/autotrader-backend/docs/maildev-integration-guide.md) - Email testing setup
- [Translation Guide](docs/translation_guide_for_developers.md) - Internationalization best practices

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Java 17
- Node.js 18+
- Git LFS

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/caryo-marketplace.git
   cd caryo-marketplace
   ```

2. **Start the backend services**:
   ```bash
   cd backend/autotrader-backend
   docker-compose -f docker-compose.dev.yml up -d
   
   # Optional: Start and initialize HashiCorp Vault for secrets management
   ./start-vault.sh
   ```

3. **Start the frontend development server**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - MailDev: http://localhost:1080
   - PgAdmin: http://localhost:5050
   - MinIO Console: http://localhost:9001
   - Vault UI: http://localhost:8200 (token: caryo-dev-token)

## Developer Guidelines for Large Files

This repository uses Git LFS (Large File Storage) to handle large files. To work with this repository:

1. **Install Git LFS**:
   ```bash
   # macOS
   brew install git-lfs

   # Ubuntu/Debian
   sudo apt-get install git-lfs
   ```

2. **Initialize Git LFS**:
   ```bash
   git lfs install
   ```

3. **Large file types that are automatically tracked by Git LFS**:
   - Binary files: `.jar`, `.war`, `.zip`, `.tar.gz`
   - Node.js binaries: `.node`
   - Minified JavaScript: `.min.js`
   - Images: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`

4. **Do not commit**:
   - `node_modules` directories
   - Build directories (`build`, `target`, etc.)
   - Database files
   - Log files
   - Large data exports
   - Any file larger than 50MB

## Project Structure

```
caryo-marketplace/
├── backend/
│   └── autotrader-backend/   # Spring Boot backend (Gradle)
│       ├── src/              # Source code
│       ├── docker-compose.dev.yml  # Development Docker setup
│       ├── Dockerfile        # Production Docker image
│       └── Dockerfile.dev    # Development Docker image
│
├── frontend/                 # React/Next.js frontend
│   ├── src/                  # Source code
│   ├── public/               # Static assets
│   └── components/           # React components
│
├── .github/                  # GitHub configurations
│   └── workflows/            # GitHub Actions CI/CD
│
└── docs/                     # Project documentation
```

## CI/CD Pipeline

This project uses GitHub Actions for CI/CD with three main workflows:

1. **Main Pipeline**: Builds and tests both frontend and backend
2. **Integration Tests**: Runs tests requiring Docker services
3. **API Tests**: Executes Postman collections

For details on the CI/CD setup, see the [CI/CD Documentation](.github/workflows/README.md).

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
- Node.js (for frontend)
- PostgreSQL (for production)

### Running the Application

#### Backend

```bash
cd backend/autotrader-backend
./gradlew bootRun
```

#### Frontend 

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
