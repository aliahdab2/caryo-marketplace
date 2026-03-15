# Development and Deployment Scripts

This directory contains several scripts to help with development and deployment:

## Development Scripts

- `caryo.sh` - Main CLI for development tasks
- `dev-env.sh` - Sets up the development environment
- `start-dev.sh` - Starts the application in development mode

Development environment configuration is in the `.devenv` directory.

## Production Deployment Scripts

- `deploy-enhanced.sh` - Main script for production deployment
- `generate-certs.sh` - Generates SSL certificates for production
- `docker-compose.prod.yml` - Production Docker Compose configuration

## Documentation

- `PRODUCTION_DEPLOYMENT.md` - Complete guide for production deployment
- `DOCKER.md` - General Docker information for the project

## Usage

For development:
```bash
# General CLI for development tasks
./caryo.sh help

# Development environment
./dev-env.sh start
```

For production deployment (via the unified CLI):
```bash
# Deploy to production
./caryo-backend/caryo.sh prod deploy

# Rebuild (keep DB)
./caryo-backend/caryo.sh prod rebuild

# Clean rebuild (wipe DB/volumes)
./caryo-backend/caryo.sh prod clean-rebuild

# Backup
./caryo-backend/caryo.sh prod backup

# Generate certificates (if needed)
./generate-certs.sh
```
