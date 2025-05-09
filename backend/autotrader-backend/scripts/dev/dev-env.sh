#!/bin/bash
#
# Development Environment Management Script
# 
# This script is a wrapper around the .devenv/dev-env.sh script with added
# features for better error handling and environment checks.
#
# Usage: ./dev-env.sh [COMMAND]
# Commands:
#   start     - Start the development environment
#   stop      - Stop the development environment
#   restart   - Restart the development environment
#   status    - Check the status of containers
#   logs      - Follow the logs from all containers
#   test      - Run tests in the development environment
#   endpoints - Show all API endpoints
#   health    - Run a quick health check of all services
#   help      - Show this help message
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

# Function to handle errors
error_exit() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

# Help function
show_help() {
    echo "Usage: ./dev-env.sh [COMMAND]"
    echo "Commands:"
    echo "  start     - Start the development environment"
    echo "  stop      - Stop the development environment"
    echo "  restart   - Restart the development environment"
    echo "  status    - Check the status of containers"
    echo "  logs      - Follow the logs from all containers"
    echo "  test      - Run tests in the development environment"
    echo "  endpoints - Show all API endpoints"
    echo "  health    - Run a quick health check of all services"
    echo "  help      - Show this help message"
    exit 0
}

# Check if Docker is running
check_docker() {
    echo -e "${BLUE}Checking if Docker is running...${NC}"
    if ! command -v docker &> /dev/null; then
        error_exit "Docker is not installed. Please install Docker to continue."
    fi
    
    if ! docker info &>/dev/null; then
        error_exit "Docker is not running. Please start Docker to continue."
    fi
    
    echo -e "${GREEN}Docker is running.${NC}"
}

# Check environment health
check_health() {
    echo -e "${BLUE}Running health checks...${NC}"
    
    # Check if all required containers are running
    if ! docker ps | grep -q "autotrader-db"; then
        echo -e "${RED}⚠️ Database container is not running${NC}"
        db_status="DOWN"
    else
        echo -e "${GREEN}✓ Database container is running${NC}"
        db_status="UP"
    fi
    
    # Check API service
    if ! curl -s http://localhost:8080/actuator/health &>/dev/null; then
        echo -e "${RED}⚠️ API service is not responding${NC}"
        api_status="DOWN"
    else
        echo -e "${GREEN}✓ API service is responding${NC}"
        api_status="UP"
    fi
    
    # Print summary
    echo -e "\n${BLUE}Environment Status:${NC}"
    echo -e "Database: ${db_status}"
    echo -e "API:      ${api_status}"
    
    # Return status
    if [[ "$db_status" == "UP" && "$api_status" == "UP" ]]; then
        return 0
    else
        return 1
    fi
}

# Main command processor
main() {
    # The project root should be two levels up from the script dir (scripts/dev → project root)
    local DEV_ENV_SCRIPT="$(cd "$PROJECT_ROOT/.." && pwd)/.devenv/dev-env.sh"
    
    # Check if the dev-env.sh script exists in the .devenv directory
    if [ ! -f "$DEV_ENV_SCRIPT" ]; then
        # If not found, use the one in the root directory
        DEV_ENV_SCRIPT="$(cd "$PROJECT_ROOT/.." && pwd)/dev-env.sh"
    fi
    
    # Check if we found the script
    if [ ! -f "$DEV_ENV_SCRIPT" ]; then
        error_exit "Could not find dev-env.sh script"
    fi
    
    case "$1" in
        start)
            check_docker
            echo -e "${BLUE}Starting development environment...${NC}"
            "$DEV_ENV_SCRIPT" start || error_exit "Failed to start environment"
            echo -e "${GREEN}Development environment started successfully.${NC}"
            check_health
            ;;
        stop)
            echo -e "${BLUE}Stopping development environment...${NC}"
            "$DEV_ENV_SCRIPT" stop || error_exit "Failed to stop environment"
            echo -e "${GREEN}Development environment stopped successfully.${NC}"
            ;;
        restart)
            check_docker
            echo -e "${BLUE}Restarting development environment...${NC}"
            "$DEV_ENV_SCRIPT" restart || error_exit "Failed to restart environment"
            echo -e "${GREEN}Development environment restarted successfully.${NC}"
            check_health
            ;;
        status)
            check_docker
            echo -e "${BLUE}Checking container status...${NC}"
            "$DEV_ENV_SCRIPT" status || error_exit "Failed to get status"
            ;;
        logs)
            echo -e "${BLUE}Following container logs...${NC}"
            echo -e "${YELLOW}Press Ctrl+C to stop watching logs${NC}"
            "$DEV_ENV_SCRIPT" logs || error_exit "Failed to get logs"
            ;;
        test)
            check_docker
            echo -e "${BLUE}Running tests...${NC}"
            "$DEV_ENV_SCRIPT" test || error_exit "Tests failed"
            ;;
        endpoints)
            check_docker
            echo -e "${BLUE}Getting API endpoints...${NC}"
            "$DEV_ENV_SCRIPT" endpoints || error_exit "Failed to get endpoints"
            ;;
        health)
            check_docker
            check_health
            ;;
        help)
            show_help
            ;;
        *)
            echo -e "${RED}Unknown command: $1${NC}"
            show_help
            ;;
    esac
}

# Execute the command
if [ "$#" -eq 0 ]; then
    show_help
else
    main "$@"
fi
