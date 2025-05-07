# AutoTrader API Tests Postman Collection

This directory contains Postman collections for testing the AutoTrader Marketplace API.

## Collection Structure

The collections have been organized into smaller, more manageable files to improve performance and readability:

### Main Collection File
- `autotrader-api-collection.json`: The main collection file that imports all sub-collections

### Sub-Collections
Located in the `collections/` directory:

- `auth-tests.json`: Tests for authentication endpoints (register, login)
- `reference-data-tests.json`: Tests for consolidated reference data endpoints
- `car-conditions-tests.json`: Tests for Car Condition endpoints
- `drive-types-tests.json`: Tests for Drive Type endpoints
- `body-styles-tests.json`: Tests for Body Style endpoints
- `fuel-types-tests.json`: Tests for Fuel Type endpoints
- `transmissions-tests.json`: Tests for Transmission endpoints
- `seller-types-tests.json`: Tests for Seller Type endpoints

### Environment File
- `environment.json`: Contains environment variables required for running the tests

## How to Run the Tests

### Option 1: Using the Project's Dev Environment Script (Recommended)
```bash
cd /Users/aliahdab/Documents/autotrader-marketplace/backend/autotrader-backend
./src/test/scripts/run_postman_tests_with_devenv.sh
```
This script:
- Sets up the complete development environment including S3 container
- Prepares test assets
- Runs all the tests with Newman
- Generates HTML reports in `build/test-reports/postman/`
- Shuts down the environment when done

### Option 2: Using Standard Test Script 
```bash
cd /Users/aliahdab/Documents/autotrader-marketplace/backend/autotrader-backend
./src/test/scripts/run_postman_tests.sh
```
This script:
- Prepares test assets
- Starts the Spring Boot application automatically (without S3)
- Runs all the tests with Newman
- Generates HTML reports in `build/test-reports/postman/`
- Shuts down the application when done

### Option 3: Using Postman Desktop App
1. Import the main collection file `autotrader-api-collection.json` into Postman
2. Import the environment file `environment.json`
3. Select the imported environment
4. Run the collections using Postman's Collection Runner

### Option 4: Using Newman Directly
If you have Newman installed (npm install -g newman), you can run:
```bash
newman run src/test/resources/postman/autotrader-api-collection.json -e src/test/resources/postman/environment.json
```

## Adding New Tests

When adding new API tests:
1. Identify the appropriate sub-collection based on the entity type
2. Add your new test to that sub-collection
3. If creating tests for a new entity type, create a new sub-collection file in the `collections/` directory
4. Update the main collection file to include your new sub-collection

## Authentication

Some endpoints require authentication:
- Regular user operations: Use the "Login User" request to obtain a user token
- Admin operations (create, update, delete): Use the "Login Admin" request to obtain an admin token

### Admin User Setup

The recommended test script `run_postman_tests_with_devenv.sh` automatically creates an admin user for testing:
- Username: `admin`
- Email: `admin@example.com`
- Password: `admin123`

You can also manually create an admin user with:
```bash
./src/test/scripts/create_admin_user.sh
```

**Note**: For admin user creation to work correctly, the JSON payload must use the property `"role": ["admin"]` (singular "role", not "roles").

## Environment Variables

Make sure the following environment variables are set in your environment:
- `baseUrl`: Base URL of the AutoTrader API (e.g., http://localhost:8080)
- `auth_token`: Authentication token for regular user operations (automatically set after login)
- `admin_auth_token`: Authentication token for admin operations (automatically set after admin login)

## Auto-Generated Documentation

To generate API documentation from the Postman collections, run:
```bash
cd /Users/aliahdab/Documents/autotrader-marketplace/backend/autotrader-backend
./src/test/resources/postman/generate-docs.sh
```
This will create documentation in the `docs/` directory.
