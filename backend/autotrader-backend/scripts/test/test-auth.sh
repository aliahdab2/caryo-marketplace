#!/bin/bash
#
# Authentication Endpoints Test Script
#
# This script tests the authentication endpoints of the AutoTrader API
# including registration, login, and token validation.
#
# Usage: ./test-auth.sh [--start-env] [--force]
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

# Configuration variables
BASE_URL="http://localhost:8080"
USERNAME="testuser"
EMAIL="test@example.com"
PASSWORD="password123"

# Main test function
run_auth_tests() {
  print_header "Authentication Endpoints Test"
  
  # Register a new user
  print_info "Registering a new user..."
  REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"${USERNAME}\",\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")
  
  echo "Registration Response: $REGISTER_RESPONSE"
  
  # Check if registration was successful
  if echo "$REGISTER_RESPONSE" | grep -q "success"; then
    print_success "User registered successfully"
  else
    print_warning "Registration failed or user may already exist"
  fi
  
  # Login with the registered user
  print_info "Logging in..."
  LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/signin" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}")
  
  echo "Login Response: $LOGIN_RESPONSE"
  
  # Extract JWT token from login response
  TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')
  
  if [ -n "$TOKEN" ]; then
    print_success "Token successfully extracted"
    
    # Test public endpoint (should work without token)
    print_info "Testing public endpoint..."
    PUBLIC_RESPONSE=$(curl -s "${BASE_URL}/api/public" \
      -H "Content-Type: application/json")
    
    echo "Public Endpoint Response: $PUBLIC_RESPONSE"
    
    # Test protected endpoint (should require valid token)
    print_info "Testing protected endpoint with token..."
    PROTECTED_RESPONSE=$(curl -s "${BASE_URL}/api/user" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "Protected Endpoint Response: $PROTECTED_RESPONSE"
    
    # Test admin endpoint (should be forbidden for regular users)
    print_info "Testing admin endpoint with user token (should be forbidden)..."
    ADMIN_RESPONSE=$(curl -s "${BASE_URL}/api/admin" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "Admin Endpoint Response: $ADMIN_RESPONSE"
    
    print_success "Authentication tests completed"
  else
    print_error "Failed to extract token from login response"
    return 1
  fi
}

# Main function that will be called after template initialization
main() {
  # Check API access
  check_api_running
  
  # Run tests if API is ready or if --force is used
  if [ "$API_READY" = true ] || [ "$FORCE" = true ]; then
    run_auth_tests
  else
    print_error "API is not running. Cannot perform tests."
    exit 1
  fi
}

# Call main function
main
