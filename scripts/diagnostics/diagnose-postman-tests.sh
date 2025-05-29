#!/bin/bash
# Postman Tests Diagnostic Script
# This script helps diagnose issues with Postman API tests in CI environments

# Color definitions
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Helper functions
log_info() {
  echo -e "${BOLD}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

API_BASE_URL=${1:-"http://localhost:8080"}
COLLECTION_PATH=${2:-""}
ENV_FILE=${3:-""}

log_info "===== Postman Tests Diagnostics ====="
log_info "Date: $(date)"
log_info "Base URL: $API_BASE_URL"
log_info "Collection Path: $COLLECTION_PATH"
log_info "Environment File: $ENV_FILE"

# Check if Spring Boot app is running
log_info "Checking if Spring Boot application is running..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" ${API_BASE_URL}/actuator/health || echo "failed")

if [ "$HEALTH_RESPONSE" == "200" ]; then
  log_success "✅ Spring Boot application is running"
  
  # Get more details about the application
  APP_DETAILS=$(curl -s ${API_BASE_URL}/actuator/health)
  echo "$APP_DETAILS" | grep -v password | grep -v secret
else
  log_error "❌ Spring Boot application is not reachable"
  log_info "Response code: $HEALTH_RESPONSE"
  log_info "Please check if the application is running on $API_BASE_URL"
fi

# Check if collection file is provided and exists
if [ -z "$COLLECTION_PATH" ]; then
  log_warning "⚠️ No collection path provided, searching for collection files..."
  if [ -f "./postman/Caryo_Marketplace_API_Tests.json" ]; then
    COLLECTION_PATH="./postman/Caryo_Marketplace_API_Tests.json"
  elif [ -f "./backend/autotrader-backend/src/test/resources/postman/autotrader-api-collection.json" ]; then
    COLLECTION_PATH="./backend/autotrader-backend/src/test/resources/postman/autotrader-api-collection.json"
  else
    # Try to find collection files
    COLLECTION_FILES=$(find . -name "*.json" | grep -i -E "collection|postman|api[-_]test" | grep -v "node_modules")
    if [ ! -z "$COLLECTION_FILES" ]; then
      log_info "Potential collection files found:"
      echo "$COLLECTION_FILES"
      COLLECTION_PATH=$(echo "$COLLECTION_FILES" | head -1)
      log_info "Using first found collection: $COLLECTION_PATH"
    else
      log_error "❌ No collection files found"
      exit 1
    fi
  fi
else
  if [ -f "$COLLECTION_PATH" ]; then
    log_success "✅ Collection file exists: $COLLECTION_PATH"
  else
    log_error "❌ Collection file does not exist: $COLLECTION_PATH"
    exit 1
  fi
fi

# Check if environment file exists
log_info "Checking environment file..."
if [ -f "$ENV_FILE" ]; then
  log_success "✅ Environment file exists: $ENV_FILE"
  
  # Validate JSON structure
  if command -v jq &> /dev/null; then
    if jq empty "$ENV_FILE" 2>/dev/null; then
      log_success "✅ Environment file is valid JSON"
      
      # Check for critical variables
      BASE_URL=$(jq -r '.values[] | select(.key=="baseUrl") | .value' "$ENV_FILE")
      AUTH_TOKEN=$(jq -r '.values[] | select(.key=="authToken") | .value' "$ENV_FILE")
      
      log_info "baseUrl value: $BASE_URL"
      if [ -z "$AUTH_TOKEN" ] || [ "$AUTH_TOKEN" == "null" ]; then
        log_warning "⚠️ No authToken found in environment"
      else
        log_success "✅ authToken is present (first 10 chars): ${AUTH_TOKEN:0:10}..."
      fi
    else
      log_error "❌ Environment file is not valid JSON"
      cat "$ENV_FILE"
    fi
  else
    log_warning "⚠️ jq not installed, skipping JSON validation"
  fi
else
  log_error "❌ Environment file does not exist: $ENV_FILE"
  log_info "Searching for environment files..."
  find . -name "*environment*.json" | grep -v "node_modules"
fi

# Verify collection file
log_info "Checking collection file..."
if [ -f "$COLLECTION_PATH" ]; then
  log_success "✅ Collection file exists: $COLLECTION_PATH"
  
  # Validate JSON structure
  if command -v jq &> /dev/null; then
    if jq empty "$COLLECTION_PATH" 2>/dev/null; then
      log_success "✅ Collection file is valid JSON"
      
      # Get collection info
      COLLECTION_NAME=$(jq -r '.info.name // "Unnamed collection"' "$COLLECTION_PATH")
      COLLECTION_ITEM_COUNT=$(jq '.item | length' "$COLLECTION_PATH")
      
      log_info "Collection name: $COLLECTION_NAME"
      log_info "Collection contains $COLLECTION_ITEM_COUNT top-level items"
    else
      log_error "❌ Collection file is not valid JSON"
    fi
  else
    log_warning "⚠️ jq not installed, skipping JSON validation"
  fi
else
  log_error "❌ Collection file does not exist: $COLLECTION_PATH"
  exit 1
fi

# Test authentication endpoint
log_info "Testing authentication endpoint..."
log_info "Attempting to authenticate with admin user..."
AUTH_RESPONSE=$(curl -v -X POST "${API_BASE_URL}/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}' 2>&1)

# Show the full authentication attempt details
log_info "Authentication attempt details:"
echo "$AUTH_RESPONSE" | grep -v "password"

if [ ! -z "$AUTH_RESPONSE" ]; then
  if [[ "$AUTH_RESPONSE" == *"token"* ]] || [[ "$AUTH_RESPONSE" == *"accessToken"* ]]; then
    TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"token"\s*:\s*"[^"]*"\|"accessToken"\s*:\s*"[^"]*"' | cut -d'"' -f4)
    log_success "✅ Authentication endpoint working"
    log_info "Token (first 10 chars): ${TOKEN:0:10}..."
    
    # Test a protected endpoint with token
    log_info "Testing protected endpoint with token..."
    REF_DATA_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "${API_BASE_URL}/api/reference-data")
    
    if [ "$REF_DATA_RESPONSE" == "200" ] || [ "$REF_DATA_RESPONSE" == "201" ]; then
      log_success "✅ Protected endpoint access successful"
    else
      log_error "❌ Protected endpoint access failed with status: $REF_DATA_RESPONSE"
      log_info "This suggests authentication is not working correctly"
    fi
  else
    log_error "❌ Authentication endpoint returned unexpected response"
    echo "$AUTH_RESPONSE" | grep -v password
  fi
else
  log_error "❌ Authentication endpoint unreachable"
fi

# Additional diagnostics
log_info "===== Additional Diagnostics ====="

# Check security settings
log_info "[5] Checking API security settings..."
ENDPOINTS=("/api/public" "/actuator/health" "/auth/signup" "/auth/signin" "/api/test/all" "/api/test/user")

for endpoint in "${ENDPOINTS[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_BASE_URL$endpoint)
  log_info "  - $endpoint: $STATUS"
done

# Network connectivity check
log_info "[6] Network connectivity check..."
log_info "Testing DNS resolution for localhost..."
nslookup localhost || echo "nslookup not available"

log_info "Testing connection to API port..."
nc -zv localhost 8080 || echo "netcat not available, using alternative:"
timeout 5 bash -c "</dev/tcp/localhost/8080" && echo "Port 8080 is open" || echo "Port 8080 is not accessible"

log_info "===== Diagnostic Complete ====="

# Suggest next steps
log_info "Next steps:"
log_info "1. Make sure the Spring Boot app is running"
log_info "2. Verify environment file has correct baseUrl and authToken"
log_info "3. Run tests with: newman run \"$COLLECTION_PATH\" --environment \"$ENV_FILE\""