# Frontend Environment Checker Script

This script helps verify the environment setup for the frontend application, ensuring all required environment variables and files are properly configured.

## Usage

Run the script from the project root directory:

```bash
# Check environment setup
./scripts/check_frontend_env.sh

# Check and automatically fix issues
./scripts/check_frontend_env.sh --fix
```

The `--fix` flag will automatically create missing environment files and symlinks without prompting.

## Features

The script performs the following checks:

1. **Environment Files**
   - Verifies if `.env` file exists
   - Checks if `.env.local` file exists (optional)
   - Verifies if `.env.production` file exists

2. **Required Environment Variables**
   - Checks for `NEXT_PUBLIC_MINIO_URL`
   - Checks for `NEXT_PUBLIC_API_URL`
   - Validates these variables in both development and production environments

3. **MinIO Connection**
   - Tests if the MinIO server is running and accessible
   - Provides troubleshooting steps if the connection fails

## Auto-creation of Files

If the script detects missing environment files, it will offer to automatically create them with default values. These values should be reviewed and adjusted for your specific environment.

## Troubleshooting

If the script reports issues:

1. **Missing Environment Files**
   - Use the auto-creation feature or manually create the files based on the templates
   - Ensure all required variables are set with appropriate values

2. **MinIO Connection Issues**
   - Make sure the MinIO server is running: `./autotrader.sh dev start`
   - Verify that the MinIO URL is correct in your `.env` file
   - Check for network issues or firewall settings that might block the connection

## MinIO Configuration

The script checks for a running MinIO server and verifies the existence of the required bucket:

- Default bucket name: `autotrader-assets`

If the bucket doesn't exist, the script can create it automatically with the `--fix` flag.

### Manual Bucket Creation

If you need to create the bucket manually, you can use:

```bash
# Using the provided script
./scripts/ensure-minio-bucket.sh --bucket autotrader-assets

# Or using MinIO client directly
mc alias set caryo http://localhost:9000 minioadmin minioadmin
mc mb caryo/autotrader-assets
mc policy set download caryo/autotrader-assets
```

## Further Resources

For more detailed information about environment variables, see the documentation:
- [Frontend Environment Variables Guide](frontend_environment_variables.md)
