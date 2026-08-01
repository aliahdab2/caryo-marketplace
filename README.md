# Caryo Marketplace Application

A modern full-stack application for buying and selling cars, featuring authentication, car listings, location-based filtering, and comprehensive admin management features.

## Project Status

Active development. **Not yet launched.**

### Implemented

- User authentication with JWT (refresh + rotation) and Google social login
- Car listing management (create, read, update, delete) with an admin approval workflow
- Full-text and faceted search, location-based filtering, saved searches with alerts
- Multiple media uploads with S3-compatible storage, imgproxy resizing, image moderation
- **Messaging** between buyers and sellers, with file attachments — HTTP polling, not push
- **Internationalization** — Arabic/English with RTL, 100% key parity enforced in CI
- **CarMediaGallery** — responsive gallery with video support and touch gestures
- Dealer accounts: public storefront profile, stock dashboard, leads, trial tracking
- Trust & safety: user reports, user blocking, image moderation queue
- SEO: server-rendered pages, Vehicle JSON-LD, dynamic sitemaps
- Development environment with Docker Compose; production stack with nginx, TLS, Redis, scheduled backups
- **Caryo CLI** — unified script for development and deployment
- CI/CD workflows with GitHub Actions; secrets management with HashiCorp Vault

### Not yet implemented

These are known gaps, not oversights — see [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md):

- **Payment gateway** — provider not yet chosen. Only manual bank transfer is implemented;
  the Bemo Bank, Cham Bank, and PayPal providers are placeholders that return
  `PROVIDER_NOT_IMPLEMENTED`.
- **Subscription activation** — verifying a payment marks the transaction complete but does
  not yet upgrade the dealer's tier, and no scheduled job expires trials or advances billing.
- **Real-time messaging** — there is no WebSocket or SSE layer; the client polls.
- **Private-seller monetization** — extra listings, highlights, and bump-ups are priced in
  `docs/PRICING.md` but not built.
- **Phone/OTP authentication**, **PWA/mobile app**, and **web analytics**.

## 📚 Documentation

**Complete project documentation is organized by category in the [docs/](docs/) directory:**

### 🚀 Quick Start
- **📁 Project Structure**: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - **READ FIRST** - Project organization guide
- **☕ Java 21 Setup**: [setup/JAVA_SETUP_INSTRUCTIONS.md](setup/JAVA_SETUP_INSTRUCTIONS.md) - **REQUIRED** Java 21 configuration
- **🚀 Quick Setup**: Run `setup/setup-java21.sh` - One-click environment setup
- **📖 API Documentation**: [backend/caryo-backend/API.md](backend/caryo-backend/API.md) - Complete API reference
- **📋 Development Plan**: [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) - Project roadmap and current status

### 📖 Documentation Categories
- **🏗️ [Architecture](docs/README.md#️-architecture--design)** - System design, database schema, project structure
- **⚙️ [Setup & Configuration](docs/README.md#️-setup--configuration)** - Environment setup, database, OAuth, secrets management  
- **💻 [Development Guides](docs/README.md#-development-guides)** - Frontend development, translations, features
- **🧪 [Testing & Troubleshooting](docs/README.md#-testing--troubleshooting)** - Testing strategies, debugging guides
- **📋 [Implementation Summaries](docs/README.md#-implementation-summaries)** - Completed features and improvements

### 🔗 External Documentation
- [CI/CD Workflows](.github/workflows/docs/WORKFLOWS_OVERVIEW.md) - GitHub Actions setup and usage
- [Backend API](backend/caryo-backend/API.md) - Complete REST API documentation
- [Redis Integration](backend/caryo-backend/docs/redis-integration-guide.md) - Caching implementation
- [MailDev Integration](backend/caryo-backend/docs/maildev-integration-guide.md) - Email testing setup

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

2. **Start all services using the Caryo CLI**:
   ```bash
   cd backend/caryo-backend
   
   # Start development environment (includes backend, database, and all services)
   ./caryo.sh dev start
   
   # Or rebuild and start (recommended for first time setup)
   ./caryo.sh dev rebuild
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
│   └── caryo-backend/   # Spring Boot backend (Gradle)
│       ├── src/              # Source code
│       ├── docker-compose.dev.yml  # Development Docker setup
│       ├── Dockerfile        # Production Docker image
│       └── Dockerfile.dev    # Development Docker image
├── docs/
│   ├── integration/          # 🚗 CarQuery/SyrianCars integration docs
│   ├── architecture/         # System architecture documentation
│   ├── setup/               # Setup and configuration guides
│   └── testing/             # Testing documentation
├── testing/
│   └── integration/         # 🧪 Integration testing scripts
│
├── frontend/                 # Next.js 16 frontend
│   ├── src/                  # Source code (components, hooks, services, etc.)
│   └── public/               # Static assets and translation files
│
└── .github/                  # GitHub configurations
    └── workflows/            # GitHub Actions CI/CD
```

## CI/CD Pipeline

This project uses GitHub Actions for CI/CD with three main workflows:

1. **Main Pipeline**: Builds and tests both frontend and backend
2. **Integration Tests**: Runs tests requiring Docker services
3. **API Tests**: Executes Postman collections

For details on the CI/CD setup, see the [CI/CD Documentation](.github/workflows/docs/WORKFLOWS_OVERVIEW.md).

## Caryo CLI Script

The project includes a powerful CLI script (`caryo.sh`) that simplifies development and deployment tasks:

### Development Commands

```bash
cd backend/caryo-backend

# Start development environment
./caryo.sh dev start                      # Start all services
./caryo.sh dev start --rebuild            # Rebuild and start
./caryo.sh dev start --rebuild --skip-tests # Rebuild without tests and start

# Manage development environment
./caryo.sh dev rebuild                    # Rebuild environment
./caryo.sh dev rebuild-notest             # Rebuild without tests
./caryo.sh dev stop                       # Stop all services
./caryo.sh dev restart                    # Restart services
./caryo.sh dev status                     # Check service status
./caryo.sh dev logs                       # View service logs
./caryo.sh dev health                     # Health check
```

### Production Commands

```bash
# Production deployment
./caryo.sh prod deploy                    # Build and deploy production
./caryo.sh prod rebuild                   # Rebuild production (no data seeding)
./caryo.sh prod clean-rebuild             # Wipe DB/volumes and rebuild from scratch
./caryo.sh prod backup                    # Create DB/uploads/logs backups
./caryo.sh prod health                    # Check production health
```

### API Server Commands

```bash
# API server management
./caryo.sh api start                      # Start API server only
./caryo.sh api start --rebuild            # Rebuild and start API server
```

### Testing Commands

```bash
# Run tests
./caryo.sh test all                       # Run all tests
./caryo.sh test auth                      # Run authentication tests
./caryo.sh test endpoints                 # Test API endpoints
```

### Documentation Commands

```bash
# Generate documentation
./caryo.sh docs generate                  # Generate API documentation
```

### Help

```bash
./caryo.sh help                           # Show all available commands
```

### Benefits of Using Caryo CLI

- **Unified Interface**: Single script for all development tasks
- **Environment Management**: Handles Docker containers, databases, and services
- **Simplified Workflow**: No need to remember complex Docker Compose commands
- **Built-in Health Checks**: Automatic service health monitoring
- **Flexible Options**: Support for rebuilding, skipping tests, and custom configurations
- **Production Ready**: Includes production deployment and backup commands

## Backend

The backend is built with Spring Boot and provides RESTful APIs for authentication and car listings.

See [backend/caryo-backend/README.md](backend/caryo-backend/README.md) for detailed backend documentation, including:

- Setup instructions
- API documentation
- Running tests
- Development notes

## API Testing

### Using Caryo CLI (Recommended)

```bash
cd backend/caryo-backend

# Run all tests
./caryo.sh test all

# Run specific test suites
./caryo.sh test auth        # Authentication tests
./caryo.sh test endpoints   # API endpoint tests
```

### Manual API Testing
You can also run tests manually:

```bash
# Install Newman if not already installed
npm install -g newman newman-reporter-htmlextra

# Run tests manually
newman run "./backend/caryo-backend/src/test/resources/postman/caryo-api-collection.json" \
  --environment "./postman/test_environment.json" \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export results/html-report.html
```

## API Documentation

Detailed API documentation is available in [backend/caryo-backend/API.md](backend/caryo-backend/API.md), which includes:

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

#### Using Caryo CLI (Recommended)

```bash
# 1. Start all backend services (database, API, storage, etc.)
cd backend/caryo-backend
./caryo.sh dev rebuild  # First time setup
# or
./caryo.sh dev start    # Subsequent runs

# 2. Start frontend development server
cd ../../frontend
npm install
npm run dev
```

#### Manual Setup (Alternative)

```bash
# Backend
cd backend/caryo-backend
./gradlew bootRun

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

## Contributing

1. Create feature branches from `main`
2. Write tests for new features
3. Run ALL tests locally before submitting PRs
4. Submit PRs to the `main` branch

## License

This project is licensed under the MIT License.
