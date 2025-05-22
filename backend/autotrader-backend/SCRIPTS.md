# Development and Deployment Scripts

This directory contains several scripts to help with development and deployment:

## Development Scripts

- `autotrader.sh` - Main CLI for development tasks
- `dev-env.sh` - Sets up the development environment
- `start-dev.sh` - Starts the application in development mode

Development environment configuration is in the `.devenv` directory.

## Production Deployment Scripts

- `deploy.sh` - Main script for production deployment
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

For production deployment:
```bash
# Deploy to production
./deploy.sh deploy

# Generate certificates (if needed)
./generate-certs.sh
```
