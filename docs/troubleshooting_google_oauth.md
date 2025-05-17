# Troubleshooting Google OAuth Authentication

This guide will help you diagnose and fix issues with Google OAuth authentication in the Caryo Marketplace application.

## Common Issues and Solutions

### 1. Redirected Back to Login Page After Google Authentication

**Symptoms:**
- You click "Continue with Google"
- You select your Google account and authorize the application
- The authentication with Google completes successfully
- You get redirected back to the login page instead of into your application

**Possible Causes and Solutions:**

1. **NextAuth Session Not Being Created:**
   - Check that the JWT callback in NextAuth is correctly storing the token from your backend
   - Verify the session callback is properly setting user information from the token
   - Ensure the NEXTAUTH_SECRET environment variable is set correctly for session encryption

2. **Backend Token Issues:**
   - The backend might be returning an invalid or malformed token
   - The token might not contain the required claims for your application
   - Run the token through a JWT debugger (like jwt.io) to verify its structure

3. **Callback Handling Problems:**
   - There may be errors in the code that handles the redirect after Google authentication
   - Check the NextAuth callback configuration in your [...nextauth]/route.ts file
   - Verify that error handling in callbacks doesn't redirect users back to login

4. **Front-end Route Protection Issues:**
   - Check your route protection logic to ensure it correctly recognizes authenticated users
   - There might be a mismatch between how authentication state is stored and checked

5. **Missing Role or Permission:**
   - Your authentication might succeed but role verification fails
   - Check if your application requires specific roles that aren't being assigned to Google users

**Quick Fix Steps:**
1. Check browser console for errors immediately after Google authentication completes
2. Look for any failed API calls when you're redirected back to the login page
3. Verify the session cookies are being set correctly after authentication
4. Add console logging in your NextAuth callbacks to track the authentication flow

### 2. Login Doesn't Complete After Google Authentication

**Symptoms:**
- You click "Continue with Google"
- You select your Google account and authorize the application
- You get redirected back to the application, but remain logged out
- No error message appears

**Possible Causes and Solutions:**

1. **Backend API Connectivity Issues**
   - Make sure your backend server is running
   - Check that `NEXT_PUBLIC_API_URL` is correctly set in your `.env.local` file
   - Verify there are no network issues between your frontend and backend

2. **Incorrect API Endpoint**
   - Verify that the `/api/auth/social-login` endpoint exists in your backend
   - Check for any typos in the endpoint URL in the frontend code

3. **CORS Issues**
   - Check if CORS is properly configured in the backend
   - Ensure that your frontend domain is allowed to make requests to the backend
   - Look for CORS errors in the browser's console log

4. **Middleware or Authentication Filter Issues**
   - Check that authentication filters aren't blocking the social login request
   - Verify that any JWT validation is correctly bypassed for the social login endpoint

5. **Invalid Response Format**
   - Ensure the backend returns a response in the expected format
   - Check that the JWT token is properly included in the response

### 3. Google Authentication Fails

**Symptoms:**
- You click "Continue with Google"
- You get an error from Google or the authentication flow doesn't complete
- You see error messages in the console

**Possible Causes and Solutions:**

1. **Invalid OAuth Credentials**
   - Verify that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correctly set
   - Check if the credentials have expired or been revoked
   - Ensure you're using the right credentials for your environment

2. **Incorrect Redirect URIs**
   - Check that the redirect URI in Google Cloud Console matches your application's callback URL
   - For local development, this should typically be `http://localhost:3000/api/auth/callback/google`
   - For production, it should be `https://yourdomain.com/api/auth/callback/google`

3. **Domain Verification Issues**
   - If you're using a custom domain, make sure it's verified in Google Cloud Console
   - Check if your application is still in testing mode and needs to be published

4. **Request Scopes**
   - Ensure you're requesting the necessary scopes for user information
   - Typically, you need at least `email` and `profile` scopes

### 4. Data Inconsistency After Login

**Symptoms:**
- Google authentication appears successful
- You're logged in but missing information or permissions
- Some features don't work properly

**Possible Causes and Solutions:**

1. **User Role Assignment Issues**
   - Check that roles are correctly assigned to users during social login
   - Verify that the JWT token includes the user's roles

2. **Missing Profile Information**
   - Ensure that user profile information is correctly extracted from Google data
   - Check the database for missing or incorrect user data

3. **Token Generation Issues**
   - Verify that the JWT token is properly generated for social login users
   - Check that the token includes all necessary claims and information

## Debugging Steps

### 1. Backend Debugging

Run the provided test script to check your backend API:

```bash
# Navigate to the backend directory
cd backend/autotrader-backend

# Run the Google auth test script
./test_google_auth.sh
```

This will test your social login endpoint and identify common issues.

### 2. Check Browser Console Logs

1. Open your browser's developer tools (F12 or right-click > Inspect)
2. Go to the Console tab
3. Look for errors related to authentication, API calls, or CORS
4. Check Network tab for failed requests to your backend or Google APIs

### 3. Server Logs

Check your backend server logs for errors:

```bash
# If using standard logging
grep "error" logs/application.log

# For Spring Boot applications
grep "ERROR" logs/spring.log
```

### 4. Verify OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Select your OAuth 2.0 client ID
4. Verify the following:
   - Authorized JavaScript origins
   - Authorized redirect URIs
   - OAuth consent screen settings

## Advanced Troubleshooting

### JWT Token Validation

If you suspect issues with JWT validation:

1. Extract the token from the authentication response
2. Decode it using [jwt.io](https://jwt.io/)
3. Check that all claims are correctly set
4. Verify the signature with your secret key

### Database Issues

Check if user data is correctly stored in the database:

```sql
-- Check if a user with the Google email exists
SELECT * FROM users WHERE email = 'your-google-email@gmail.com';

-- Check role assignments
SELECT r.name FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'your-google-email@gmail.com';
```

## Need More Help?

If you're still experiencing issues after trying these troubleshooting steps:

1. Search for similar issues in the project documentation
2. Check the Google OAuth documentation for updates or changes
3. Contact the project maintainers for support
