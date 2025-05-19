# Postman API Tests Fix Documentation

## Background

The GitHub Actions workflow for Postman API tests was failing with errors like `ERROR: relation "users" does not exist` and `getaddrinfo ENOTFOUND {{baseurl}}`. After investigation, we identified several issues:

1. **API Path Inconsistency**: The Spring Security configuration permits `/api/auth/**` endpoints, but the Postman collection had inconsistent paths between:
   - Raw URLs: Using the correct `/api/auth/signin` and `/api/auth/signup`
   - Path arrays: Incorrectly using `["auth", "signin"]` and `["auth", "signup"]` (missing the `api` segment)

2. **Authentication Issues**: Workflow was attempting to authenticate at the wrong paths.

3. **Environment Variables**: The Postman environment file needed proper handling of the `baseUrl` variable.

## Solution

The solution focused on ensuring consistent paths throughout the API collection and workflow:

1. **Fixed Path Consistency**: Ensured all authentication endpoints use the correct `/api/auth/*` pattern in both:
   - Raw URL strings
   - Path arrays

2. **Updated Authentication Logic**: Modified the authentication steps in the workflow to use `/api/auth/signin` instead of `/auth/signin`.

3. **Improved Error Handling**: Enhanced the Postman tests action to better handle Newman exit codes and determine test success based on actual test results rather than exit code.

4. **Environment Variables**: Ensured proper setup of environment variables, especially `baseUrl` and authentication tokens.

## Diagnostic Tools

We created several diagnostic tools to help identify and fix issues:

1. **scripts/diagnose-api.sh**: A unified diagnostic script that checks:
   - API server health
   - Authentication endpoints
   - Postman collection paths
   - Token generation and validation

This script can be run before executing Postman tests to ensure everything is properly configured.

## Running Tests

To run the Postman API tests:

```bash
# From project root
./run-postman-tests.sh
```

The tests will automatically:
1. Ensure the API is running
2. Generate authentication tokens
3. Create and configure the Postman environment file
4. Execute the tests using Newman

## Best Practices

To avoid similar issues in the future:

1. Always use `/api/auth/*` as the pattern for authentication endpoints
2. Ensure consistency between raw URLs and path arrays in Postman collections
3. Use environment variables consistently across requests
4. Run the diagnostic script if tests fail to quickly identify issues
