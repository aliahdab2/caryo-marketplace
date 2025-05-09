#!/bin/bash
#
# Reference Data API Test Script
#
# This script tests the reference data API endpoints of the AutoTrader application
#
# Usage: ./test-reference-data.sh [--start-env] [--force] [--postman]
#   --start-env  Start the development environment if not running
#   --force      Continue even if environment checks fail
#   --postman    Run tests using Postman collections instead of curl
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
    USE_POSTMAN=false
fi

# Source common utilities if available
if [ -f "$UTILS_DIR/template.sh" ]; then
    source "$UTILS_DIR/template.sh"
fi

# Settings
BASE_URL="http://localhost:8080"
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTc0NjYxNjk5NSwiZXhwIjoxNzQ2NzAzMzk1fQ.hYf5Vgn7FbwmimcR07pi_-19GsvTo2bS3eOUK1zy-5M"
POSTMAN_DIR="$PROJECT_ROOT/src/test/resources/postman"
USE_POSTMAN=false

# Parse script-specific arguments
parse_args() {
  for arg in "$@"; do
    case $arg in
      --postman)
        USE_POSTMAN=true
        shift
        ;;
      *)
        # Other args are handled by template
        ;;
    esac
  done
}

# Show usage information
show_usage() {
  echo "Usage: $(basename "$0") [--start-env] [--force] [--postman]"
  echo "  --start-env  Start the development environment if not running"
  echo "  --force      Continue even if environment checks fail"
  echo "  --postman    Run tests using Postman collections instead of curl"
  echo "  --help       Show this help message"
}

# Test a single reference data endpoint with curl
test_reference_endpoint() {
  local endpoint=$1
  local entity_name=${2:-$(basename "$endpoint")}
  
  print_info "Testing $entity_name endpoint: $endpoint"
  
  # Try to call the endpoint
  local response=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE_URL$endpoint")
  
  # Check if response contains data
  if echo "$response" | grep -q "data"; then
    print_success "$entity_name data retrieved successfully"
    
    # Count items
    local count=$(echo "$response" | grep -o "\"id\"" | wc -l)
    print_info "Retrieved $count $entity_name items"
    
    # Show sample data
    local sample=$(echo "$response" | grep -A 5 "\"id\"" | head -n 6)
    print_info "Sample data: $(echo $sample | tr -d '\n')"
    
    return 0
  else
    print_error "Failed to retrieve $entity_name data"
    print_error "Response: $response"
    return 1
  fi
}

# Run reference data tests using curl
run_curl_tests() {
  print_header "Reference Data API Tests (curl)"
  
  local failures=0
  
  # Test various reference data endpoints
  test_reference_endpoint "/api/reference/makes" "car makes" || ((failures++))
  test_reference_endpoint "/api/reference/models" "car models" || ((failures++))
  test_reference_endpoint "/api/reference/colors" "car colors" || ((failures++))
  test_reference_endpoint "/api/reference/body-types" "body types" || ((failures++))
  test_reference_endpoint "/api/reference/fuel-types" "fuel types" || ((failures++))
  test_reference_endpoint "/api/reference/transmission-types" "transmission types" || ((failures++))
  
  # Summary
  if [[ $failures -eq 0 ]]; then
    print_success "All reference data tests passed!"
    return 0
  else
    print_error "$failures reference data tests failed"
    return 1
  fi
}

# Run reference data tests using Postman collections
run_postman_tests() {
  print_header "Reference Data API Tests (Postman)"
  
  # Check if Newman is installed
  if ! command_exists newman; then
    print_error "Newman is not installed. Please install it using: npm install -g newman"
    print_info "Falling back to curl tests..."
    run_curl_tests
    return $?
  fi
  
  print_info "Running Postman collections for reference data entities..."
  
  # Update the environment file with the base URL
  if command_exists jq; then
    print_info "Updating environment file with base URL: $BASE_URL"
    jq ".values += [{\"key\": \"baseUrl\", \"value\": \"$BASE_URL\", \"enabled\": true}]" $POSTMAN_DIR/environment.json > $POSTMAN_DIR/env-temp.json
    mv $POSTMAN_DIR/env-temp.json $POSTMAN_DIR/environment.json
  else
    print_warning "jq is not installed. Cannot update environment file automatically."
    print_info "Please ensure the environment file has the correct base URL."
  fi
  
  # Run the reference data collections
  cd "$PROJECT_ROOT"
  if "$PROJECT_ROOT/scripts/postman/run-collections.sh"; then
    print_success "Postman tests completed successfully"
    return 0
  else
    print_error "Some Postman tests failed"
    return 1
  fi
}

# Main function
main() {
  # Parse script-specific arguments
  parse_args "$@"
  
  # Run tests based on mode
  if [ "$USE_POSTMAN" = true ]; then
    run_postman_tests
  else
    run_curl_tests
  fi
}

# Entry point function
init() {
  # Parse script-specific arguments
  parse_args "$@"
  
  # Check API access
  check_api_running
  
  # Run tests if API is ready or if --force is used
  if [ "$API_READY" = true ] || [ "$FORCE" = true ]; then
    main "$@"
  else
    print_error "API is not running. Cannot perform tests."
    exit 1
  fi
}

# Execute the entry point
init "$@"
