# Caryo Marketplace CI/CD Documentation

This directory contains GitHub Actions workflow configurations for the Caryo Marketplace project, a modern car listing platform with comprehensive Docker-based development environment.

## Table of Contents

- [Application Status Overview](#application-status-overview)
- [CI/CD Workflows](#cicd-workflows)
  - [Main CI/CD Pipeline](#1-cicd-pipeline-ci-cdyml)
  - [Integration Tests](#2-backend-integration-tests-integration-testsyml)
  - [API Tests](#3-postman-api-tests-postman-testsyml)
- [Required GitHub Secrets](#setting-up-required-secrets)
- [Environment Configurations](#local-vs-ci-environment)
- [Testing Strategy](#testing-strategy)
- [Workflow Triggers](#workflow-triggers)
- [Troubleshooting Common Issues](#troubleshooting-common-issues)
- [Development Priorities](#next-development-steps)

## Application Status Overview

The Caryo Marketplace application currently includes:

- **Backend**: Spring Boot application with Gradle
  - User authentication (JWT + Social Login)
  - Car listing management
  - Location system
  - Admin approval workflow
  - PostgreSQL database
  - MinIO for file storage
  - Redis for caching
  - MailDev for email testing

- **Frontend**: React application with Next.js
  - Jest for testing
  - Modern UI components
  - Internationalization support
  - Responsive design

- **Development Environment**:
  - Fully Dockerized with docker-compose
  - Hot-reload enabled
  - Remote debugging support
  - MailDev web interface (accessible at http://localhost:1080)
  - PgAdmin interface (accessible at http://localhost:5050)
  - Health check endpoints

## CI/CD Workflows

### 1. CI/CD Pipeline (`ci-cd.yml`)
This is the main workflow that runs on every push to the `main` branch and on pull requests.

**What it does:**
- Builds and tests the backend (excluding integration tests)
  - Runs unit tests and generates coverage reports
  - Performs static code analysis with SonarQube
  - Validates Gradle build
- Builds and tests the frontend with Jest
  - Runs ESLint for code quality
  - Builds production-ready bundle
  - Runs component tests
- Builds Docker images for both frontend and backend
  - Uses layer caching for faster builds
  - Tags images with commit SHA and branch name
- Deploys to production (when merged to main)
  - Uses semantic versioning for releases
  - Updates deployment manifests

**Performance optimizations:**
- Uses Gradle and npm caching
- Parallel job execution where possible
- Conditional deployments

### 2. Backend Integration Tests (`integration-tests.yml`)
This dedicated workflow handles integration tests that require the full Docker environment.

**What it does:**
- Sets up Docker Compose with required services:
  - PostgreSQL database (preloaded with test data)
  - MinIO for S3-compatible storage
  - Redis for caching
  - MailDev for email testing
- Performs sophisticated health checks:
  - Validates database connection and schema
  - Confirms MinIO bucket creation
  - Verifies Redis connectivity
- Runs Gradle integration tests with proper environment variables
- Collects and uploads test reports (JUnit XML and HTML reports)
- Performs cleanup of Docker resources
- Stores test artifacts for 7 days

**When it runs:**
- On pull requests to main branch
- Can be triggered manually via workflow_dispatch
- Weekly scheduled runs (Sundays at 01:00 UTC)

### 3. Postman API Tests (`postman-tests.yml`)
This workflow runs comprehensive API tests against a running instance.

**What it does:**
- Uses Newman to run Postman collections
  - Tests all API endpoints for functionality
  - Validates response schemas
  - Tests authentication flows
- Generates detailed HTML and JUnit test reports
- Performs environment-specific testing (dev/staging/prod)
- Validates API performance benchmarks
- Can be triggered manually or runs on a weekly schedule

## Setting Up Required Secrets

For these workflows to function properly, add the following secrets in your GitHub repository:

1. `DOCKERHUB_USERNAME`: Your Docker Hub username
2. `DOCKERHUB_TOKEN`: Your Docker Hub access token
3. `SSH_PRIVATE_KEY`: SSH key for deployment to your server (if using SSH deployment)
4. `SONAR_TOKEN`: Token for SonarQube analysis
5. `CODECOV_TOKEN`: Token for Codecov coverage reports (required for protected branches)
6. `POSTGRES_PASSWORD`: Database password for integration tests
7. `REDIS_PASSWORD`: Redis password for integration tests
8. `DEPLOYMENT_SERVER_HOST`: Production server hostname
9. `DEPLOYMENT_SERVER_USER`: Production server username

To add these secrets:
1. Go to your GitHub repository
2. Click on Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Add each secret name and value

## Local vs CI Environment

- **Local Development**: 
  - Uses `docker-compose.dev.yml` with all services running locally
  - Enables hot-reloading for faster development
  - Mounts source code directly into containers
  - Exposes debugging ports

- **CI Environment**: 
  - Main pipeline: Runs unit tests in isolation
  - Integration tests: Spins up required Docker services
  - Test databases are created fresh for each integration test run
  - Uses GitHub-hosted runners with containerized services
  - Optimized for CI performance (parallel jobs, caching)

## Testing Strategy

The project employs a multi-layered testing approach:

1. **Unit Tests**: Run in the main pipeline, quick feedback
   - Test classes in isolation with mocked dependencies
   - Coverage threshold: 80% for new code

2. **Integration Tests**: Run in a separate workflow with Docker dependencies
   - Test interactions between components
   - Full database testing with migrations
   - File upload/download with MinIO
   - Email sending with MailDev

3. **Frontend Tests**: Jest tests for React components
   - Component rendering tests
   - State management tests
   - User interaction simulations

4. **API Tests**: Postman collection tests for endpoint validation
   - Functional testing of all endpoints
   - Authentication and authorization tests
   - Edge case handling

## Workflow Triggers

| Workflow | Push to Main | PRs to Main | Manual Trigger | Schedule |
|----------|-------------|------------|----------------|---------|
| CI/CD | ✅ | ✅ | ✅ | ❌ |
| Integration Tests | ❌ | ✅ | ✅ | Weekly (Sun) |
| API Tests | ❌ | ❌ | ✅ | Weekly (Wed) |

## Troubleshooting Common Issues

### Integration Tests Failing

**Possible causes:**
- **Database connection issues**: Check if PostgreSQL is properly initialized
  - Solution: Increase the wait time in the workflow or improve health checks
- **MinIO bucket permissions**: Verify bucket creation and access rights
  - Solution: Check MinIO environment variables in the workflow

### Docker Build Failures

**Possible causes:**
- **Disk space on runners**: GitHub Actions runners have limited disk space
  - Solution: Add cleanup steps or use larger runners
- **Docker Hub rate limits**: Unauthenticated pulls are rate-limited
  - Solution: Ensure DOCKERHUB_USERNAME and DOCKERHUB_TOKEN are set

### Deployment Issues

**Possible causes:**
- **SSH key problems**: Invalid or missing SSH key
  - Solution: Regenerate and update the SSH_PRIVATE_KEY secret
- **Server connectivity**: Firewall or network issues
  - Solution: Verify server accessibility and credentials

## Next Development Steps

According to the development plan, the next priorities are:

1. Implement secrets management
   - Switch to HashiCorp Vault or AWS Secrets Manager
   - Remove hardcoded credentials from configuration

2. Complete the Redis caching implementation
   - Add caching for frequently accessed endpoints
   - Implement cache invalidation strategies

3. Implement email notification system using MailDev
   - Create email templates
   - Set up triggered notifications for key events

4. Add API rate limiting/throttling
   - Implement Redis-based rate limiting
   - Add configurable thresholds for different endpoints

5. Deploy to a cloud platform
   - Prepare Kubernetes manifests
   - Configure cloud resource provisioning
   - Set up monitoring and alerting
