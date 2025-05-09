#!/bin/bash
#
# AutoTrader CLI - Simplified command-line interface for AutoTrader Backend
# 
# This script provides a simplified interface for common development tasks
#
# Usage: ./autotrader.sh [command] [options]
#

# Determine the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Print a header
print_header() {
  echo -e "\n${BLUE}======================="
  echo -e "AutoTrader CLI - $1"
  echo -e "=======================${NC}\n"
}

# Print available commands
print_help() {
  echo -e "${CYAN}Usage:${NC} ./autotrader.sh [command] [options]"
  echo
  echo -e "${CYAN}Available commands:${NC}"
  echo -e "  ${GREEN}dev${NC}      - Manage the development environment"
  echo -e "  ${GREEN}api${NC}      - Start the API server"
  echo -e "  ${GREEN}test${NC}     - Run various tests"
  echo -e "  ${GREEN}docs${NC}     - Generate documentation"
  echo -e "  ${GREEN}help${NC}     - Show this help message"
  echo
  echo -e "${CYAN}Examples:${NC}"
  echo -e "  ${GREEN}./autotrader.sh dev start${NC}      - Start dev environment"
  echo -e "  ${GREEN}./autotrader.sh dev stop${NC}       - Stop dev environment"
  echo -e "  ${GREEN}./autotrader.sh api start${NC}      - Start API server"
  echo -e "  ${GREEN}./autotrader.sh test all${NC}       - Run all tests"
  echo -e "  ${GREEN}./autotrader.sh test auth${NC}      - Run auth tests"
  echo -e "  ${GREEN}./autotrader.sh test endpoints${NC} - Test API endpoints"
  echo -e "  ${GREEN}./autotrader.sh docs generate${NC}  - Generate API docs"
  echo
}

# Function to ensure script is executable
ensure_executable() {
  if [ ! -x "$1" ]; then
    chmod +x "$1"
  fi
}

# Development environment command
handle_dev_command() {
  case "$1" in
    start)
      ensure_executable "$PROJECT_ROOT/scripts/dev/dev-env.sh"
      "$PROJECT_ROOT/scripts/dev/dev-env.sh" start
      ;;
    stop)
      ensure_executable "$PROJECT_ROOT/scripts/dev/dev-env.sh"
      "$PROJECT_ROOT/scripts/dev/dev-env.sh" stop
      ;;
    restart)
      ensure_executable "$PROJECT_ROOT/scripts/dev/dev-env.sh"
      "$PROJECT_ROOT/scripts/dev/dev-env.sh" restart
      ;;
    status)
      ensure_executable "$PROJECT_ROOT/scripts/dev/dev-env.sh"
      "$PROJECT_ROOT/scripts/dev/dev-env.sh" status
      ;;
    logs)
      ensure_executable "$PROJECT_ROOT/scripts/dev/dev-env.sh"
      "$PROJECT_ROOT/scripts/dev/dev-env.sh" logs
      ;;
    *)
      echo -e "${RED}Unknown dev command: $1${NC}"
      echo -e "Available dev commands: start, stop, restart, status, logs"
      exit 1
      ;;
  esac
}

# API server command
handle_api_command() {
  case "$1" in
    start)
      ensure_executable "$PROJECT_ROOT/scripts/dev/start-dev.sh"
      "$PROJECT_ROOT/scripts/dev/start-dev.sh" "$@"
      ;;
    *)
      echo -e "${RED}Unknown api command: $1${NC}"
      echo -e "Available api commands: start"
      exit 1
      ;;
  esac
}

# Test command
handle_test_command() {
  case "$1" in
    all)
      # Prepare test assets first
      ensure_executable "$PROJECT_ROOT/scripts/test/prepare-test-assets.sh"
      "$PROJECT_ROOT/scripts/test/prepare-test-assets.sh"
      
      # Run Postman tests with development environment
      ensure_executable "$PROJECT_ROOT/scripts/postman/run-postman-tests-with-devenv.sh"
      "$PROJECT_ROOT/scripts/postman/run-postman-tests-with-devenv.sh"
      ;;
    auth)
      ensure_executable "$PROJECT_ROOT/scripts/test/test-auth.sh"
      "$PROJECT_ROOT/scripts/test/test-auth.sh" --start-env
      ;;
    endpoints)
      ensure_executable "$PROJECT_ROOT/scripts/test/test-endpoints.sh"
      "$PROJECT_ROOT/scripts/test/test-endpoints.sh" --start-env
      ;;
    reference-data|refdata)
      ensure_executable "$PROJECT_ROOT/scripts/test/test-reference-data.sh"
      "$PROJECT_ROOT/scripts/test/test-reference-data.sh" --start-env
      ;;
    postman)
      ensure_executable "$PROJECT_ROOT/scripts/postman/run-collections.sh"
      "$PROJECT_ROOT/scripts/postman/run-collections.sh" --all
      ;;
    *)
      echo -e "${RED}Unknown test command: $1${NC}"
      echo -e "Available test commands: all, auth, endpoints, reference-data, postman"
      exit 1
      ;;
  esac
}

# Documentation command
handle_docs_command() {
  case "$1" in
    generate)
      ensure_executable "$PROJECT_ROOT/scripts/postman/generate-docs.sh"
      "$PROJECT_ROOT/scripts/postman/generate-docs.sh"
      ;;
    *)
      echo -e "${RED}Unknown docs command: $1${NC}"
      echo -e "Available docs commands: generate"
      exit 1
      ;;
  esac
}

# Main function
main() {
  if [ "$#" -eq 0 ]; then
    print_header "Help"
    print_help
    exit 0
  fi
  
  local command="$1"
  shift
  
  case "$command" in
    dev)
      if [ "$#" -eq 0 ]; then
        echo -e "${RED}Missing dev command${NC}"
        echo -e "Available dev commands: start, stop, restart, status, logs"
        exit 1
      fi
      handle_dev_command "$@"
      ;;
    api)
      if [ "$#" -eq 0 ]; then
        echo -e "${RED}Missing api command${NC}"
        echo -e "Available api commands: start"
        exit 1
      fi
      handle_api_command "$@"
      ;;
    test)
      if [ "$#" -eq 0 ]; then
        echo -e "${RED}Missing test command${NC}"
        echo -e "Available test commands: all, auth, endpoints, reference-data, postman"
        exit 1
      fi
      handle_test_command "$@"
      ;;
    docs)
      if [ "$#" -eq 0 ]; then
        echo -e "${RED}Missing docs command${NC}"
        echo -e "Available docs commands: generate"
        exit 1
      fi
      handle_docs_command "$@"
      ;;
    help)
      print_header "Help"
      print_help
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown command: $command${NC}"
      print_help
      exit 1
      ;;
  esac
}

# Execute main function
main "$@"
