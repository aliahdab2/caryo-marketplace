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
  echo -e "  ${GREEN}./autotrader.sh dev start${NC}                      - Start dev environment"
  echo -e "  ${GREEN}./autotrader.sh dev start --rebuild${NC}            - Rebuild and start dev environment" 
  echo -e "  ${GREEN}./autotrader.sh dev start --rebuild --skip-tests${NC} - Rebuild without tests and start dev environment"
  echo -e "  ${GREEN}./autotrader.sh dev rebuild${NC}                    - Rebuild dev environment (existing command)"
  echo -e "  ${GREEN}./autotrader.sh dev rebuild-notest${NC}             - Rebuild dev environment without tests"
  echo -e "  ${GREEN}./autotrader.sh dev stop${NC}                       - Stop dev environment"
  echo -e "  ${GREEN}./autotrader.sh api start${NC}                      - Start API server"
  echo -e "  ${GREEN}./autotrader.sh test all${NC}                       - Run all tests"
  echo -e "  ${GREEN}./autotrader.sh test auth${NC}             - Run auth tests"
  echo -e "  ${GREEN}./autotrader.sh test endpoints${NC}        - Test API endpoints"
  echo -e "  ${GREEN}./autotrader.sh docs generate${NC}         - Generate API docs"
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
  # Process special flags for start command
  local rebuild=false
  local skipTests=false
  local command=""
  local args=()
  
  # Parse all arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      start|stop|restart|status|logs|rebuild|rebuild-notest)
        command="$1"
        shift
        ;;
      --rebuild)
        rebuild=true
        shift
        ;;
      --skip-tests)
        skipTests=true
        shift
        ;;
      *)
        # Pass other arguments through
        args+=("$1")
        shift
        ;;
    esac
  done
  
  # Run the appropriate command
  case "$command" in
    # Special handling for start with rebuild flag
    start)
      if [[ "$rebuild" == true ]]; then
        if [[ "$skipTests" == true ]]; then
          print_header "Rebuilding (Skipping Tests) and Starting Development Environment"
          ensure_executable "$PROJECT_ROOT/.devenv/dev-env.sh"
          "$PROJECT_ROOT/.devenv/dev-env.sh" rebuild-notest
        else
          print_header "Rebuilding and Starting Development Environment"
          ensure_executable "$PROJECT_ROOT/.devenv/dev-env.sh"
          "$PROJECT_ROOT/.devenv/dev-env.sh" rebuild
        fi
      else
        ensure_executable "$PROJECT_ROOT/.devenv/dev-env.sh"
        "$PROJECT_ROOT/.devenv/dev-env.sh" start "${args[@]}"
      fi
      ;;
    # Direct mapping to existing commands
    rebuild)
      print_header "Rebuilding Development Environment"
      ensure_executable "$PROJECT_ROOT/.devenv/dev-env.sh"
      "$PROJECT_ROOT/.devenv/dev-env.sh" rebuild "${args[@]}"
      ;;
    rebuild-notest)
      print_header "Rebuilding Development Environment (Skipping Tests)"
      ensure_executable "$PROJECT_ROOT/.devenv/dev-env.sh"
      "$PROJECT_ROOT/.devenv/dev-env.sh" rebuild-notest "${args[@]}"
      ;;
    stop)
      ensure_executable "$PROJECT_ROOT/.devenv/dev-env.sh"
      "$PROJECT_ROOT/.devenv/dev-env.sh" stop "${args[@]}"
      ;;
    restart)
      ensure_executable "$PROJECT_ROOT/.devenv/dev-env.sh"
      "$PROJECT_ROOT/.devenv/dev-env.sh" restart "${args[@]}"
      ;;
    status)
      ensure_executable "$PROJECT_ROOT/.devenv/dev-env.sh"
      "$PROJECT_ROOT/.devenv/dev-env.sh" status "${args[@]}"
      ;;
    logs)
      ensure_executable "$PROJECT_ROOT/.devenv/dev-env.sh"
      "$PROJECT_ROOT/.devenv/dev-env.sh" logs "${args[@]}"
      ;;
    health) # New case for health check
      print_header "Checking Development Environment Health"
      ensure_executable "$PROJECT_ROOT/.devenv/dev-env.sh"
      "$PROJECT_ROOT/.devenv/dev-env.sh" health "${args[@]}"
      ;;
    *)
      echo -e "${RED}Unknown dev command: $command${NC}"
      echo -e "Available dev commands: start, stop, restart, status, logs, rebuild, rebuild-notest, health"
      echo -e "Available flags for 'start': --rebuild (performs clean build before starting), --skip-tests (skip tests when rebuilding)"
      exit 1
      ;;
  esac
}

# API server command
handle_api_command() {
  # Process special flags first
  local rebuild=false
  local args=()
  
  while [[ $# -gt 0 ]]; do
    case "$1" in
      start)
        args+=("start")
        shift
        ;;
      --rebuild)
        rebuild=true
        shift
        ;;
      *)
        # Pass other arguments through
        args+=("$1")
        shift
        ;;
    esac
  done
  
  # Handle commands
  if [[ "${#args[@]}" -eq 0 || "${args[0]}" == "start" ]]; then
    ensure_executable "$PROJECT_ROOT/scripts/dev/start-dev.sh"
    
    if [[ "$rebuild" == true ]]; then
      print_header "Rebuilding and Starting API"
      echo -e "${CYAN}Performing full rebuild before starting...${NC}"
      cd "$PROJECT_ROOT" && ./gradlew clean build && "$PROJECT_ROOT/scripts/dev/start-dev.sh" "${args[@]}"
    else
      cd "$PROJECT_ROOT" && "$PROJECT_ROOT/scripts/dev/start-dev.sh" "${args[@]}"
    fi
  else
    echo -e "${RED}Unknown api command: ${args[0]}${NC}"
    echo -e "Available api commands: start"
    echo -e "Available flags: --rebuild (performs clean build before starting)"
    exit 1
  fi
}

# Test command
handle_test_command() {
  echo -e "${YELLOW}Warning: Test runner scripts have been removed.${NC}"
  echo -e "${YELLOW}Test commands are currently unavailable.${NC}"
  echo -e "${YELLOW}Please contact the development team for assistance with running tests.${NC}"
  
  # Future implementation will go here when tests are properly set up
  # For now, just exit with an error code
  exit 1
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
