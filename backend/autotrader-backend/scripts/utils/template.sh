#!/bin/bash
#
# Template script with environment checks and utility functions
# This serves as a base for all AutoTrader scripts
#

# Determine the project root directory based on script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Exit on error by default
set -e

# Variables to track environment state
ENV_RUNNING=false
ENV_STARTED_BY_SCRIPT=false
API_READY=false

#
# Utility functions
#

# Print a colored message
print_message() {
  local color=$1
  local message=$2
  echo -e "${color}${message}${NC}"
}

# Print a section header
print_header() {
  local title=$1
  echo -e "\n${BLUE}============================"
  echo -e "$title"
  echo -e "============================${NC}"
}

# Print success message
print_success() {
  print_message "$GREEN" "✓ $1"
}

# Print error message
print_error() {
  print_message "$RED" "✗ $1"
}

# Print warning message
print_warning() {
  print_message "$YELLOW" "! $1"
}

# Print info message
print_info() {
  print_message "$BLUE" "ℹ $1"
}

# Check if a command exists
command_exists() {
  command -v "$1" &> /dev/null
}

# Check if a service is running on a specific port
service_running() {
  local host=$1
  local port=$2
  nc -z "$host" "$port" &> /dev/null
}

# Check if the API is running
check_api_running() {
  local host=${1:-localhost}
  local port=${2:-8080}
  
  print_info "Checking if API is running on $host:$port..."
  
  # Use curl to check if the API is running
  if curl -s "http://$host:$port/actuator/health" &>/dev/null; then
    print_success "API is running on $host:$port"
    API_READY=true
    return 0
  else
    print_warning "API is not running on $host:$port"
    API_READY=false
    return 1
  fi
}

# Check if the development environment is running
check_env_running() {
  print_info "Checking if development environment is running..."
  
  # Check if Docker is running
  if ! command_exists docker || ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker."
    ENV_RUNNING=false
    return 1
  fi
  
  # Check if development containers are running
  if docker ps | grep -q "autotrader"; then
    print_success "Development environment is running"
    ENV_RUNNING=true
    return 0
  else
    print_warning "Development environment is not running"
    ENV_RUNNING=false
    return 1
  fi
}

# Start the development environment
start_dev_env() {
  print_info "Starting development environment..."
  
  if ! check_env_running; then
    cd "$PROJECT_ROOT"
    ./dev-env.sh start
    ENV_STARTED_BY_SCRIPT=true
    
    # Wait for environment to be fully up
    print_info "Waiting for environment to be ready..."
    sleep 10
    
    if check_env_running; then
      print_success "Development environment started successfully"
      return 0
    else
      print_error "Failed to start development environment"
      return 1
    fi
  else
    print_info "Development environment already running"
    return 0
  fi
}

# Stop the development environment if we started it
cleanup() {
  print_info "Cleaning up..."
  
  # Only stop the environment if we started it
  if [ "$ENV_STARTED_BY_SCRIPT" = true ]; then
    print_info "Stopping development environment..."
    cd "$PROJECT_ROOT"
    ./dev-env.sh stop
    print_success "Development environment stopped"
  else
    print_info "Leaving environment running as it was started externally"
  fi
}

# Set up cleanup on script exit
trap cleanup EXIT

#
# Main script logic
#

# Template usage function
show_usage() {
  echo "Usage: $(basename "$0") [--start-env] [--force]"
  echo "  --start-env  Start the development environment if not running"
  echo "  --force      Continue even if environment checks fail"
  echo "  --help       Show this help message"
}

# Template main function
main() {
  print_header "Script Template"
  
  # Check API
  check_api_running
  
  # Environment checks are done by the template, individual scripts should implement their own main function
  print_info "This template script has been initialized correctly"
  print_info "API Ready: $API_READY"
  print_info "Env Running: $ENV_RUNNING"
  return 0
}

# Parse command line arguments
START_ENV=false
FORCE=false

for arg in "$@"; do
  case $arg in
    --start-env)
      START_ENV=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --help)
      show_usage
      exit 0
      ;;
    *)
      # Unknown option, handled by individual scripts
      ;;
  esac
done

# Only run main if the script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
