#!/bin/bash

# Initialize HashiCorp Vault with secrets for Caryo Marketplace
# This script should be run after Vault is started via docker-compose

# Set Vault address and token
export VAULT_ADDR='http://localhost:8200'
export VAULT_TOKEN='caryo-dev-token'

echo "Initializing Vault with secrets for Caryo Marketplace..."

# Enable KV secrets engine version 2
echo "Enabling KV secrets engine..."
vault secrets enable -version=2 kv

# Store database credentials
echo "Adding database credentials..."
vault kv put kv/database/postgres \
  username=postgres \
  password=secure_pg_password_placeholder

# Store Redis credentials
echo "Adding Redis credentials..."
vault kv put kv/redis/main \
  password=secure_redis_password_placeholder

# Store email server config
echo "Adding email configuration..."
vault kv put kv/email/smtp \
  host=maildev \
  port=25 \
  username=notifications@caryo.example.com \
  password=maildev_password_placeholder

# Store JWT signing key
echo "Adding JWT configuration..."
vault kv put kv/auth/jwt \
  signing_key=$(openssl rand -base64 32)

# Store MinIO credentials
echo "Adding MinIO credentials..."
vault kv put kv/storage/minio \
  access_key=minio_access_placeholder \
  secret_key=minio_secret_placeholder

# Create policy for backend service
echo "Creating policy for backend service..."
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
echo "Creating policy for frontend service..."
vault policy write frontend-policy - <<EOF
path "kv/data/auth/*" {
  capabilities = ["read"]
}
EOF

# Create AppRole auth method for programmatic access
echo "Setting up AppRole authentication..."
vault auth enable approle

# Create backend role
vault write auth/approle/role/backend \
    token_policies="backend-policy" \
    token_ttl=1h \
    token_max_ttl=24h

# Create frontend role
vault write auth/approle/role/frontend \
    token_policies="frontend-policy" \
    token_ttl=1h \
    token_max_ttl=24h

# Get role IDs and secret IDs for applications
BACKEND_ROLE_ID=$(vault read -field=role_id auth/approle/role/backend/role-id)
BACKEND_SECRET_ID=$(vault write -force -field=secret_id auth/approle/role/backend/secret-id)

FRONTEND_ROLE_ID=$(vault read -field=role_id auth/approle/role/frontend/role-id)
FRONTEND_SECRET_ID=$(vault write -force -field=secret_id auth/approle/role/frontend/secret-id)

echo ""
echo "===== VAULT CONFIGURATION COMPLETE ====="
echo ""
echo "Backend AppRole Credentials:"
echo "  Role ID: $BACKEND_ROLE_ID"
echo "  Secret ID: $BACKEND_SECRET_ID"
echo ""
echo "Frontend AppRole Credentials:"
echo "  Role ID: $FRONTEND_ROLE_ID" 
echo "  Secret ID: $FRONTEND_SECRET_ID"
echo ""
echo "Save these credentials securely - they will be needed for application configuration"
echo ""
echo "Vault UI is available at: http://localhost:8200"
echo "Login token: caryo-dev-token"
echo ""
echo "NOTE: For production, replace all placeholder passwords with secure values"
echo "      and configure a proper seal/unseal mechanism."
