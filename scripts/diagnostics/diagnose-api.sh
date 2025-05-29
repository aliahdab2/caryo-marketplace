#!/bin/bash
# Unified diagnostic script for Caryo Marketplace API
# This script combines the functionality of multiple diagnostic scripts
# Usage: ./diagnose-api.sh [baseUrl]

# Color definitions
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

print_header() {
  echo -e "\n${CYAN}${BOLD}======== $1 ========${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

BASE_URL=${1:-"http://localhost:8080"}

print_header "Caryo Marketplace API Diagnostics"
echo "Date: $(date)"
echo "Base URL: $BASE_URL"

# Check server health
print_header "Server Health Check"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/actuator/health)
if [ "$HEALTH_STATUS" = "200" ]; then
  print_success "Server is healthy ($HEALTH_STATUS)"
  curl -s $BASE_URL/actuator/health | grep -v password | grep -v secret
else
  print_error "Server health check failed ($HEALTH_STATUS)"
  echo "Detailed health response:"
  curl -s $BASE_URL/actuator/health
fi

# Check authentication endpoints
print_header "Authentication Endpoints Check"

echo "Testing /api/auth/* endpoints (correct path pattern):"
API_SIGNUP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/auth/signup)
echo "- /api/auth/signup: $API_SIGNUP_STATUS"
if [ "$API_SIGNUP_STATUS" = "401" ]; then
  print_error "Signup endpoint at /api/auth/signup requires authentication! Should be public."
elif [ "$API_SIGNUP_STATUS" = "404" ]; then
  print_error "Signup endpoint at /api/auth/signup not found (404)."
else
  print_success "Signup endpoint at /api/auth/signup is accessible"
fi

API_SIGNIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/auth/signin)
echo "- /api/auth/signin: $API_SIGNIN_STATUS"
if [ "$API_SIGNIN_STATUS" = "401" ]; then
  print_error "Signin endpoint at /api/auth/signin requires authentication! Should be public."
elif [ "$API_SIGNIN_STATUS" = "404" ]; then
  print_error "Signin endpoint at /api/auth/signin not found (404)."
else
  print_success "Signin endpoint at /api/auth/signin is accessible"
fi

# Test authentication
print_header "Authentication Test"

echo "Testing signup with valid payload..."
SIGNUP_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"diagtest","email":"diagtest@example.com","password":"password123"}')

echo "Signup response:"
echo "$SIGNUP_RESPONSE" | grep -v password | grep -v secret

echo "Testing signin with test credentials..."
SIGNIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}')

echo "Signin response:"
echo "$SIGNIN_RESPONSE" | grep -v password | grep -v secret

# Extract token if available
TOKEN=$(echo "$SIGNIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d':' -f2 | tr -d '"' || echo "")
if [ ! -z "$TOKEN" ]; then
  print_success "Successfully extracted token"
  
  # Test a protected endpoint with token
  echo "Testing protected endpoint with token..."
  AUTH_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/test/user)
  echo "Protected endpoint response:"
  echo "$AUTH_RESPONSE" | grep -v password | grep -v secret
else
  print_error "Failed to extract token from signin response"
fi

# Check Postman collection
print_header "Postman Collection Check"

# Try to find the collection file
COLLECTION_PATH=""
POSSIBLE_PATHS=(
  "./backend/autotrader-backend/src/test/resources/postman/autotrader-api-collection.json"
  "./postman/autotrader-api-collection.json"
  "./postman/Caryo_Marketplace_API_Tests.json"
)

for path in "${POSSIBLE_PATHS[@]}"; do
  if [ -f "$path" ]; then
    COLLECTION_PATH="$path"
    print_success "Found collection file: $COLLECTION_PATH"
    break
  fi
done

if [ -z "$COLLECTION_PATH" ]; then
  print_error "No Postman collection file found!"
  exit 1
fi

# Check if jq is installed
if command -v jq &> /dev/null; then
  echo "Analyzing collection paths..."
  
  # Check for auth endpoints in collection
  AUTH_ENDPOINTS=$(jq -r '.. | select(.request?.url?.raw? != null) | select(.request.url.raw | contains("/auth/"))' "$COLLECTION_PATH")
  if [ ! -z "$AUTH_ENDPOINTS" ]; then
    AUTH_COUNT=$(echo "$AUTH_ENDPOINTS" | jq -r '.request.url.raw' 2>/dev/null | wc -l | xargs)
    echo "Found $AUTH_COUNT auth-related endpoints"
    
    # Check if all raw URLs use /api/auth/ pattern
    RAW_API_AUTH_COUNT=$(echo "$AUTH_ENDPOINTS" | jq -r 'select(.request.url.raw | contains("/api/auth/")) | .request.url.raw' 2>/dev/null | wc -l | xargs)
    if [ "$RAW_API_AUTH_COUNT" -eq "$AUTH_COUNT" ]; then
      print_success "All auth endpoints use /api/auth/* pattern ✓"
    else
      print_warning "Not all auth endpoints use /api/auth/* pattern"
    fi
  else
    print_warning "No auth endpoints found in collection"
  fi
else
  echo "jq not installed. Using basic checks..."
  if grep -q '"/api/auth/' "$COLLECTION_PATH"; then
    print_success "Collection uses /api/auth/ pattern ✓"
  elif grep -q '"/auth/' "$COLLECTION_PATH"; then
    print_warning "Collection uses /auth/ pattern without '/api' prefix"
  fi
fi

print_header "Diagnostics Complete"
