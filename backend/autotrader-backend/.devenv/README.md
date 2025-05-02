# Development Environment

This directory contains configuration files for the AutoTrader Marketplace development environment.

## Files

- `Dockerfile.dev`: Docker image definition for development with hot reloading
- `docker-compose.dev.yml`: Docker Compose configuration for all development services
- `.env`: Environment variables for development configuration
- `dev-env.sh`: Main script for managing the development environment

## Usage

You can use the development environment from the project root:

```bash
# Start the environment
./dev-env.sh start

# Check status
./dev-env.sh status

# View logs
./dev-env.sh logs

# Run tests
./dev-env.sh test

# Stop the environment
./dev-env.sh stop
```

## Components

The development environment includes:

1. Spring Boot application (with hot reload)
2. PostgreSQL database
3. MinIO (S3-compatible storage)
4. Adminer (database management UI)
5. Redis (for caching, optional)

## Remote Debugging

The Spring Boot application is configured for remote debugging on port 5005 (configurable in `.env`).
You can connect your IDE to this port to debug the application while it's running.

## Configuration

All configuration settings can be modified in the `.env` file. If you need to change only
specific settings for your local environment, create a `.env.local` file, which will be
loaded in addition to the standard `.env` file.
