# Caryo Marketplace - Backend Docker Setup

This guide explains how to build and run the Caryo Marketplace backend using Docker.

## Prerequisites

- Docker installed on your system with Compose V2 support

## Building the Docker Image

To build the Docker image for the backend:

```bash
# Navigate to the backend directory
cd backend/autotrader-backend

# Build the Docker image
docker build -t caryo-backend .
```

## Running with Docker Compose

The project includes a `docker-compose.yml` file that sets up the complete environment including:
- PostgreSQL database
- MinIO object storage (S3-compatible)
- Backend application

To start all services:

```bash
# Navigate to the backend directory
cd backend/autotrader-backend

# Start all services
docker compose up -d
```

The backend will be available at `http://localhost:8080`.

## Environment Variables

The Docker Compose configuration includes default environment variables suitable for development. For production, you should override the following variables:

- `SPRING_PROFILES_ACTIVE`: Set to `prod` for production
- `SPRING_DATASOURCE_URL`: Database connection URL
- `SPRING_DATASOURCE_USERNAME`: Database username
- `SPRING_DATASOURCE_PASSWORD`: Database password
- `STORAGE_S3_ENDPOINT`: S3 compatible storage endpoint
- `STORAGE_S3_ACCESS_KEY`: S3 access key
- `STORAGE_S3_SECRET_KEY`: S3 secret key
- `STORAGE_S3_BUCKET_NAME`: S3 bucket name

## Accessing the API Documentation

Once running, you can access the API documentation at:

```
http://localhost:8080/swagger-ui/index.html
```

## Health Check

The application exposes a health check endpoint at:

```
http://localhost:8080/actuator/health
```

## Container Management

```bash
# Stop the containers
docker compose down

# View logs
docker compose logs -f backend

# Restart a service
docker compose restart backend
```

## Production Deployment

For production deployment, consider using environment-specific configuration files and setting up proper secrets management for sensitive information.
