# Frontend Environment Variables Guide

This guide explains how to set up environment variables for the frontend application.

## Required Environment Variables

The following environment variables are required for the frontend to function properly:

### Core Variables

- `NEXT_PUBLIC_API_URL`: The URL of the backend API server.
- `NEXT_PUBLIC_MINIO_URL`: The URL of the MinIO storage server for media files (defaults to `http://localhost:9000`).
- `NEXT_PUBLIC_APP_URL`: The public application URL (defaults to `https://caryo.sy`).
- `NEXT_PUBLIC_SITE_URL`: Site URL used for sitemaps and SEO.
- `SITE_URL`: Server-side site URL (for sitemap generation).
- `NEXTAUTH_URL`: The base URL of your Next.js application.
- `NEXTAUTH_SECRET`: A secret string used to encrypt the NextAuth.js JWT.

### Authentication Variables

For Google OAuth authentication:
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID.
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret.

### Feature Flags

- `NEXT_PUBLIC_VIDEO_UPLOAD_ENABLED`: Enable video uploads (defaults to `true`).
- `NEXT_PUBLIC_VIDEO_URL_ENABLED`: Enable external video URLs (defaults to `true`).

### Image Processing

- `NEXT_PUBLIC_IMGPROXY_URL`: ImgProxy service URL (defaults to `http://localhost:8081`).
- `NEXT_PUBLIC_IMGPROXY_ENABLED`: Enable ImgProxy integration (defaults to `true`).
- `NEXT_PUBLIC_S3_BUCKET_NAME`: MinIO/S3 bucket name (used in admin moderation).

### Debug Flags (Development Only)

These are optional and off by default:
- `NEXT_PUBLIC_DEBUG_SESSION`: Debug session/auth hooks.
- `NEXT_PUBLIC_I18N_DEBUG`: Debug translation system.
- `NEXT_PUBLIC_DEBUG_API`: Debug API calls.
- `NEXT_PUBLIC_DEBUG_SEARCH`: Debug search functionality.
- `NEXT_PUBLIC_DEBUG_FILTERS`: Debug filter system.
- `NEXT_PUBLIC_DEBUG_WIZARD`: Debug listing wizard.
- `NEXT_PUBLIC_DEBUG_ERRORS`: Debug error boundaries.
- `NEXT_PUBLIC_DEBUG_FORM_VALIDATION`: Debug form validation.

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
