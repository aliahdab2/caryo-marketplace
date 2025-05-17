# Testing Google OAuth Integration

This document outlines manual testing procedures for verifying that the Google OAuth integration is working correctly in the Caryo Marketplace application.

## Prerequisites

1. The application must be running locally or deployed to a test environment
2. Valid Google OAuth credentials must be configured (see [Google OAuth Setup](./google_oauth_setup.md))
3. Access to a Google account for testing

## Test Cases

### 1. New User Registration via Google

**Objective**: Verify that a new user can register using Google OAuth

**Steps**:
1. Navigate to the application's sign-in page
2. Click the "Continue with Google" button
3. Sign in with a Google account that has never been used with the application
4. Grant necessary permissions if prompted
5. Observe redirection back to the application

**Expected Results**:
- User should be successfully logged in
- A new user account should be created in the database
- The user's email from Google should match the email in the database
- A random username should be generated based on the email address
- User should have the default "USER" role assigned
- The user's profile should contain the name from Google
- The application should display a successful login message or redirect to the dashboard

### 2. Existing User Login via Google

**Objective**: Verify that an existing user can login using Google OAuth

**Steps**:
1. Ensure there is an existing user in the database with an email that matches a Google account
2. Navigate to the application's sign-in page
3. Click the "Continue with Google" button
4. Sign in with the Google account that matches the existing user's email
5. Grant necessary permissions if prompted
6. Observe redirection back to the application

**Expected Results**:
- User should be successfully logged in
- No new user account should be created
- The existing user account should be used
- The user should have the same roles and permissions as before
- The application should display a successful login message or redirect to the dashboard

### 3. Error Handling

**Objective**: Verify that the application handles Google OAuth errors gracefully

**Steps**:
1. Navigate to the application's sign-in page
2. Click the "Continue with Google" button
3. Cancel the Google authentication process
4. Observe the application's response

**Expected Results**:
- User should be returned to the sign-in page
- An appropriate error message should be displayed
- The application should remain functional

### 4. Token Validation

**Objective**: Verify that the application properly validates Google OAuth tokens

**Steps**:
1. Use an API testing tool like Postman
2. Attempt to call the `/api/auth/social-login` endpoint with an invalid token
3. Observe the response

**Expected Results**:
- Request should be rejected with an appropriate error code
- Error message should indicate that the token is invalid

## Automated Testing

In addition to manual testing, the following automated tests have been implemented:

1. **Integration Tests**:
   - `SocialLoginIntegrationTest` verifies the backend social login endpoints
   - Tests cover both new user creation and existing user authentication

2. **Unit Tests**:
   - `SocialLoginControllerUnitTest` tests the controller logic for social login
   - Tests cover username generation, role assignment, and token issuance

## Debugging Tips

If the Google OAuth integration is not working properly, check the following:

1. Verify that the Google OAuth credentials are correct and not expired
2. Check that the authorized redirect URIs in the Google Cloud Console match your application's callback URL
3. Examine the browser console for JavaScript errors
4. Check the backend logs for authentication errors
5. Verify that the environment variables are correctly set
6. Ensure the social login endpoint is properly handling the OAuth token

## Security Considerations

When testing Google OAuth, keep the following security considerations in mind:

1. Always use HTTPS in production environments
2. Verify that tokens are properly validated before granting access
3. Check that user data from Google is properly sanitized before storing
4. Ensure proper CSRF protection is in place
5. Verify that token expiration is handled correctly
