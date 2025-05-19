# GitHub Actions Workflow Optimization

This project uses GitHub Actions for CI/CD with optimized workflows that leverage composite actions for better maintainability and reusability.

## Workflow Structure

Our GitHub Actions workflows are organized in the following manner:

1. **Main Workflow Files** (in `.github/workflows/`):
   - `unit-tests.yml` - Runs backend unit tests
   - `integration-tests.yml` - Runs backend integration tests with database and dependencies
   - `postman-tests.yml` - Runs Postman API tests against a running backend
   - `ci-cd.yml` - Main CI/CD pipeline for both frontend and backend

2. **Composite Actions** (in `.github/actions/`):
   - `gradle-setup` - Sets up the Gradle environment 
   - `docker-services-setup` - Sets up Docker services required for testing
   - `spring-boot-setup` - Builds and starts a Spring Boot application
   - `postman-tests` - Runs Postman collection tests using Newman

## Benefits of This Approach

1. **Reduced Duplication**: Common tasks are defined once and reused across workflows
2. **Improved Maintainability**: Changes to a process only need to be made in one place
3. **Better Organization**: Each action has a clear single responsibility
4. **Faster Development**: New workflows can be created quickly by assembling existing actions

## Testing Locally

You can test the GitHub Actions workflows locally using the scripts in the `scripts` directory:

```bash
# Test all composite actions
./scripts/test-all-workflows.sh
```

## Common Tasks

### Running Tests Locally

```bash
# Run unit tests
./backend/autotrader-backend/gradlew test

# Run integration tests
./backend/autotrader-backend/gradlew integrationTest

# Run Postman tests
npm install -g newman
newman run ./postman/*.postman_collection.json -e ./postman/test_environment.json
```

### Adding a New GitHub Actions Workflow

1. Create a new workflow file in `.github/workflows/`
2. Use our existing composite actions to keep the workflow DRY and consistent
3. Add appropriate testing and error handling

Example:
```yaml
name: New Workflow

on:
  workflow_dispatch:
  pull_request:
    branches: [ main ]

jobs:
  job-name:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Gradle Environment
      uses: ./.github/actions/gradle-setup
      with:
        working-directory: "./backend/autotrader-backend"
        java-version: "17"
```
