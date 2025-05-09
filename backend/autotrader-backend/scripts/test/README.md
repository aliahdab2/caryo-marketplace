# AutoTrader Backend Testing

This directory contains the unified test infrastructure for the AutoTrader backend application.

## Overview

The testing infrastructure has been simplified and improved to provide:
1. Consistent API endpoints across all tests
2. Better authentication handling
3. Centralized test execution
4. Removal of redundant script files
5. Clear documentation and usage information

## Directory Structure

- `run-tests.sh` - Main test runner script
- `postman/` - Postman collections and environment files
  - `collections/` - Test collections organized by functional area
    - `auth-tests.json` - Authentication tests
    - `reference-data-tests.json` - Reference data API tests
    - `endpoints-tests.json` - General API endpoint tests
  - `environment.json` - Environment variables for testing

## Using the Test Runner

The main script `run-tests.sh` provides a unified interface for running all tests:

```bash
# Run all tests
./run-tests.sh all

# Run specific Postman collections
./run-tests.sh postman auth
./run-tests.sh postman reference-data

# Run with environment management
./run-tests.sh postman --start-env --stop-env

# Run unit and integration tests
./run-tests.sh unit
./run-tests.sh integration

# Check environment health
./run-tests.sh health
```

## Postman Tests

The Postman collections have been improved:

1. All API paths now consistently follow `/api/...` pattern
2. Auth token management is handled automatically
3. Pre-request scripts check for and refresh tokens when needed
4. Better error reporting and logging
5. Cleaner test organization and structure

## Authentication Flow

The authentication flow now works correctly:

1. Register a new user (with dynamic credentials)
2. Login with the registered user
3. Store the authentication token
4. Use the token for authenticated endpoints
5. Token refresh happens automatically when needed

## Reports & Results

Test results are saved in `build/test-reports/postman/` with HTML output for easy review.

## Integration with Main CLI

The test infrastructure is fully integrated with the main `autotrader.sh` CLI:

```bash
# Run from project root
./autotrader.sh test all
./autotrader.sh test auth
./autotrader.sh test reference-data
```
