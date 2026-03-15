#!/bin/bash
#
# Development Server Start Script
#
# This script starts the development server with enhanced health checking and error handling
#
# Usage: ./start-dev.sh [--clean] [--debug] [--help]
#   --clean   Clean build before starting
#   --debug   Enable remote debugging on port 5005
#   --help    Show this help message
#

# Import common utility functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$PROJECT_ROOT/scripts/utils/template.sh"

# Variables
CLEAN_BUILD=false
DEBUG_MODE=false
MAX_HEALTH_RETRIES=30
HEALTH_CHECK_INTERVAL=2

# Parse script-specific arguments
parse_args() {
  for arg in "$@"; do
    case $arg in
      --clean)
        CLEAN_BUILD=true
        shift
        ;;
      --debug)
        DEBUG_MODE=true
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

# Show usage information
show_usage() {
  echo "Usage: $(basename "$0") [--clean] [--debug] [--help]"
  echo "  --clean   Clean build before starting"
  echo "  --debug   Enable remote debugging on port 5005"
  echo "  --help    Show this help message"
}

# Function to verify app is fully ready by checking multiple endpoints
verify_app_ready() {
  local host="localhost"
  local port=${1:-8080}
  local retries=${2:-$MAX_HEALTH_RETRIES}
  local interval=${3:-$HEALTH_CHECK_INTERVAL}
  
  print_info "Verifying application readiness..."
  
  # Check health endpoint first
  for ((i=1; i<=retries; i++)); do
    if curl -s "http://${host}:${port}/actuator/health" | grep -q "UP"; then
      print_success "Health check passed!"
      break
    fi
    
    if [ $i -eq $retries ]; then
      print_error "Health check failed after $retries attempts"
      return 1
    fi
    
    print_info "Waiting for application to start... ($i/$retries)"
    sleep $interval
  done
  
  # Check if API documentation is available
  if curl -s "http://${host}:${port}/v3/api-docs" > /dev/null; then
    print_success "API documentation is available"
  else
    print_warning "API documentation is not available"
  fi
  
  # Check if Swagger UI is available
  if curl -s "http://${host}:${port}/swagger-ui/index.html" > /dev/null; then
    print_success "Swagger UI is available"
  else
    print_warning "Swagger UI is not available"
  fi
  
  print_success "Application is ready!"
  return 0
}

# Function to start the development environment
start_dev_environment() {
  print_info "Starting development environment..."
  
  # Start the development environment if needed
  if ! check_env_running; then
    cd "$PROJECT_ROOT"
    ./scripts/dev/dev-env.sh start
    
    # Wait for environment to be ready
    sleep 5
    
    if check_env_running; then
      print_success "Development environment started successfully"
    else
      print_error "Failed to start development environment"
      return 1
    fi
  else
    print_success "Development environment is already running"
  fi
  
  return 0
}

# Main function to start the development server
start_dev_server() {
  print_header "Starting Development Server"
  
  # Check if the dev environment is running
  start_dev_environment
  
  # Build args
  local gradle_args="bootRun"
  
  if [ "$CLEAN_BUILD" = true ]; then
    print_info "Performing clean build first"
    gradle_args="clean $gradle_args"
  fi
  
  if [ "$DEBUG_MODE" = true ]; then
    print_info "Starting in debug mode (port 5005)"
    gradle_args="$gradle_args --debug-jvm"
  fi
  
  # Run the app with Gradle
  print_info "Starting application with Gradle..."
  print_info "Running: ./gradlew $gradle_args"
  
  cd "$PROJECT_ROOT"
  
  if ! ./gradlew $gradle_args; then
    print_error "Failed to start the application"
    return 1
  fi
  
  # The application should be running in the foreground now,
  # so the script will only continue if the user stops the app with Ctrl+C
  
  print_info "Application process terminated"
  return 0
}

# Parse arguments
parse_args "$@"

# Start the development server
start_dev_server
exit $?
