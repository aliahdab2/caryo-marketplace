# Secrets Management with HashiCorp Vault

This document outlines the implementation of HashiCorp Vault for secrets management in the Caryo Marketplace project.

## Why HashiCorp Vault?

1. **Centralized Secrets Management**: Store and manage all secrets in one secure location
2. **Dynamic Secrets**: Generate short-lived, just-in-time credentials
3. **Access Control**: Fine-grained policies for who can access which secrets
4. **Audit Trail**: Track who accessed which secrets and when
5. **Integration**: Works with Docker, Kubernetes, and CI/CD pipelines
6. **Multiple Secret Backends**: Support for various secret types and storage methods

## Implementation Plan

### 1. Local Development Setup

1. Set up Vault server in Docker Compose
2. Configure initial secrets
3. Integrate with backend and frontend applications
4. Set up developer workflows

### 2. CI/CD Integration

1. Configure Vault for GitHub Actions workflows
2. Set up authentication between GitHub Actions and Vault
3. Update workflow files to retrieve secrets from Vault

### 3. Production Setup

1. Deploy Vault to production environment
2. Configure high-availability setup
3. Implement proper backup and recovery processes
4. Set up monitoring and alerting

## Local Development Implementation

### Docker Compose Configuration

Add the following to your `docker-compose.dev.yml`:

```yaml
services:
  vault:
    image: vault:1.13
    container_name: caryo-vault
    ports:
      - "8200:8200"
    environment:
      - VAULT_DEV_ROOT_TOKEN_ID=caryo-dev-token
      - VAULT_DEV_LISTEN_ADDRESS=0.0.0.0:8200
    cap_add:
      - IPC_LOCK
    volumes:
      - ./vault-data:/vault/data
    command: server -dev
```

### Initial Setup Script

Create a script to initialize Vault with your secrets:

```bash
#!/bin/bash
# Set Vault address and token
export VAULT_ADDR='http://localhost:8200'
export VAULT_TOKEN='caryo-dev-token'

# Enable KV secrets engine version 2
vault secrets enable -version=2 kv

# Store database credentials
vault kv put kv/database/postgres \
  username=postgres \
  password=your_secure_password

# Store Redis credentials
vault kv put kv/redis/main \
  password=your_redis_password

# Store email server config
vault kv put kv/email/smtp \
  host=smtp.example.com \
  port=587 \
  username=notifications@caryo.example.com \
  password=your_email_password

# Store JWT signing key
vault kv put kv/auth/jwt \
  signing_key=your_signing_key

# Store MinIO credentials
vault kv put kv/storage/minio \
  access_key=minio_access_key \
  secret_key=minio_secret_key

# Create policy for backend service
vault policy write backend-policy - <<EOF
path "kv/data/database/*" {
  capabilities = ["read"]
}
path "kv/data/redis/*" {
  capabilities = ["read"]
}
path "kv/data/email/*" {
  capabilities = ["read"]
}
path "kv/data/auth/*" {
  capabilities = ["read"]
}
path "kv/data/storage/*" {
  capabilities = ["read"]
}
EOF

# Create policy for frontend service
vault policy write frontend-policy - <<EOF
path "kv/data/auth/*" {
  capabilities = ["read"]
}
EOF

echo "Vault has been initialized with secrets and policies"
```

## Spring Boot Integration

To integrate Vault with your Spring Boot backend:

1. Add the Spring Cloud Vault dependency to `build.gradle`:

```gradle
dependencies {
    // Existing dependencies
    implementation 'org.springframework.cloud:spring-cloud-starter-vault-config:4.0.1'
}
```

2. Configure Vault in `bootstrap.yml`:

```yaml
spring:
  cloud:
    vault:
      host: vault
      port: 8200
      scheme: http
      authentication: token
      token: caryo-dev-token
      kv:
        enabled: true
        backend: kv
        default-context: application
        application-name: caryo-backend
```

3. Use secrets in application:

```java
@Value("${database.password}")
private String databasePassword;

@Value("${redis.password}")
private String redisPassword;
```

## CI/CD Integration

For GitHub Actions, create a workflow step to fetch secrets from Vault:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Import Secrets from Vault
        uses: hashicorp/vault-action@v2
        with:
          url: ${{ secrets.VAULT_ADDR }}
          token: ${{ secrets.VAULT_TOKEN }}
          secrets: |
            kv/data/database/postgres password | POSTGRES_PASSWORD ;
            kv/data/redis/main password | REDIS_PASSWORD ;
            kv/data/storage/minio access_key | MINIO_ACCESS_KEY ;
            kv/data/storage/minio secret_key | MINIO_SECRET_KEY
```

## Next Steps

1. Set up Vault server
2. Run initialization script
3. Update application configurations to use Vault
4. Update CI/CD workflows to fetch secrets from Vault
5. Remove hardcoded credentials from configuration files
