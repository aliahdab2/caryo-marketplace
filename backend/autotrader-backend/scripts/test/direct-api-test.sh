#!/bin/bash
#
# Direct API Test Script
#
# This script tests the API endpoints directly using curl commands
# that we know work based on our previous testing.

# Import common utility functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$PROJECT_ROOT/scripts/utils/template.sh"

# Variables
API_BASE_URL="http://localhost:8080"
AUTH_TOKEN=""

# Authentication tests
print_header "Testing Authentication Endpoints"

# Test user registration
print_info "Testing user registration endpoint"
RANDOM_USER="testuser_$(date +%s)"
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$RANDOM_USER\",\"password\":\"Password123!\",\"email\":\"$RANDOM_USER@example.com\",\"firstName\":\"Test\",\"lastName\":\"User\"}")

print_info "Registration response: $REGISTER_RESPONSE"
if [[ "$REGISTER_RESPONSE" == *"success"* ]]; then
  print_success "User registration successful"
else
  print_warning "User registration returned: $REGISTER_RESPONSE"
fi

# Test user login
print_info "Testing user login endpoint"
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"user\",\"password\":\"Password123!\"}")

print_info "Login response: $LOGIN_RESPONSE"
if [[ "$LOGIN_RESPONSE" == *"token"* ]]; then
  AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d '"' -f 4)
  print_success "Login successful, token obtained: ${AUTH_TOKEN:0:20}..."
else
  print_error "Login failed: $LOGIN_RESPONSE"
  exit 1
fi

# Test reference data endpoint
print_header "Testing Reference Data Endpoint"
print_info "Testing reference data endpoint with authentication"
REF_DATA_RESPONSE=$(curl -s -X GET "$API_BASE_URL/reference-data" \
  -H "Authorization: Bearer $AUTH_TOKEN")

print_info "Reference data response length: ${#REF_DATA_RESPONSE} characters"
if [[ ${#REF_DATA_RESPONSE} -gt 100 ]]; then
  print_success "Reference data endpoint returned data"
  echo "$REF_DATA_RESPONSE" | grep -o '{.*}' | head -c 100
  echo "..."
else
  print_error "Reference data endpoint returned invalid data: $REF_DATA_RESPONSE"
fi

# Summary
print_header "Test Summary"
print_success "All direct API tests completed"
