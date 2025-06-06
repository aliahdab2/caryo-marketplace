# Frontend Environment Variables Guide

This guide explains how to set up environment variables for the frontend application.

## Required Environment Variables

The following environment variables are required for the frontend to function properly:

### Core Variables

- `NEXT_PUBLIC_API_URL`: The URL of the backend API server.
- `NEXT_PUBLIC_MINIO_URL`: The URL of the MinIO storage server for media files.
- `NEXTAUTH_URL`: The base URL of your Next.js application.
- `NEXTAUTH_SECRET`: A secret string used to encrypt the NextAuth.js JWT.

### Authentication Variables

For Google OAuth authentication:
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID.
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret.

## Environment Files

The frontend application uses different `.env` files for different environments:

- `.env`: Default environment variables, loaded in all environments.
- `.env.local`: Local overrides, not committed to the repository.
- `.env.development`: Development-specific variables.
- `.env.production`: Production-specific variables.

## Setting Up Environment Variables

### Local Development

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` to add your specific configuration values.

### Production Deployment

For production deployment, make sure to set these environment variables in your hosting platform:

1. Set `NEXT_PUBLIC_MINIO_URL` to your production MinIO instance URL.
2. Set `NEXT_PUBLIC_API_URL` to your production API server URL.
3. Set `NEXTAUTH_URL` to your production application URL.
4. Generate a secure random string for `NEXTAUTH_SECRET`.

## Troubleshooting

Common issues:

- **Media storage functionality not working**: Make sure `NEXT_PUBLIC_MINIO_URL` is set correctly in your environment.
- **Authentication issues**: Verify that `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are properly configured.
- **API connection failures**: Check that `NEXT_PUBLIC_API_URL` points to a working API server.

For detailed configuration, refer to the documentation for [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables) and [NextAuth.js Configuration](https://next-auth.js.org/configuration/options).
