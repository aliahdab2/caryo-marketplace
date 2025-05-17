# Vault Integration with GitHub Actions

This guide explains how to integrate HashiCorp Vault with GitHub Actions for secure CI/CD in the Caryo Marketplace project.

## GitHub Actions Workflows

### Required Secrets

Add these secrets to your GitHub repository:

1. `VAULT_ADDR`: The URL of your Vault server (e.g., `https://vault.example.com:8200`)
2. `VAULT_ROLE_ID`: The AppRole Role ID for CI/CD access 
3. `VAULT_SECRET_ID`: The AppRole Secret ID for CI/CD access

### CI/CD Pipeline Integration

Update your `ci-cd.yml` workflow to retrieve secrets from Vault:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Import Secrets from Vault
        uses: hashicorp/vault-action@v2
        id: vault
        with:
          url: ${{ secrets.VAULT_ADDR }}
          method: approle
          roleId: ${{ secrets.VAULT_ROLE_ID }}
          secretId: ${{ secrets.VAULT_SECRET_ID }}
          secrets: |
            kv/data/database/postgres password | POSTGRES_PASSWORD ;
            kv/data/redis/main password | REDIS_PASSWORD ;
            kv/data/auth/jwt signing_key | JWT_SIGNING_KEY ;
            kv/data/storage/minio access_key | MINIO_ACCESS_KEY ;
            kv/data/storage/minio secret_key | MINIO_SECRET_KEY ;
            kv/data/cicd/dockerhub username | DOCKERHUB_USERNAME ;
            kv/data/cicd/dockerhub token | DOCKERHUB_TOKEN ;
            kv/data/cicd/sonar token | SONAR_TOKEN
      
      # The rest of your build workflow steps here
      # You can now use the secrets as environment variables
      # e.g., ${{ env.POSTGRES_PASSWORD }}
```

### Integration Tests Workflow

Update your `integration-tests.yml` to use Vault secrets:

```yaml
name: Backend Integration Tests

on:
  pull_request:
    branches: [ main ]
  workflow_dispatch:
  schedule:
    - cron: '0 1 * * 0'  # Run every Sunday at 01:00 UTC

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Import Secrets from Vault
        uses: hashicorp/vault-action@v2
        id: vault
        with:
          url: ${{ secrets.VAULT_ADDR }}
          method: approle
          roleId: ${{ secrets.VAULT_ROLE_ID }}
          secretId: ${{ secrets.VAULT_SECRET_ID }}
          secrets: |
            kv/data/database/postgres password | POSTGRES_PASSWORD ;
            kv/data/redis/main password | REDIS_PASSWORD ;
            kv/data/storage/minio access_key | MINIO_ACCESS_KEY ;
            kv/data/storage/minio secret_key | MINIO_SECRET_KEY
            
      # Docker Compose setup with secrets injected from Vault
      - name: Set up Docker Compose
        run: |
          echo "POSTGRES_PASSWORD=${{ env.POSTGRES_PASSWORD }}" >> .env
          echo "REDIS_PASSWORD=${{ env.REDIS_PASSWORD }}" >> .env
          echo "MINIO_ACCESS_KEY=${{ env.MINIO_ACCESS_KEY }}" >> .env
          echo "MINIO_SECRET_KEY=${{ env.MINIO_SECRET_KEY }}" >> .env
          
      # The rest of your integration tests workflow
```

## Vault Setup for CI/CD

### Create Dedicated Policy for CI/CD

```hcl
# ci-cd-policy.hcl
path "kv/data/database/*" {
  capabilities = ["read"]
}
path "kv/data/redis/*" {
  capabilities = ["read"]
}
path "kv/data/auth/*" {
  capabilities = ["read"]
}
path "kv/data/storage/*" {
  capabilities = ["read"]
}
path "kv/data/cicd/*" {
  capabilities = ["read"]
}
```

Apply this policy in Vault:

```bash
vault policy write ci-cd-policy ci-cd-policy.hcl
```

### Create AppRole for GitHub Actions

```bash
# Enable AppRole auth if not already enabled
vault auth enable approle

# Create CI/CD role with appropriate TTL
vault write auth/approle/role/github-actions \
    token_policies="ci-cd-policy" \
    token_ttl=60m \
    token_max_ttl=120m
    
# Get credentials for GitHub Actions
GITHUB_ROLE_ID=$(vault read -field=role_id auth/approle/role/github-actions/role-id)
GITHUB_SECRET_ID=$(vault write -force -field=secret_id auth/approle/role/github-actions/secret-id)

echo "GitHub Actions Role ID: $GITHUB_ROLE_ID"
echo "GitHub Actions Secret ID: $GITHUB_SECRET_ID"
```

Add these values to GitHub repository secrets.

## Migrating Existing Secrets

Here's how to migrate your existing GitHub secrets to Vault:

1. Retrieve all existing secrets from GitHub
2. Store them in Vault:

```bash
# Store CI/CD secrets
vault kv put kv/cicd/dockerhub \
  username=your_dockerhub_username \
  token=your_dockerhub_token

vault kv put kv/cicd/sonar \
  token=your_sonar_token

vault kv put kv/cicd/ssh \
  private_key=@path/to/private_key

vault kv put kv/cicd/deployment \
  server_host=your_server_hostname \
  server_user=your_server_username
```

## Production Vault Setup

For production:

1. Deploy Vault to a secure environment:
   - Dedicated VM or Kubernetes cluster
   - TLS encryption
   - Proper security policies

2. Configure Vault for high availability:
   - Use a production-grade backend (Consul, integrated storage, etc.)
   - Set up multiple Vault servers
   - Configure auto-unsealing

3. Set up proper authentication:
   - AppRole for services
   - OIDC for human users
   - JWT for specific integrations

4. Define strict access policies:
   - Least privilege principle
   - Path-specific permissions
   - Explicit deny policies

## Security Best Practices

1. **Secret Rotation**:
   - Set TTL policies on credentials
   - Regularly rotate all secrets
   - Use dynamic secrets where possible

2. **Access Logging**:
   - Enable Vault audit logs
   - Forward logs to a SIEM solution
   - Set up alerts for unauthorized access attempts

3. **Multi-factor Authentication**:
   - Enable MFA for admin access
   - Use TOTP, WebAuthn, or similar mechanisms
