#!/bin/bash
#
# API Endpoints Test Script
#
# This script tests various API endpoints to ensure they're responding correctly
#
# Usage: ./test-endpoints.sh [--start-env] [--force]
#   --start-env  Start the development environment if not running
#   --force      Continue even if environment checks fail
#   --help       Show this help message
#

# Set up script environment
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
UTILS_DIR="$PROJECT_ROOT/scripts/utils"

# Fallback utility functions in case template.sh can't be loaded
if [ ! -f "$UTILS_DIR/template.sh" ]; then
    # Colors for output
    GREEN='\033[0;32m'
    RED='\033[0;31m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color
    
    # Print functions
    print_message() { echo -e "${2}${1}${NC}"; }
    print_success() { print_message "✓ $1" "$GREEN"; }
    print_error() { print_message "✗ $1" "$RED"; }
    print_warning() { print_message "! $1" "$YELLOW"; }
    print_info() { print_message "ℹ $1" "$BLUE"; }
    print_header() {
        echo -e "\n${BLUE}======================="
        echo -e "$1"
        echo -e "=======================${NC}\n"
    }
    
    # Environment variables
    API_READY=false
    FORCE=false
fi

# Source common utilities if available
if [ -f "$UTILS_DIR/template.sh" ]; then
    source "$UTILS_DIR/template.sh"
fi

# Base URL and authentication
BASE_URL="http://localhost:8080"
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJfaWQiOjEsInJvbGVzIjoiQURNSU4iLCJleHAiOjE3Nzc1MjUxMjN9.WEY-JpgMpisLbmmQYoJiS87qBIC9UY1qr2l2DL83T5A"

# Test function
test_endpoint() {
  local endpoint=$1
  local method=${2:-GET}
  local expected_status=${3:-200}
  local description=${4:-"Testing endpoint $endpoint"}
  local headers=${5:-""}
  
  print_info "Testing: $description"
  
  # Build the curl command
  local curl_cmd="curl -s -o /dev/null -w \"%{http_code}\" "
  
  # Add headers if any
  if [[ -n "$headers" ]]; then
    curl_cmd+="-H \"$headers\" "
  fi
  
  # Add method
  if [[ "$method" != "GET" ]]; then
    curl_cmd+="-X $method "
  fi
  
  # Add URL
  curl_cmd+="$BASE_URL$endpoint"
  
  # Execute the curl command
  local response=$(eval "$curl_cmd")
  
  # Check the status code
  if [[ "$response" == "$expected_status" ]]; then
    print_success "$endpoint: $response OK"
    return 0
  else
    print_error "$endpoint: Expected $expected_status but got $response"
    return 1
  fi
}

# Run all endpoint tests
run_endpoint_tests() {
  print_header "API Endpoint Tests"
  
  local failures=0
  
  # Public endpoints (should be accessible without authentication)
  test_endpoint "/actuator/health" "GET" 200 "Health check endpoint" || ((failures++))
  test_endpoint "/api/public" "GET" 200 "Public endpoint (testing with admin token)" "Authorization: Bearer $ADMIN_TOKEN" || ((failures++))
  
  # Authentication required endpoints
  test_endpoint "/api/user" "GET" 401 "User endpoint without auth (should fail with 401)" || ((failures++))
  test_endpoint "/api/admin" "GET" 401 "Admin endpoint without auth (should fail with 401)" || ((failures++))
  
  # User endpoint with admin token
  test_endpoint "/api/user" "GET" 200 "User endpoint with admin token" "Authorization: Bearer $ADMIN_TOKEN" || ((failures++))
  test_endpoint "/api/admin" "GET" 200 "Admin endpoint with admin token" "Authorization: Bearer $ADMIN_TOKEN" || ((failures++))
  
  # Reference data endpoints with authentication
  test_endpoint "/api/reference-data/makes" "GET" 200 "Car makes reference data" "Authorization: Bearer $ADMIN_TOKEN" || ((failures++))
  test_endpoint "/api/reference-data/models" "GET" 200 "Car models reference data" "Authorization: Bearer $ADMIN_TOKEN" || ((failures++))
  
  # API documentation
  test_endpoint "/swagger-ui/index.html" "GET" 200 "Swagger UI" || ((failures++))
  test_endpoint "/v3/api-docs" "GET" 200 "OpenAPI specification" || ((failures++))
  
  # Summary
  if [[ $failures -eq 0 ]]; then
    print_success "All endpoint tests passed!"
    return 0
  else
    print_error "$failures endpoint tests failed"
    return 1
  fi
}

# Main function that will be called after template initialization
main() {
  # Check API access
  check_api_running
  
  # Run tests if API is ready or if --force is used
  if [ "$API_READY" = true ] || [ "$FORCE" = true ]; then
    run_endpoint_tests
  else
    print_error "API is not running. Cannot perform tests."
    exit 1
  fi
}

# Call main function
main
