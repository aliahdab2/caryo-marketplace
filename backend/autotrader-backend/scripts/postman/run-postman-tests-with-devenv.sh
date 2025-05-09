#!/bin/bash
#
# Run Postman Tests with Development Environment Script
#
# This script runs Postman tests with the development environment.
# It automatically manages the lifecycle of the development environment,
# starting it if needed and optionally stopping it when tests complete.
#
# Usage: ./run-postman-tests-with-devenv.sh [--keep-env] [--force]
#   --keep-env     Don't stop the environment after tests finish
#   --force        Continue even if some tests fail
#   --help         Show this help message
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
    ENV_STARTED_BY_SCRIPT=false
    KEEP_ENV=false
    FORCE_CONTINUE=false
fi

# Source common utilities if available
if [ -f "$UTILS_DIR/template.sh" ]; then
    source "$UTILS_DIR/template.sh"
fi

# Variables
KEEP_ENV=false
FORCE_CONTINUE=false
ENV_STARTED_BY_SCRIPT=false
SERVER_PORT=8080

# Parse script-specific arguments
parse_args() {
  for arg in "$@"; do
    case $arg in
      --keep-env)
        KEEP_ENV=true
        shift
        ;;
      --force)
        FORCE_CONTINUE=true
        shift
        ;;
      --help)
        show_usage
        exit 0
        ;;
      *)
        # Unknown option
        ;;
    esac
  done
}

# Custom cleanup function
cleanup() {
  print_info "Cleaning up..."
  
  # Only stop the environment if we started it and --keep-env wasn't specified
  if [ "$ENV_STARTED_BY_SCRIPT" = true ] && [ "$KEEP_ENV" = false ]; then
    print_info "Stopping development environment..."
    cd "$PROJECT_ROOT"
    ./scripts/dev/dev-env.sh stop
    print_success "Development environment stopped"
  else
    print_info "Leaving environment running as requested or it was started externally"
  fi
  
  print_success "Cleanup complete"
}

# Register the cleanup function to be called on script exit
trap cleanup EXIT

# Show usage information
show_usage() {
  echo "Usage: $(basename "$0") [--keep-env] [--force]"
  echo "  --keep-env     Don't stop the environment after tests finish"
  echo "  --force        Continue even if some tests fail"
  echo "  --help         Show this help message"
}

# Main function
run_tests() {
  print_header "Running Postman Tests with Full Development Environment"
  
  # Prepare test assets (create test images, PDFs, etc.)
  print_info "Preparing test assets for Postman tests..."
  "$PROJECT_ROOT/scripts/test/prepare-test-assets.sh"
  
  # Check if the environment is already running
  print_info "Checking if development environment is already running..."
  
  # Try to hit the health endpoint
  if curl -s "http://localhost:${SERVER_PORT}/actuator/health" > /dev/null 2>&1; then
    print_success "Development environment is already running!"
    ENV_STARTED_BY_SCRIPT=false
  else
    print_info "Development environment is not running. Starting it..."
    cd "$PROJECT_ROOT"
    ./scripts/dev/dev-env.sh start
    ENV_STARTED_BY_SCRIPT=true
    
    # Wait for the environment to be ready
    print_info "Waiting for the environment to be ready..."
    
    # Initialize counter for timeout
    local timeout=60  # 60 seconds timeout
    local counter=0
    
    while ! curl -s "http://localhost:${SERVER_PORT}/actuator/health" > /dev/null 2>&1; do
      sleep 1
      counter=$((counter + 1))
      
      if [ $counter -ge $timeout ]; then
        print_error "Timed out waiting for the environment to be ready"
        exit 1
      fi
      
      # Show progress every 5 seconds
      if [ $((counter % 5)) -eq 0 ]; then
        print_info "Still waiting for environment to be ready... ($counter seconds)"
      fi
    done
    
    print_success "Development environment is ready!"
  fi
  
  # Run the Postman tests
  print_info "Running Postman tests..."
  
  # Run all collections
  cd "$PROJECT_ROOT"
  
  if "$PROJECT_ROOT/scripts/postman/run-collections.sh" --all; then
    print_success "All Postman tests passed!"
    exit_code=0
  else
    print_error "Some Postman tests failed"
    exit_code=1
    
    if [ "$FORCE_CONTINUE" = false ]; then
      return $exit_code
    else
      print_warning "Continuing despite test failures (--force specified)"
    fi
  fi
  
  return $exit_code
}

# Parse arguments
parse_args "$@"

# Run the tests
run_tests
exit $?
