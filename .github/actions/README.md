# GitHub Actions Composite Actions

This directory contains composite actions used in our GitHub workflows to reduce duplication and improve maintainability.

## Available Actions

### Gradle Setup Action

Sets up the Gradle environment with proper caching.

**Usage Example:**
```yaml
- name: Setup Gradle Environment
  uses: ./.github/actions/gradle-setup
  with:
    working-directory: "./backend/autotrader-backend"
    java-version: "17"
    cache: true
```

### Docker Services Setup Action

Sets up Docker services required for testing.

**Usage Example:**
```yaml
- name: Setup Docker Services
  uses: ./.github/actions/docker-services-setup
  with:
    docker-compose-file: "./backend/autotrader-backend/docker-compose.dev.yml"
    services: "db minio createbuckets redis"
    wait-time: '60'
    db-container-name: "db"
    db-user: "autotrader"
```

### Spring Boot Setup Action

Builds and starts a Spring Boot application.

**Usage Example:**
```yaml
- name: Start Spring Boot Application
  id: spring-boot
  uses: ./.github/actions/spring-boot-setup
  with:
    working-directory: "./backend/autotrader-backend"
    spring-profiles: "dev"
    debug-mode: 'true'
    wait-retries: '45'
    wait-time: '10'
    health-check-path: "/actuator/health"
```

### Postman Tests Action

Runs Postman collection tests using Newman.

**Usage Example:**
```yaml
- name: Run Postman Tests
  uses: ./.github/actions/postman-tests
  with:
    collection-path: './path/to/collection.json'
    environment-file: './postman/test_environment.json'
    results-directory: 'results'
    auto-detect-collection: 'true'
    extra-options: '--bail --export-environment ./results/updated_environment.json'
```

## Benefits of Composite Actions

1. **Reusability**: The same action can be used across multiple workflows, eliminating code duplication.
2. **Maintainability**: When you need to update an action, you only need to change it in one place.
3. **Readability**: Workflows become more concise and easier to understand.
4. **Consistency**: Ensures that common tasks are performed the same way across workflows.

## Development Guidelines

When updating these actions:

1. Make sure to test changes locally before committing.
2. Update the inputs and outputs documentation when adding new parameters.
3. Keep actions focused on a single responsibility.
4. Use descriptive names for your actions and inputs.
