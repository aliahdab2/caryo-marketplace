# AutoTrader Backend Scripts

This directory contains all utility scripts for the AutoTrader Backend project. Scripts have been reorganized and improved for better usability and maintenance.

## Directory Structure

- ~~**run-tests.sh** - Unified test runner for all types of tests~~ (Note: This script has been removed)

- **dev/** - Development environment scripts
  - `dev-env.sh` - Start, stop, and manage the development environment
  - `start-dev.sh` - Start the development server

- **test/** - Testing scripts and documentation
  - `README.md` - Comprehensive testing documentation
  - ~~Tests are now centralized through the main run-tests.sh script~~ (Note: Test runner script is no longer available)

- **postman/** - Postman-related scripts
  - `generate-docs.sh` - Generate API documentation from Postman collections

- **utils/** - Utility scripts
  - `template.sh` - Common utilities and functions for bash scripts

## Usage Guidelines

### Unified Script Organization

The script infrastructure has been improved for better organization:

1. ~~**Centralized Testing**: The `run-tests.sh` script provides a unified interface for all tests~~ (Note: This functionality is no longer available)
2. **Consistent API Paths**: Fixed inconsistencies between `/auth/*` and `/api/auth/*`
3. **Better Authentication**: Improved token management in Postman tests
4. **Removed Redundancy**: Eliminated duplicate scripts doing similar functions
5. **Clear Documentation**: Added comprehensive documentation for all scripts

### Key Improvements

1. ~~**Test Runner**: The new test runner supports:~~ (Note: Test runner functionality is no longer available)
   ~~- Running specific Postman collections~~
   ~~- Unit and integration tests~~
   ~~- Environment management~~
   ~~- Health checks~~
   ~~- HTML report generation~~

2. **Fixed Postman Scripts**: 
   - Consistent API paths across collections
   - Pre-request scripts for automatic authentication
   - Better error handling and reporting

3. **Environment Management**:
   - Automatic environment startup when needed
   - Cleanup after test completion
   - Status checking and validation

### Documentation

Each script now includes:
- Detailed header comments explaining purpose and usage
- Comprehensive help text with examples
- Improved error messages and status updates
- Color-coded output for better readability

## Dependencies

- Newman (for Postman tests): `npm install -g newman`
- Docker and Docker Compose (for development environment)
- Bash shell
