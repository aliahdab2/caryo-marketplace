# AutoTrader Backend Scripts

This directory contains all utility scripts for the AutoTrader Backend project. Scripts are organized into subdirectories based on their purpose.

## Directory Structure

- **dev/** - Development environment scripts
  - `dev-env.sh` - Start, stop, and manage the development environment
  - `start-dev.sh` - Start the development server

- **test/** - Testing scripts
  - `test-auth.sh` - Test authentication endpoints
  - `test-endpoints.sh` - Test general API endpoints
  - `test-reference-data.sh` - Test reference data endpoints
  - `prepare-test-assets.sh` - Generate test assets for Postman tests

- **postman/** - Postman-related scripts
  - `run-collections.sh` - Run Postman collections with Newman
  - `run-postman-tests.sh` - Run Postman tests without dev environment
  - `run-postman-tests-with-devenv.sh` - Run Postman tests with dev environment
  - `generate-docs.sh` - Generate API documentation from Postman collections

- **utils/** - Utility scripts
  - Any other utility scripts that don't fit into the above categories

## Usage Guidelines

### Environment Safety

All scripts include environment checks to ensure they can run safely:
- Scripts verify if required services are running
- Scripts handle cases when the environment is not active
- Scripts provide clear error messages when prerequisites aren't met

### Naming Convention

Scripts follow a consistent naming convention:
- Use hyphenated lowercase names (e.g., `run-collections.sh`)
- Names should clearly indicate the script's purpose
- Test scripts are prefixed with `test-`
- Postman scripts are prefixed with `run-` when they execute tests

### Documentation

Each script includes:
- A header comment explaining its purpose
- Usage information
- Required dependencies
- Example commands

## Dependencies

- Newman (for Postman tests): `npm install -g newman`
- Docker and Docker Compose (for development environment)
- Bash shell
