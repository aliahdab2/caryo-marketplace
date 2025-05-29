#!/bin/bash

# post_rebuild.sh
#
# A helper script to run after ./autotrader.sh dev rebuild
# This script restores all car images and performs any other necessary post-rebuild tasks
#
# Usage: ./post_rebuild.sh

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}======================================${NC}"
echo -e "${CYAN}Running post-rebuild restoration tasks${NC}"
echo -e "${CYAN}======================================${NC}"

# Function to check if a service is available
check_service() {
  local service_name=$1
  local url=$2
  local max_attempts=$3
  local attempt=1

  echo -e "${YELLOW}Checking if ${service_name} is available...${NC}"
  
  while [ $attempt -le $max_attempts ]; do
    echo -n "Attempt $attempt/$max_attempts: "
    
    if curl -s -f "$url" > /dev/null 2>&1; then
      echo -e "${GREEN}Success!${NC}"
      return 0
    else
      echo -e "${RED}Failed${NC}"
      attempt=$((attempt + 1))
      sleep 5
    fi
  done
  
  echo -e "${RED}${service_name} is not available after $max_attempts attempts.${NC}"
  return 1
}

# Wait for services to be fully available
echo -e "${YELLOW}Waiting for services to be fully available...${NC}"

# Check if MinIO is available (required for image uploads)
if ! check_service "MinIO" "http://localhost:${MINIO_API_PORT:-9000}/minio/health/ready" 12; then
  echo -e "${RED}Warning: MinIO might not be fully available. Continuing anyway...${NC}"
fi

# Check if backend API is available
if ! check_service "Backend API" "http://localhost:${SERVER_PORT:-8080}/actuator/health" 12; then
  echo -e "${RED}Warning: Backend API might not be fully available. Continuing anyway...${NC}"
fi

# Restore all car images
echo -e "${YELLOW}Restoring car images...${NC}"
"$(dirname "$0")/fix_car_images.sh"

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Post-rebuild tasks completed successfully!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "Your development environment has been rebuilt and all car images have been restored."
echo -e "You can now access the application at ${CYAN}http://localhost:8080${NC}"
