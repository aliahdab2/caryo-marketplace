# Setting up Google OAuth Authentication

This guide explains how to set up Google OAuth for the Caryo Marketplace application.

## Prerequisites

- A Google Cloud Platform account
- Access to the project's codebase
- Node.js and npm installed on your development machine

## Step 1: Create OAuth 2.0 credentials on Google Cloud Platform

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the application type
6. Give your OAuth client a name (e.g., "Caryo Marketplace Dev")
7. Add the following authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `https://your-production-domain.com` (for production)
8. Add the following authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://your-production-domain.com/api/auth/callback/google` (for production)
9. Click "Create" and note down the generated Client ID and Client Secret

## Step 2: Configure environment variables

1. Create or edit your `.env.local` file in the project root
2. Add the following environment variables:

```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

3. If deploying to a production environment, make sure to add these variables to your hosting platform's environment configuration

## Step 3: Backend Integration

The Google OAuth flow requires integration with the backend to create or associate user accounts. The backend needs to implement a new endpoint that handles social login:

```
POST /api/auth/social-login
```

This endpoint should:

1. Receive user data from Google (email, name, etc.)
2. Check if a user with this email already exists
3. If it exists, associate the Google account with the existing user
4. If it doesn't exist, create a new user with the Google details
5. Generate and return an authentication token

The backend implementation should follow these steps:
1. Create a new controller method in `AuthController.java` to handle social login
2. Implement the necessary service and repository methods
3. Return a response similar to the regular login endpoint

## Testing Google Authentication

1. Start your development server: `npm run dev`
2. Navigate to the sign-in page
3. Click on the "Continue with Google" button
4. You should be redirected to Google's authentication page
5. After successful authentication with Google, you should be redirected back to your application and logged in

## Troubleshooting

### Common issues:

1. **Redirect URI mismatch**: Make sure the redirect URI in your Google Cloud Console matches exactly with your application's callback URL
2. **Invalid credentials**: Verify that your environment variables are correctly set 
3. **Backend integration issues**: Check the backend logs for any errors related to the social login endpoint

## Security Considerations

1. Never commit your `.env.local` file or any file containing OAuth credentials to version control
2. Use different OAuth credentials for development and production environments
3. Follow the principle of least privilege when configuring OAuth scopes
