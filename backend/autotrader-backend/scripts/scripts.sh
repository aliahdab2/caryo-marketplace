#!/bin/bash
#
# Master Script for AutoTrader Backend
#
# This script provides a unified interface to all the scripts in the project
#
# Usage: ./scripts.sh [command] [options]
#

# Determine the project root directory based on script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR" && pwd)"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print a header
print_header() {
  echo -e "\n${BLUE}======================="
  echo -e "${1}"
  echo -e "=======================${NC}\n"
}

# Print available commands
print_commands() {
  echo -e "${CYAN}Available commands:${NC}"
  echo -e "  ${YELLOW}Development${NC}"
  echo -e "    ${GREEN}dev-env${NC}              - Start, stop, or restart the development environment"
  echo -e "    ${GREEN}start-dev${NC}            - Start the development server"
  echo -e ""
  echo -e "  ${YELLOW}Testing${NC}"
  echo -e "    ${GREEN}test-auth${NC}            - Test authentication endpoints"
  echo -e "    ${GREEN}test-endpoints${NC}       - Test API endpoints"
  echo -e "    ${GREEN}test-reference-data${NC}  - Test reference data endpoints"
  echo -e "    ${GREEN}prepare-test-assets${NC}  - Prepare test assets (images, PDFs, etc.)"
  echo -e ""
  echo -e "  ${YELLOW}Postman${NC}"
  echo -e "    ${GREEN}run-collections${NC}      - Run Postman collections"
  echo -e "    ${GREEN}run-tests-with-devenv${NC} - Run Postman tests with development environment"
  echo -e "    ${GREEN}generate-docs${NC}        - Generate API documentation from Postman collections"
  echo -e ""
  echo -e "  ${YELLOW}Help${NC}"
  echo -e "    ${GREEN}help${NC}                 - Show this help message"
  echo -e ""
}

# Function to ensure script is executable
ensure_executable() {
  if [ ! -x "$1" ]; then
    chmod +x "$1"
  fi
}

# Main function to process commands
main() {
  if [ "$#" -eq 0 ]; then
    print_header "AutoTrader Backend Scripts"
    print_commands
    exit 0
  fi
  
  local command="$1"
  shift
  
  case "$command" in
    # Development commands
    dev-env)
      ensure_executable "$PROJECT_ROOT/scripts/dev/dev-env.sh"
      "$PROJECT_ROOT/scripts/dev/dev-env.sh" "$@"
      ;;
    start-dev)
      ensure_executable "$PROJECT_ROOT/scripts/dev/start-dev.sh"
      "$PROJECT_ROOT/scripts/dev/start-dev.sh" "$@"
      ;;
      
    # Testing commands
    test-auth)
      ensure_executable "$PROJECT_ROOT/scripts/test/test-auth.sh"
      "$PROJECT_ROOT/scripts/test/test-auth.sh" "$@"
      ;;
    test-endpoints)
      ensure_executable "$PROJECT_ROOT/scripts/test/test-endpoints.sh"
      "$PROJECT_ROOT/scripts/test/test-endpoints.sh" "$@"
      ;;
    test-reference-data)
      ensure_executable "$PROJECT_ROOT/scripts/test/test-reference-data.sh"
      "$PROJECT_ROOT/scripts/test/test-reference-data.sh" "$@"
      ;;
    prepare-test-assets)
      ensure_executable "$PROJECT_ROOT/scripts/test/prepare-test-assets.sh"
      "$PROJECT_ROOT/scripts/test/prepare-test-assets.sh" "$@"
      ;;
      
    # Postman commands
    run-collections)
      ensure_executable "$PROJECT_ROOT/scripts/postman/run-collections.sh"
      "$PROJECT_ROOT/scripts/postman/run-collections.sh" "$@"
      ;;
    run-tests-with-devenv)
      ensure_executable "$PROJECT_ROOT/scripts/postman/run-postman-tests-with-devenv.sh"
      "$PROJECT_ROOT/scripts/postman/run-postman-tests-with-devenv.sh" "$@"
      ;;
    generate-docs)
      ensure_executable "$PROJECT_ROOT/scripts/postman/generate-docs.sh"
      "$PROJECT_ROOT/scripts/postman/generate-docs.sh" "$@"
      ;;
      
    # Help
    help)
      print_header "AutoTrader Backend Scripts"
      print_commands
      exit 0
      ;;
      
    # Unknown command
    *)
      echo -e "${RED}Error: Unknown command '$command'${NC}"
      print_commands
      exit 1
      ;;
  esac
}

# Execute main function
main "$@"
