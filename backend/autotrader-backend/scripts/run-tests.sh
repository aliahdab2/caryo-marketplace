#!/bin/bash
#
# AutoTrader Unified Test Runner
#
# This script provides a centralized interface for running all types of tests 
# for the AutoTrader Backend project.
#
# Usage: ./run-tests.sh [COMMAND] [OPTIONS]
#

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Determine script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COLLECTIONS_DIR="$PROJECT_ROOT/src/test/resources/postman/collections"
ENVIRONMENT_FILE="$PROJECT_ROOT/src/test/resources/postman/environment.json"

# Print function helpers
print_header() {
  echo -e "\n${BLUE}======================="
  echo -e "$1"
  echo -e "=======================${NC}\n"
}

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}! $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ $1${NC}"; }

# Show help information
show_help() {
  print_header "AutoTrader Test Runner"
  echo "Usage: ./run-tests.sh [COMMAND] [OPTIONS]"
  echo
  echo "Commands:"
  echo "  postman [COLLECTION]   - Run Postman tests (all or specific collection)"
  echo "  unit                   - Run unit tests"
  echo "  integration            - Run integration tests"
  echo "  all                    - Run all tests"
  echo "  health                 - Run environment health check"
  echo "  help                   - Show this help message"
  echo
  echo "Options:"
  echo "  --start-env            - Start the development environment before tests"
  echo "  --stop-env             - Stop the development environment after tests"
  echo "  --report               - Generate HTML reports for test results"
  echo
  echo "Examples:"
  echo "  ./run-tests.sh postman                  # Run all Postman collections"
  echo "  ./run-tests.sh postman auth             # Run only auth Postman tests"
  echo "  ./run-tests.sh all --start-env          # Run all tests, starting environment"
  echo "  ./run-tests.sh unit                     # Run only unit tests"
  echo
}

# Function to ensure script is executable
ensure_executable() {
  if [ ! -x "$1" ]; then
    chmod +x "$1"
  fi
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

# Set up the environment for testing
setup_environment() {
  # Create environment file if it doesn't exist
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
  fi
  
  # Update baseUrl in environment file if needed
  BASE_URL="http://localhost:8080"
  
  # Use temporary file for jq operations
  TMP_ENV_FILE=$(mktemp)
  
  # Update the baseUrl in the environment file
  jq ".values = [.values[] | if .key == \"baseUrl\" then . + {\"value\": \"$BASE_URL\"} else . end]" "$ENVIRONMENT_FILE" > "$TMP_ENV_FILE"
  mv "$TMP_ENV_FILE" "$ENVIRONMENT_FILE"
  print_success "Updated baseUrl in environment file to: $BASE_URL"
}

# Start the development environment
start_dev_env() {
  if [ "$START_ENV" = true ]; then
    print_info "Starting development environment..."
    
    # Find the appropriate dev-env script
    if [ -f "$PROJECT_ROOT/.devenv/dev-env.sh" ]; then
      DEV_ENV_SCRIPT="$PROJECT_ROOT/.devenv/dev-env.sh"
    elif [ -f "$PROJECT_ROOT/dev-env.sh" ]; then
      DEV_ENV_SCRIPT="$PROJECT_ROOT/dev-env.sh"
    elif [ -f "$PROJECT_ROOT/scripts/dev/dev-env.sh" ]; then
      DEV_ENV_SCRIPT="$PROJECT_ROOT/scripts/dev/dev-env.sh"
    else
      print_error "Development environment script not found"
      exit 1
    fi
    
    # Make the script executable
    ensure_executable "$DEV_ENV_SCRIPT"
    
    # Start the environment
    "$DEV_ENV_SCRIPT" start
    
    # Set flag to indicate that we started the environment
    ENV_STARTED_BY_SCRIPT=true
    
    print_success "Development environment started"
  fi
}

# Stop the development environment
stop_dev_env() {
  if [ "$STOP_ENV" = true ] && [ "$ENV_STARTED_BY_SCRIPT" = true ]; then
    print_info "Stopping development environment..."
    
    # Find the appropriate dev-env script
    if [ -f "$PROJECT_ROOT/.devenv/dev-env.sh" ]; then
      DEV_ENV_SCRIPT="$PROJECT_ROOT/.devenv/dev-env.sh"
    elif [ -f "$PROJECT_ROOT/dev-env.sh" ]; then
      DEV_ENV_SCRIPT="$PROJECT_ROOT/dev-env.sh"
    elif [ -f "$PROJECT_ROOT/scripts/dev/dev-env.sh" ]; then
      DEV_ENV_SCRIPT="$PROJECT_ROOT/scripts/dev/dev-env.sh"
    else
      print_error "Development environment script not found"
      exit 1
    fi
    
    # Make the script executable
    ensure_executable "$DEV_ENV_SCRIPT"
    
    # Stop the environment
    "$DEV_ENV_SCRIPT" stop
    
    print_success "Development environment stopped"
  fi
}

# Run unit tests
run_unit_tests() {
  print_header "Running Unit Tests"
  
  cd "$PROJECT_ROOT"
  ./gradlew test --tests "*.unit.*"
  
  TEST_EXIT_CODE=$?
  
  if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "Unit tests completed successfully"
    return 0
  else
    print_error "Unit tests failed with exit code $TEST_EXIT_CODE"
    return $TEST_EXIT_CODE
  fi
}

# Run integration tests
run_integration_tests() {
  print_header "Running Integration Tests"
  
  cd "$PROJECT_ROOT"
  ./gradlew test --tests "*.integration.*"
  
  TEST_EXIT_CODE=$?
  
  if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "Integration tests completed successfully"
    return 0
  else
    print_error "Integration tests failed with exit code $TEST_EXIT_CODE"
    return $TEST_EXIT_CODE
  fi
}

# Run all gradle tests
run_gradle_tests() {
  print_header "Running All Gradle Tests"
  
  cd "$PROJECT_ROOT"
  ./gradlew test
  
  TEST_EXIT_CODE=$?
  
  if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "All tests completed successfully"
    return 0
  else
    print_error "Tests failed with exit code $TEST_EXIT_CODE"
    return $TEST_EXIT_CODE
  fi
}

# Run Postman tests
run_postman_tests() {
  print_header "Running Postman Tests"
  
  # Check if Newman is installed
  check_newman
  
  # Set up the environment
  setup_environment
  
  # Check if collections directory exists
  if [ ! -d "$COLLECTIONS_DIR" ]; then
    print_error "Collections directory not found: $COLLECTIONS_DIR"
    return 1
  fi
  
  # Set up reports directory
  REPORT_DIR="$PROJECT_ROOT/build/test-reports/postman"
  mkdir -p "$REPORT_DIR"
  print_info "Test reports will be saved in: $REPORT_DIR"
  
  # Run specific collection if specified
  if [ -n "$POSTMAN_COLLECTION" ]; then
    collection_file="$COLLECTIONS_DIR/${POSTMAN_COLLECTION}-tests.json"
    
    if [ ! -f "$collection_file" ]; then
      print_error "Collection file not found: $collection_file"
      return 1
    fi
    
    print_info "Running collection: $POSTMAN_COLLECTION"
    run_single_collection "$collection_file" "$POSTMAN_COLLECTION"
    return $?
  else
    # Run all collections
    print_info "Running all Postman collections"
    
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
      return 0
    else
      print_error "$failed_collections out of $total_collections collections failed"
      return 1
    fi
  fi
}

# Run a single Postman collection
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
    print_success "$collection_name tests passed"
    return 0
  else
    print_error "$collection_name tests failed with exit code $exit_code"
    print_info "View the full report at: $REPORT_DIR/$report_name.html"
    return 1
  fi
}

# Run health check
run_health_check() {
  print_header "Running Health Check"
  
  # Check API status
  print_info "Checking API status..."
  if curl -s http://localhost:8080/status &> /dev/null; then
    print_success "API is running"
  else
    print_error "API is not available"
  fi
  
  # Check database
  print_info "Checking database connection..."
  if pg_isready -h localhost -p 5432 &> /dev/null; then
    print_success "Database is running"
  else
    print_error "Database is not available"
  fi
  
  # Check available disk space
  print_info "Checking disk space..."
  df -h | grep -E '(Filesystem|/$)'
  
  # Check memory usage
  print_info "Checking memory usage..."
  free -h
  
  print_success "Health check complete"
}

# Main function
main() {
  # Default values
  START_ENV=false
  STOP_ENV=false
  GENERATE_REPORT=false
  ENV_STARTED_BY_SCRIPT=false
  POSTMAN_COLLECTION=""
  
  # No arguments provided
  if [ "$#" -eq 0 ]; then
    show_help
    exit 0
  fi
  
  # Get the command
  COMMAND="$1"
  shift
  
  # Parse options
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --start-env)
        START_ENV=true
        shift
        ;;
      --stop-env)
        STOP_ENV=true
        shift
        ;;
      --report)
        GENERATE_REPORT=true
        shift
        ;;
      --help)
        show_help
        exit 0
        ;;
      *)
        # If it's not a recognized option, it might be a collection name
        if [ "$COMMAND" = "postman" ] && [ -z "$POSTMAN_COLLECTION" ]; then
          POSTMAN_COLLECTION="$1"
        else
          print_error "Unknown option: $1"
          show_help
          exit 1
        fi
        shift
        ;;
    esac
  done
  
  # Start the development environment if needed
  start_dev_env
  
  # Execute the command
  case "$COMMAND" in
    postman)
      run_postman_tests
      ;;
    unit)
      run_unit_tests
      ;;
    integration)
      run_integration_tests
      ;;
    all)
      # Run all tests
      run_gradle_tests
      GRADLE_EXIT_CODE=$?
      
      run_postman_tests
      POSTMAN_EXIT_CODE=$?
      
      # If either test type failed, return non-zero exit code
      if [ $GRADLE_EXIT_CODE -ne 0 ] || [ $POSTMAN_EXIT_CODE -ne 0 ]; then
        print_error "Some tests failed"
        exit 1
      fi
      
      print_success "All tests passed"
      ;;
    health)
      run_health_check
      ;;
    help)
      show_help
      ;;
    *)
      print_error "Unknown command: $COMMAND"
      show_help
      exit 1
      ;;
  esac
  
  # Capture the exit code from the command execution
  EXIT_CODE=$?
  
  # Stop the development environment if needed
  stop_dev_env
  
  exit $EXIT_CODE
}

# Set up trap for cleanup on exit
trap stop_dev_env EXIT

# Run the main function with all arguments
main "$@"
