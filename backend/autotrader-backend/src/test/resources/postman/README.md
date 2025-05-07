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

All API requests that require authentication now automatically handle admin login using collection-level prerequest scripts. These scripts use the admin credentials defined in the `environment.json` file to obtain an `admin_auth_token`, which is then used for bearer authentication in each request.

- Regular user operations: Can still use the "Login User" request in the `auth-tests.json` collection to obtain a user token if needed for specific tests.
- Admin operations (create, update, delete): Automatically use the `admin_auth_token` set by the prerequest script.

### Admin User Setup

The admin user is automatically created when the Spring Boot application starts, handled by the `DataInitializer.java` class. The credentials are:
- Username: `admin`
- Email: `admin@autotrader.com`
- Password: `Admin123!`

These credentials are also configured in the `environment.json` file for the prerequest scripts. There is no longer a need for a separate script to create or recreate the admin user.

**Note**: If you were to manually create an admin user via the API (e.g., for other environments or testing scenarios outside of this project's default setup), the JSON payload for user creation should use the property `\"role\": [\"admin\"]` (singular \"role\", not \"roles\").

## Environment Variables

Make sure the following environment variables are set in your `environment.json` file:
- `baseUrl`: Base URL of the AutoTrader API (e.g., http://localhost:8080)
- `auth_token`: Authentication token for regular user operations (can be automatically set after login using requests in `auth-tests.json`).
- `admin_auth_token`: Authentication token for admin operations (this is automatically set by the collection-level prerequest scripts).
- `admin_username`: Should be set to `admin`.
- `admin_password`: Should be set to `Admin123!`.

## Auto-Generated Documentation

To generate API documentation from the Postman collections, run:
```bash
cd /Users/aliahdab/Documents/autotrader-marketplace/backend/autotrader-backend
./src/test/resources/postman/generate-docs.sh
```
This will create documentation in the `docs/` directory.
