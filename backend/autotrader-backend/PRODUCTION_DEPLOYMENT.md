# Caryo Marketplace Production Deployment

This guide provides instructions for deploying the Caryo Marketplace backend in a production environment.

## Directory Structure

```
├── docker-compose.yml          # Base Docker Compose configuration
├── docker-compose.dev.yml      # Development overrides
├── docker-compose.prod.yml     # Production overrides
├── Dockerfile                  # Application build and runtime definition
├── deploy.sh                   # Production deployment script
├── docker.sh                   # Development Docker management script
├── generate-certs.sh           # SSL certificate generation script
├── .env.template               # Environment variable template
├── backups/                    # Directory for database/data backups
├── logs/                       # Application logs directory
├── uploads/                    # File upload directory
└── nginx/                      # Nginx configuration files
    ├── nginx.conf              # Nginx site configuration
    └── ssl/                    # SSL certificate directory
```

## Prerequisites

- Docker with Compose V2
- Linux/Unix environment
- Proper SSL certificates for production (or use self-signed for testing)

## Deployment Instructions

### First-Time Setup

1. Create your environment file:
   ```bash
   cp .env.template .env
   ```

2. Edit `.env` file with your production values:
   ```bash
   nano .env
   ```

3. Generate SSL certificates (for development only):
   ```bash
   chmod +x generate-certs.sh
   ./generate-certs.sh
   ```

   For production, replace the self-signed certificates in `nginx/ssl/` with proper certificates from a trusted CA.

4. Make the deployment script executable:
   ```bash
   chmod +x deploy.sh
   ```

### Deployment

Deploy the application:

```bash
./deploy.sh deploy
```

This will:
1. Build the Docker image
2. Start all services with production settings
3. Configure the application for production use

### Management Commands

- **Starting the application**:
  ```bash
  ./deploy.sh start
  ```

- **Stopping the application**:
  ```bash
  ./deploy.sh stop
  ```

- **Checking status**:
  ```bash
  ./deploy.sh status
  ```

- **Viewing logs**:
  ```bash
  ./deploy.sh logs
  ```

- **Creating backups**:
  ```bash
  ./deploy.sh backup
  ```

- **Restoring from backups**:
  ```bash
  ./deploy.sh restore
  ```

## Environment Variables

Key environment variables for production:

| Variable | Description | Default |
|----------|-------------|---------|
| DB_USER | Database username | autotrader |
| DB_PASSWORD | Database password | *None* |
| MINIO_ACCESS_KEY | MinIO access key | minioadmin |
| MINIO_SECRET_KEY | MinIO secret key | minioadmin |
| S3_BUCKET_NAME | S3 bucket name | autotrader-assets |
| JWT_SECRET | JWT signing secret | *None* |

## Security Considerations

For production deployments:

1. **Use strong passwords** for all services
2. **Use proper SSL certificates** from a trusted CA
3. **Secure your environment file** with restricted permissions
4. **Implement regular backups** of your database and MinIO data
5. **Set up monitoring and alerting** for your production services
6. **Restrict access** to management ports and endpoints

## Troubleshooting

### Common Issues

1. **Cannot connect to the database**:
   - Check database logs: `docker compose logs db`
   - Verify DB_USER and DB_PASSWORD in .env file

2. **Cannot upload files to MinIO**:
   - Check MinIO logs: `docker compose logs minio`
   - Verify MINIO_ACCESS_KEY and MINIO_SECRET_KEY in .env file

3. **SSL certificate errors**:
   - Ensure certificates are properly generated
   - Verify path mappings in docker-compose.yml

### Getting Help

For assistance:
1. Check application logs: `./deploy.sh logs`
2. Verify all services are running: `./deploy.sh status`
3. Restart the application: `./deploy.sh stop && ./deploy.sh start`

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Spring Boot Production Guide](https://docs.spring.io/spring-boot/docs/current/reference/html/deployment.html)
- [Nginx HTTPS Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
