# Caryo Marketplace Scripts

This directory contains utility scripts for the Caryo Marketplace project. The scripts are organized by functionality to help with development, testing, diagnostics, and maintenance.

## Image Management Scripts

These scripts handle image management for car listings in the Caryo Marketplace.

| Script | Description |
|--------|-------------|
| `fix_car_images.sh` | Main script for adding car images to MinIO storage. Handles both primary and additional images for car listings. |
| `post_rebuild.sh` | Helper script to run after rebuilding the development environment. Restores all car images. |
| `ensure-minio-bucket.sh` | Utility to ensure the MinIO bucket exists and has the correct permissions. |

For detailed information about image management, see [IMAGE_SCRIPTS_README.md](./IMAGE_SCRIPTS_README.md).

> **Note:** The legacy `populate-minio.sh` script has been removed as its functionality is now handled by the Docker Compose setup and the `fix_car_images.sh` script.

### Restoring Images After a Rebuild

After running a rebuild of your development environment, you should restore the car images:

```bash
# First rebuild the environment
./backend/autotrader-backend/autotrader.sh dev rebuild

# Then restore the images (automatically waits for services to be available)
./scripts/post_rebuild.sh
```

The `post_rebuild.sh` script will:
1. Wait for services to be fully available
2. Restore all car images using `fix_car_images.sh`
3. Confirm when the process is complete

## Diagnostic Scripts

These scripts help diagnose issues with the application in various environments.

| Script | Description |
|--------|-------------|
| `diagnose-api.sh` | Performs comprehensive API diagnostics including endpoint health checks, authentication flows, and error reporting. |
| `diagnose-postman-tests.sh` | Diagnoses issues with Postman API tests, particularly in CI environments. |
| `diagnose-spring-boot.sh` | Helps diagnose Spring Boot startup issues and runtime errors. |
| `diagnose-user-auth.sh` | Specifically tests and diagnoses authentication and authorization flows. |

## Workflow Testing Scripts

These scripts help test GitHub Actions workflows locally.

| Script | Description |
|--------|-------------|
| `test-workflows.sh` | Main script for testing GitHub Action workflows locally using Act. |
| `test-all-workflows.sh` | Tests all defined workflows in sequence. |
| `test-reusable-workflows.sh` | Tests reusable GitHub Action workflows specifically. |
| `fix-workflow-yaml.sh` | Fixes common issues in workflow YAML files. |
| `fix-postman-workflow.sh` | Specifically fixes issues with the Postman test workflow. |

## Testing Scripts

These scripts assist with testing the application.

| Script | Description |
|--------|-------------|
| `run-postman-tests-with-no-auth.sh` | Runs Postman tests that don't require authentication. |
| `test-auth-paths.sh` | Tests various authentication paths and scenarios. |
| `mock-spring-boot.sh` | Creates a mock Spring Boot server for testing purposes. |
| `test-docker-compose.yml` | A Docker Compose file used for testing configurations. |

## Maintenance Scripts

Scripts for maintaining the repository.

| Script | Description |
|--------|-------------|
| `cleanup.sh` | General cleanup script for removing temporary files and containers. |
| `cleanup_image_scripts.sh` | Specifically cleans up redundant image management scripts. |

## Usage Examples

### Image Management

```bash
# Add default images (listings 6-10, multiple images for 8)
./scripts/fix_car_images.sh

# Add images for specific listings
./scripts/fix_car_images.sh --listings 3,5,8

# After rebuilding the dev environment
./scripts/post_rebuild.sh
```

### Diagnostics

```bash
# Diagnose API issues
./scripts/diagnose-api.sh http://localhost:8080

# Diagnose Postman test failures
./scripts/diagnose-postman-tests.sh
```

### Workflow Testing

```bash
# Test a specific workflow
./scripts/test-workflows.sh .github/workflows/ci.yml

# Test all workflows
./scripts/test-all-workflows.sh
```

## Adding New Scripts

When adding new scripts to this directory:

1. Follow the existing naming conventions
2. Include proper documentation at the top of the script
3. Make the script executable (`chmod +x script.sh`)
4. Update this README with information about the script

## Maintenance

Periodically, you should run the cleanup scripts to remove redundant or obsolete scripts:

```bash
./scripts/cleanup.sh
```

## Bilingual Support

In accordance with Caryo Marketplace standards, any user-facing messages in these scripts should support both English and Arabic where applicable.
