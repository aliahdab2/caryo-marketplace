#!/bin/bash
#
# Unified AutoTrader Postman Tests Runner
#
# This script runs Postman tests against the AutoTrader backend API with improved
# test handling, authentication management, and error reporting.
#
# Usage: ./run-tests.sh [OPTIONS]
#   Options:
#     --collection COLLECTION  Run only specified collection (auth, reference-data, etc.)
#     --env-only               Only set up environment, don't run tests
#     --start-env              Ensure dev environment is started before tests
#     --stop-env               Stop dev environment after tests complete
#     --help                   Display this help message
#

# Determine script and project directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COLLECTIONS_DIR="$PROJECT_ROOT/src/test/resources/postman/collections"
ENVIRONMENT_FILE="$PROJECT_ROOT/src/test/resources/postman/environment.json"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables with default values
START_ENV=false
STOP_ENV=false
ENV_ONLY=false
SPECIFIED_COLLECTION=""
ENV_STARTED_BY_SCRIPT=false

# Print functions
print_header() {
  echo -e "\n${BLUE}======================="
  echo -e "$1"
  echo -e "=======================${NC}\n"
}

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}! $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ $1${NC}"; }

# Show usage information
show_usage() {
  print_header "AutoTrader Postman Tests Runner"
  echo "Usage: ./run-tests.sh [OPTIONS]"
  echo
  echo "Options:"
  echo "  --collection COLLECTION  Run only specified collection (auth, reference-data, etc.)"
  echo "  --env-only               Only set up environment, don't run tests"
  echo "  --start-env              Ensure dev environment is started before tests"
  echo "  --stop-env               Stop dev environment after tests complete"
  echo "  --help                   Display this help message"
  echo
  echo "Examples:"
  echo "  ./run-tests.sh                          # Run all tests"
  echo "  ./run-tests.sh --collection auth        # Run only auth tests"
  echo "  ./run-tests.sh --start-env --stop-env   # Start env, run tests, stop env"
  echo
}

# Parse arguments
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --collection)
        SPECIFIED_COLLECTION="$2"
        shift 2
        ;;
      --env-only)
        ENV_ONLY=true
        shift
        ;;
      --start-env)
        START_ENV=true
        shift
        ;;
      --stop-env)
        STOP_ENV=true
        shift
        ;;
      --help)
        show_usage
        exit 0
        ;;
      *)
        print_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
    esac
  done
}

# Check if Newman is installed
check_newman() {
  if ! command -v newman &> /dev/null; then
    print_warning "Newman is not installed. Installing now..."
    npm install -g newman newman-reporter-htmlextra
    if [ $? -ne 0 ]; then
      print_error "Failed to install Newman. Please install it manually: npm install -g newman newman-reporter-htmlextra"
      exit 1
    fi
    print_success "Newman installed successfully"
  fi
}

# Ensure the development environment is running
ensure_dev_env() {
  if [ "$START_ENV" = true ]; then
    print_info "Checking if development environment is running..."
    
    # Try to reach the health endpoint
    if ! curl -s http://localhost:8080/status &> /dev/null; then
      print_warning "Development environment is not running. Starting it..."
      
      # Ensure dev-env.sh exists and is executable
      DEV_ENV_SCRIPT="$PROJECT_ROOT/.devenv/dev-env.sh"
      if [ ! -f "$DEV_ENV_SCRIPT" ]; then
        print_error "Development environment script not found at: $DEV_ENV_SCRIPT"
        exit 1
      fi
      
      if [ ! -x "$DEV_ENV_SCRIPT" ]; then
        chmod +x "$DEV_ENV_SCRIPT"
      fi
      
      # Start the environment
      "$DEV_ENV_SCRIPT" start
      
      # Set flag to indicate that we started the environment
      ENV_STARTED_BY_SCRIPT=true
      
      print_success "Development environment started successfully"
    else
      print_success "Development environment is already running"
    fi
  fi
}

# Generate report directory
setup_report_dir() {
  REPORT_DIR="$PROJECT_ROOT/build/test-reports/postman"
  mkdir -p "$REPORT_DIR"
  print_info "Test reports will be saved in: $REPORT_DIR"
  return 0
}

# Setup environment variables
setup_environment() {
  # Check if environment file exists
  if [ ! -f "$ENVIRONMENT_FILE" ]; then
    print_warning "Environment file not found. Creating a default environment file..."
    
    # Create directory if it doesn't exist
    mkdir -p "$(dirname "$ENVIRONMENT_FILE")"
    
    # Create a basic environment file
    cat > "$ENVIRONMENT_FILE" << EOF
{
  "id": "autotrader-env-$(date +%s)",
  "name": "AutoTrader Environment",
  "values": [
    {
      "key": "baseUrl",
      "value": "http://localhost:8080",
      "type": "default",
      "enabled": true
    },
    {
      "key": "auth_token",
      "value": "",
      "type": "default",
      "enabled": true
    },
    {
      "key": "admin_username",
      "value": "admin",
      "type": "default",
      "enabled": true
    },
    {
      "key": "admin_password",
      "value": "Admin123!",
      "type": "default",
      "enabled": true
    },
    {
      "key": "test_username",
      "value": "testuser",
      "type": "default",
      "enabled": true
    },
    {
      "key": "test_email",
      "value": "testuser@example.com",
      "type": "default",
      "enabled": true
    },
    {
      "key": "test_password",
      "value": "Password123!",
      "type": "default",
      "enabled": true
    }
  ],
  "_postman_variable_scope": "environment"
}
EOF
    print_success "Created default environment file"
  else
    print_success "Found existing environment file"
  fi
  
  # Update baseUrl in environment file
  BASE_URL="http://localhost:8080"
  
  # Use temporary file for jq operations
  TMP_ENV_FILE=$(mktemp)
  
  # Update the baseUrl in the environment file
  jq ".values = [.values[] | if .key == \"baseUrl\" then . + {\"value\": \"$BASE_URL\"} else . end]" "$ENVIRONMENT_FILE" > "$TMP_ENV_FILE"
  mv "$TMP_ENV_FILE" "$ENVIRONMENT_FILE"
  print_success "Updated baseUrl in environment file to: $BASE_URL"
}

# Run all tests or a specific collection
run_tests() {
  if [ "$ENV_ONLY" = true ]; then
    print_info "Environment setup complete. Skipping test execution as requested."
    return 0
  fi
  
  # Check for collections directory
  if [ ! -d "$COLLECTIONS_DIR" ]; then
    print_error "Collections directory not found: $COLLECTIONS_DIR"
    return 1
  fi
  
  # Run specified collection or all collections
  if [ -n "$SPECIFIED_COLLECTION" ]; then
    collection_file="$COLLECTIONS_DIR/${SPECIFIED_COLLECTION}-tests.json"
    
    if [ ! -f "$collection_file" ]; then
      print_error "Collection file not found: $collection_file"
      return 1
    fi
    
    print_header "Running $SPECIFIED_COLLECTION tests"
    run_single_collection "$collection_file" "$SPECIFIED_COLLECTION"
  else
    print_header "Running all Postman collections"
    
    total_collections=0
    failed_collections=0
    
    for collection_file in "$COLLECTIONS_DIR"/*-tests.json; do
      if [ -f "$collection_file" ]; then
        collection_name=$(basename "$collection_file" | sed 's/-tests.json//')
        total_collections=$((total_collections + 1))
        
        print_info "Running collection: $collection_name"
        if ! run_single_collection "$collection_file" "$collection_name"; then
          failed_collections=$((failed_collections + 1))
        fi
        
        echo # Add newline between collections
      fi
    done
    
    print_header "Test Summary"
    print_info "Total collections: $total_collections"
    
    if [ "$failed_collections" -eq 0 ]; then
      print_success "All collections passed"
    else
      print_error "$failed_collections out of $total_collections collections failed"
      return 1
    fi
  fi
  
  return 0
}

# Run a single collection with Newman
run_single_collection() {
  local collection_file="$1"
  local collection_name="$2"
  local report_name="${collection_name}-report"
  
  print_info "Executing tests in: $collection_name"
  
  newman run "$collection_file" \
    --environment "$ENVIRONMENT_FILE" \
    --reporters cli,htmlextra \
    --reporter-htmlextra-export "$REPORT_DIR/$report_name.html" \
    --reporter-htmlextra-title "AutoTrader $collection_name Tests" \
    --reporter-htmlextra-darkTheme \
    --reporter-htmlextra-showEnvironmentData \
    --insecure
  
  local exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    print_success "$collection_name tests passed successfully"
    return 0
  else
    print_error "$collection_name tests failed with exit code $exit_code"
    print_info "View the full report at: $REPORT_DIR/$report_name.html"
    return 1
  fi
}

# Clean up resources
cleanup() {
  # Only stop the environment if we started it and --stop-env was specified
  if [ "$ENV_STARTED_BY_SCRIPT" = true ] && [ "$STOP_ENV" = true ]; then
    print_info "Stopping the development environment..."
    
    DEV_ENV_SCRIPT="$PROJECT_ROOT/.devenv/dev-env.sh"
    if [ -f "$DEV_ENV_SCRIPT" ] && [ -x "$DEV_ENV_SCRIPT" ]; then
      "$DEV_ENV_SCRIPT" stop
      print_success "Development environment stopped"
    else
      print_error "Failed to stop development environment. Script not found: $DEV_ENV_SCRIPT"
    fi
  elif [ "$STOP_ENV" = true ]; then
    print_warning "Not stopping environment as it was already running before this script"
  fi
}

# Set up trap for cleanup on exit
trap cleanup EXIT

# Main function
main() {
  print_header "AutoTrader Postman Tests Runner"
  
  parse_args "$@"
  check_newman
  ensure_dev_env
  setup_report_dir
  setup_environment
  
  # If any of these steps fail, exit
  if [ $? -ne 0 ]; then
    print_error "Setup failed. Exiting."
    exit 1
  fi
  
  if ! run_tests; then
    print_error "Tests failed"
    echo -e "\n${YELLOW}See detailed HTML reports at: ${CYAN}file://$REPORT_DIR${NC}"
    exit 1
  fi
  
  print_success "All tests completed successfully"
  
  if [ -d "$REPORT_DIR" ]; then
    echo -e "\n${YELLOW}HTML reports available at: ${CYAN}file://$REPORT_DIR${NC}"
  fi
}

# Run main function with all arguments
main "$@"
