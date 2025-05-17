#!/bin/bash

# Start Vault server and initialize it with secrets for Caryo Marketplace

echo "Starting Vault server with Docker Compose..."
cd $(dirname "$0")/../
docker-compose -f config/docker/vault-compose.yml up -d vault

echo "Waiting for Vault to start..."
sleep 10

# Check if Vault is running
while ! curl -s http://localhost:8200/v1/sys/health > /dev/null; do
  echo "Waiting for Vault to start..."
  sleep 2
done

echo "Vault is up and running!"
echo "Running initialization script..."

# Run the vault initialization script
./scripts/vault-init.sh

echo ""
echo "Vault has been successfully initialized and configured!"
echo ""
echo "You can now start using Vault in your application."
echo "Vault UI is available at: http://localhost:8200"
echo "Login token: caryo-dev-token"
echo ""
echo "Next steps:"
echo "1. Add Vault configuration to your Spring Boot application"
echo "2. Update Docker configuration to connect to Vault"
echo "3. Update CI/CD pipelines to use Vault for secrets"
