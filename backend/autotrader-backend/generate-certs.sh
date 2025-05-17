#!/bin/bash

# Script to generate self-signed SSL certificates for development
# For production, you should use proper certificates from a trusted CA

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directory for certificates
CERT_DIR="./nginx/ssl"
mkdir -p $CERT_DIR

echo -e "${YELLOW}Generating self-signed SSL certificates for development...${NC}"
echo -e "${YELLOW}WARNING: In production, use proper certificates from a trusted CA.${NC}"

# Generate private key and certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout $CERT_DIR/caryo.key \
  -out $CERT_DIR/caryo.crt \
  -subj "/C=US/ST=State/L=City/O=Caryo Marketplace/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:api.caryo.com"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}SSL certificates generated successfully!${NC}"
    echo -e "${GREEN}Certificate: $CERT_DIR/caryo.crt${NC}"
    echo -e "${GREEN}Private key: $CERT_DIR/caryo.key${NC}"
    echo -e "${YELLOW}NOTE: These are self-signed certificates for development only.${NC}"
    chmod 600 $CERT_DIR/caryo.key
else
    echo -e "${RED}Failed to generate SSL certificates.${NC}"
    exit 1
fi
