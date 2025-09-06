# Caryo Marketplace Application

A modern full-stack application for buying and selling cars, featuring authentication, car listings, location-based filtering, and comprehensive admin management features.

## Project Status

The project is currently in active development with these key features implemented:
- User authentication with JWT and social login
- Car listing management (create, read, update, delete)
- Admin approval workflow for listings
- Location-based filtering system
- Multiple media uploads with S3-compatible storage
- **Hover Image Navigation** - AutoTrader.co.uk style image browsing
- **Internationalization (i18n)** - Full Arabic/English support with RTL
- **Advanced Messaging System** - File uploads with validation and translations
- **CarMediaGallery** - Responsive gallery with RTL support
- Development environment with Docker Compose
- **AutoTrader CLI** - Unified script for development and deployment
- CI/CD workflows with GitHub Actions
- Secrets management with HashiCorp Vault

## 📚 Documentation

**Complete project documentation is organized by category in the [docs/](docs/) directory:**

### 🚀 Quick Start
- **New Developers**: [Setup Guide](#development-setup) - Environment setup using AutoTrader CLI
- **AutoTrader CLI**: [CLI Commands](#autotrader-cli-script) - Unified script for all development tasks
- **API Integration**: [API Documentation](backend/autotrader-backend/API.md) - Complete API reference with examples
- **Current Status**: [Development Plan](DEVELOPMENT_PLAN.md) - Project roadmap and priorities

### 📖 Documentation Categories
- **🏗️ [Architecture](docs/README.md#️-architecture--design)** - System design, database schema, project structure
- **⚙️ [Setup & Configuration](docs/README.md#️-setup--configuration)** - Environment setup, database, OAuth, secrets management  
- **💻 [Development Guides](docs/README.md#-development-guides)** - Frontend development, translations, features
- **🧪 [Testing & Troubleshooting](docs/README.md#-testing--troubleshooting)** - Testing strategies, debugging guides
- **📋 [Implementation Summaries](docs/README.md#-implementation-summaries)** - Completed features and improvements

### 🔗 External Documentation
- [CI/CD Workflows](.github/workflows/README.md) - GitHub Actions setup and usage
- [Backend API](backend/autotrader-backend/API.md) - Complete REST API documentation
- [Redis Integration](backend/autotrader-backend/docs/redis-integration-guide.md) - Caching implementation
- [MailDev Integration](backend/autotrader-backend/docs/maildev-integration-guide.md) - Email testing setup

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Java 21
- Node.js 18+
- Git LFS

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/caryo-marketplace.git
   cd caryo-marketplace
   ```

2. **Start all services using the AutoTrader CLI**:
   ```bash
   cd backend/autotrader-backend
   
   # Start development environment (includes backend, database, and all services)
   ./autotrader.sh dev start
   
   # Or rebuild and start (recommended for first time setup)
   ./autotrader.sh dev rebuild
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

## AutoTrader CLI Script

The project includes a powerful CLI script (`autotrader.sh`) that simplifies development and deployment tasks:

### Development Commands

```bash
cd backend/autotrader-backend

# Start development environment
./autotrader.sh dev start                      # Start all services
./autotrader.sh dev start --rebuild            # Rebuild and start
./autotrader.sh dev start --rebuild --skip-tests # Rebuild without tests and start

# Manage development environment
./autotrader.sh dev rebuild                    # Rebuild environment
./autotrader.sh dev rebuild-notest             # Rebuild without tests
./autotrader.sh dev stop                       # Stop all services
./autotrader.sh dev restart                    # Restart services
./autotrader.sh dev status                     # Check service status
./autotrader.sh dev logs                       # View service logs
./autotrader.sh dev health                     # Health check
```

### Production Commands

```bash
# Production deployment
./autotrader.sh prod deploy                    # Build and deploy production
./autotrader.sh prod rebuild                   # Rebuild production (no data seeding)
./autotrader.sh prod clean-rebuild             # Wipe DB/volumes and rebuild from scratch
./autotrader.sh prod backup                    # Create DB/uploads/logs backups
./autotrader.sh prod health                    # Check production health
```

### API Server Commands

```bash
# API server management
./autotrader.sh api start                      # Start API server only
./autotrader.sh api start --rebuild            # Rebuild and start API server
```

### Testing Commands

```bash
# Run tests
./autotrader.sh test all                       # Run all tests
./autotrader.sh test auth                      # Run authentication tests
./autotrader.sh test endpoints                 # Test API endpoints
```

### Documentation Commands

```bash
# Generate documentation
./autotrader.sh docs generate                  # Generate API documentation
```

### Help

```bash
./autotrader.sh help                           # Show all available commands
```

### Benefits of Using AutoTrader CLI

- **Unified Interface**: Single script for all development tasks
- **Environment Management**: Handles Docker containers, databases, and services
- **Simplified Workflow**: No need to remember complex Docker Compose commands
- **Built-in Health Checks**: Automatic service health monitoring
- **Flexible Options**: Support for rebuilding, skipping tests, and custom configurations
- **Production Ready**: Includes production deployment and backup commands

## Backend

The backend is built with Spring Boot and provides RESTful APIs for authentication and car listings.

See [backend/autotrader-backend/README.md](backend/autotrader-backend/README.md) for detailed backend documentation, including:

- Setup instructions
- API documentation
- Running tests
- Development notes

## API Testing

### Using AutoTrader CLI (Recommended)

```bash
cd backend/autotrader-backend

# Run all tests
./autotrader.sh test all

# Run specific test suites
./autotrader.sh test auth        # Authentication tests
./autotrader.sh test endpoints   # API endpoint tests
```

### Quick API Tests (Alternative)
Run all API tests locally with a single command:

```bash
# Run Postman API tests
./run-postman-tests.sh
```

This script will:
- Check if Newman (Postman CLI) is installed and install it if needed
- Verify the Spring Boot backend is running
- Execute all API tests with authentication
- Generate an HTML report at `results/html-report.html`

### Manual API Testing
You can also run tests manually:

```bash
# Install Newman if not already installed
npm install -g newman newman-reporter-htmlextra

# Run tests manually
newman run "./backend/autotrader-backend/src/test/resources/postman/autotrader-api-collection.json" \
  --environment "./postman/test_environment.json" \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export results/html-report.html
```

## API Documentation

Detailed API documentation is available in [backend/autotrader-backend/API.md](backend/autotrader-backend/API.md), which includes:

- Authentication endpoints
- Car listing endpoints  
- Reference data endpoints (governorates, brands, models)
- Request/response formats
- Examples using cURL
- Postman collection usage

## Quick Start Guide

### Prerequisites

- Docker and Docker Compose
- Java 21+
- Node.js 18+
- Git LFS

### Running the Application

#### Using AutoTrader CLI (Recommended)

```bash
# 1. Start all backend services (database, API, storage, etc.)
cd backend/autotrader-backend
./autotrader.sh dev rebuild  # First time setup
# or
./autotrader.sh dev start    # Subsequent runs

# 2. Start frontend development server
cd ../../frontend
npm install
npm run dev
```

#### Manual Setup (Alternative)

```bash
# Backend
cd backend/autotrader-backend
./gradlew bootRun

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

## Contributing

1. Create feature branches from `develop`
2. Write tests for new features
3. Run ALL tests locally before submitting PRs
4. Submit PRs to the `develop` branch

## License

This project is licensed under the MIT License.
