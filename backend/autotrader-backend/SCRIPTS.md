# Development and Deployment Scripts

This directory contains several scripts to help with development and deployment:

## Development Scripts

- `autotrader.sh` - Main CLI for development tasks
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
./autotrader.sh help

# Development environment
./dev-env.sh start
```

For production deployment (via the unified CLI):
```bash
# Deploy to production
./autotrader-backend/autotrader.sh prod deploy

# Rebuild (keep DB)
./autotrader-backend/autotrader.sh prod rebuild

# Clean rebuild (wipe DB/volumes)
./autotrader-backend/autotrader.sh prod clean-rebuild

# Backup
./autotrader-backend/autotrader.sh prod backup

# Generate certificates (if needed)
./generate-certs.sh
```
