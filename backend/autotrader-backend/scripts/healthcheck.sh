#!/bin/bash

# Comprehensive health check script for the Caryo Marketplace backend
# This script checks multiple components and returns a 0 exit code only if all checks pass

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

function check_backend() {
  echo -e "${YELLOW}Checking backend API...${NC}"
  if curl -s -f http://localhost:8080/actuator/health > /dev/null; then
    echo -e "${GREEN}Backend health check: OK${NC}"
    return 0
  else
    echo -e "${RED}Backend health check: FAILED${NC}"
    return 1
  fi
}

function check_database() {
  echo -e "${YELLOW}Checking database connection...${NC}"
  if docker compose exec -T db pg_isready -U autotrader > /dev/null; then
    echo -e "${GREEN}Database connection: OK${NC}"
    return 0
  else
    echo -e "${RED}Database connection: FAILED${NC}"
    return 1
  fi
}

function check_minio() {
  echo -e "${YELLOW}Checking MinIO service...${NC}"
  if curl -s -f http://localhost:9000/minio/health/live > /dev/null; then
    echo -e "${GREEN}MinIO health check: OK${NC}"
    return 0
  else
    echo -e "${RED}MinIO health check: FAILED${NC}"
    return 1
  fi
}

function check_nginx() {
  echo -e "${YELLOW}Checking Nginx service...${NC}"
  if curl -s -k https://localhost > /dev/null; then
    echo -e "${GREEN}Nginx service: OK${NC}"
    return 0
  else
    echo -e "${RED}Nginx service: FAILED${NC}"
    return 1
  fi
}

# Run all checks
check_backend
BACKEND_STATUS=$?

check_database
DB_STATUS=$?

check_minio
MINIO_STATUS=$?

check_nginx
NGINX_STATUS=$?

# Return overall status
if [ $BACKEND_STATUS -eq 0 ] && [ $DB_STATUS -eq 0 ] && [ $MINIO_STATUS -eq 0 ] && [ $NGINX_STATUS -eq 0 ]; then
  echo -e "${GREEN}All systems operational!${NC}"
  exit 0
else
  echo -e "${RED}One or more systems have failed the health check!${NC}"
  exit 1
fi
