#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}==== Starting API Tests ====${NC}"

# Base URL
BASE_URL="http://localhost:8080"

# Test function
test_endpoint() {
  local endpoint=$1
  local method=${2:-GET}
  local expected_status=${3:-200}
  local description=${4:-"Testing endpoint $endpoint"}
  
  echo -e "${YELLOW}Testing:${NC} $description"
  
  # Execute the curl command
  if [[ "$method" == "GET" ]]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL$endpoint)
  elif [[ "$method" == "POST" ]]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE_URL$endpoint)
  fi
  
  # Check the status code
  if [[ "$response" == "$expected_status" ]]; then
    echo -e "${GREEN}✓ Success:${NC} $endpoint returned $response"
  else
    echo -e "${RED}✗ Failure:${NC} $endpoint returned $response (expected $expected_status)"
    # Print the actual response for debugging
    echo -e "${YELLOW}Detailed response:${NC}"
    curl -v $BASE_URL$endpoint
    echo ""
  fi
  
  echo ""
}

# Test all endpoints
test_endpoint "/hello" "GET" "200" "Basic hello endpoint"
test_endpoint "/api/test/public" "GET" "200" "Public test endpoint"
test_endpoint "/api/test/health" "GET" "200" "Health check endpoint"

# Test H2 console access
test_endpoint "/h2-console" "GET" "200" "H2 Console"

echo -e "${YELLOW}==== API Tests Complete ====${NC}"
