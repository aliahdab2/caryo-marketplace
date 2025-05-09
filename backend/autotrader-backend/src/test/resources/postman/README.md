# AutoTrader API Tests Postman Collection

This directory contains Postman collections for testing the AutoTrader Marketplace API.

## Collection Structure

The collections have been organized into smaller, more manageable files to improve performance and readability:

### Main Collection File
- `autotrader-api-collection.json`: The main collection file with all test requests embedded directly

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
- `listings-media-tests.json`: Tests for Listings and Media endpoints

## Running the Tests

### Prerequisites

- Newman (Postman CLI) must be installed: `npm install -g newman`
- A running instance of the AutoTrader backend application (by default at http://localhost:8080)

### Running All Tests

To run all tests as a single collection:

```bash
./run-collections.sh --all
```

### Running Individual Test Collections

To run each collection separately:

```bash
./run-collections.sh
```

## When the Backend Environment is Down

The run-collections.sh script requires a running backend instance to succeed. If the backend environment is down or not accessible:

1. **Environment Verification**

   Before running tests, you can verify if the backend is up by:

   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/test/public
   ```
   
   If this returns 200, the backend is running.

2. **Starting the Backend**

   If the backend is not running, you should start it before running tests:

   ```bash
   # From the project root
   cd ../../../..
   ./start-dev.sh
   ```
   
   Wait for the backend to fully initialize before running the tests.

3. **Using a Different Environment**

   If you need to test against a different environment:
   
   1. Modify the `environment.json` file and update the `baseUrl` value
   2. Run the tests as usual

4. **Mock Mode (For Development)**

   For development purposes when the backend is unavailable, you might consider using Postman's mock server functionality to simulate responses. This requires setting up mocks in Postman desktop application.

## Environment Variables

The tests use environment variables defined in `environment.json`:

- `baseUrl`: Base URL of the AutoTrader API (default: http://localhost:8080)
- `auth_token`: Authentication token (generated during test execution)
- `admin_auth_token`: Admin authentication token (generated during test execution)
- `test_username`, `test_email`, `test_password`: Credentials for test user
- `admin_username`, `admin_password`: Credentials for admin user
