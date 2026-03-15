#!/usr/bin/env zsh
#
# Enhanced wrapper for dev-env.sh with better health checking and error handling
#

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Find directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]:-$0}" )" && pwd )"
SCRIPT_PATH="$DIR/dev-env.sh"

# Check if original script exists
if [ ! -f "$SCRIPT_PATH" ]; then
    echo -e "${RED}Error: dev-env.sh not found at $SCRIPT_PATH${NC}"
    exit 1
fi

# Check if docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

# Function to verify app is fully ready by checking multiple endpoints
verify_app_ready() {
    local host="localhost"
    local port="${SERVER_PORT:-8080}"
    local retries=0
    local max_retries=10
    local delay=3
    local ready=0

    echo -e "${YELLOW}Verifying application health...${NC}"
    
    while [ $retries -lt $max_retries ] && [ $ready -eq 0 ]; do
        # Try to get status from multiple endpoints
        status_code=$(curl -s -o /dev/null -w "%{http_code}" http://$host:$port/status 2>/dev/null)
        service_status_code=$(curl -s -o /dev/null -w "%{http_code}" http://$host:$port/service-status 2>/dev/null)
        health_code=$(curl -s -o /dev/null -w "%{http_code}" http://$host:$port/health 2>/dev/null)
        actuator_code=$(curl -s -o /dev/null -w "%{http_code}" http://$host:$port/actuator/health 2>/dev/null)
        
        # Check responses - accept either status endpoint or the new service-status endpoint
        if [[ ("$status_code" == "200" || "$service_status_code" == "200") && ("$health_code" == "200" || "$actuator_code" == "200") ]]; then
            ready=1
        else
            echo -e "${YELLOW}Waiting for all health endpoints... (attempt $((retries+1))/${max_retries})${NC}"
            retries=$((retries+1))
            sleep $delay
        fi
    done
    
    if [ $ready -eq 1 ]; then
        echo -e "${GREEN}✓ Application is fully operational!${NC}"
        return 0
    else
        echo -e "${RED}✗ Application is not responding correctly to all health checks.${NC}"
        echo -e "${YELLOW}Status endpoint: $status_code, Service status: $service_status_code, Health endpoint: $health_code, Actuator health: $actuator_code${NC}"
        return 1
    fi
}

# Execute original script with provided arguments
"$SCRIPT_PATH" "$@"
RESULT=$?

# If we were starting the application and it succeeded, let's verify it's really ready
if [ "$1" = "start" ] && [ $RESULT -eq 0 ]; then
    echo -e "${BLUE}Running extended health verification...${NC}"
    verify_app_ready
    VERIFY_RESULT=$?
    
    if [ $VERIFY_RESULT -ne 0 ]; then
        echo -e "${YELLOW}TIP: Check application logs with: ./dev-env.sh logs${NC}"
    else
        echo -e "${GREEN}Development environment is HEALTHY and READY!${NC}"
        echo -e "${BLUE}Access your application at http://localhost:${SERVER_PORT:-8080}${NC}"
    fi
fi

exit $RESULT
