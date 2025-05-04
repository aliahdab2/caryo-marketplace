#!/bin/zsh

# This is a wrapper script that calls the actual dev-env.sh in the .devenv directory
# This allows users to continue using ./dev-env.sh from the project root

DIR="$( cd "$( dirname "${BASH_SOURCE[0]:-$0}" )" && pwd )"
exec $DIR/.devenv/dev-env.sh "$@"

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
    if ! docker info > /dev/null 2>&1; then
        error_exit "Docker is not running. Please start Docker and try again."
    fi
}

# Start the development environment
start_dev_env() {
    # Load environment variables
    if [ -f .env ]; then
        echo -e "${YELLOW}Loading environment from .env file...${NC}"
        source .env
    fi
    
    echo -e "${YELLOW}Starting development environment...${NC}"
    docker-compose -f docker-compose.dev.yml up -d || error_exit "Failed to start services"
    
    # Wait for app to be healthy
    echo -e "${YELLOW}Waiting for services to be ready...${NC}"
    max_retries=30
    retries=0
    while [ $retries -lt $max_retries ]; do
        if curl -s http://localhost:${SERVER_PORT:-8080}/status > /dev/null; then
            echo -e "\n${GREEN}✓ Backend service is healthy!${NC}"
            break
        fi
        echo -n "."
        retries=$((retries+1))
        sleep 2
        if [ $retries -eq $max_retries ]; then
            echo -e "\n${RED}✗ Backend service failed to start within the timeout period.${NC}"
            echo -e "${YELLOW}Checking logs for errors...${NC}"
            docker-compose -f docker-compose.dev.yml logs app --tail 50
            echo -e "${RED}Startup failed. Please check the logs above for errors.${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}Development environment started successfully!${NC}"
    echo -e "${YELLOW}Services available at:${NC}"
    echo -e "- Spring Boot App:  ${GREEN}http://localhost:${SERVER_PORT:-8080}${NC}"
    echo -e "- API Documentation: ${GREEN}http://localhost:${SERVER_PORT:-8080}/swagger-ui/index.html${NC}"
    echo -e "- MinIO Console:    ${GREEN}http://localhost:${MINIO_CONSOLE_PORT:-9001}${NC} (${MINIO_ROOT_USER:-minioadmin}/${MINIO_ROOT_PASSWORD:-minioadmin})"
    echo -e "- Adminer:          ${GREEN}http://localhost:8081${NC} (Server: postgres, User: ${DB_USER:-postgres}, Password: ${DB_PASSWORD:-postgres})"
    
    # Debugging info
    echo -e "- Debug Port:       ${GREEN}${JVM_DEBUG_PORT:-5005}${NC} (attach your IDE for debugging)"
    
    # Check if Redis is used
    if [ "${REDIS_ENABLED:-true}" = "true" ] && docker-compose -f docker-compose.dev.yml ps | grep -q redis; then
        echo -e "- Redis:            ${GREEN}localhost:${REDIS_PORT:-6379}${NC}"
    fi
    
    echo -e "\n${GREEN}--------------------------------------------${NC}"
    echo -e "${YELLOW}Environment ready for testing and development!${NC}"
    echo -e "${GREEN}--------------------------------------------${NC}"
}

# Stop the development environment
stop_dev_env() {
    echo -e "${YELLOW}Stopping development environment...${NC}"
    docker-compose -f docker-compose.dev.yml down || error_exit "Failed to stop services"
    echo -e "${GREEN}Development environment stopped${NC}"
}

# Check status of containers
check_status() {
    echo -e "${YELLOW}Development environment status:${NC}"
    docker-compose -f docker-compose.dev.yml ps
}

# Show logs from all containers
show_logs() {
    echo -e "${YELLOW}Following logs from all containers. Press Ctrl+C to exit.${NC}"
    docker-compose -f docker-compose.dev.yml logs -f
}

# Run tests in the dev environment
run_tests() {
    echo -e "${YELLOW}Running tests in development environment...${NC}"
    docker-compose -f docker-compose.dev.yml exec app gradle test || error_exit "Tests failed"
    echo -e "${GREEN}Tests completed successfully${NC}"
}

# Show all api endpoints from Spring Boot
show_api_endpoints() {
    echo -e "${YELLOW}Fetching API endpoints...${NC}"
    docker-compose -f docker-compose.dev.yml exec app curl -s http://localhost:8080/actuator/mappings | \
        grep -o '"patterns":\[[^]]*\]' | \
        sed 's/"patterns":\[//g' | \
        sed 's/\]//g' | \
        sed 's/","/\n/g' | \
        sed 's/"//g' | \
        sort | \
        grep -v '/actuator' | \
        grep -v '/error' | \
        grep -v '/swagger' | \
        grep -v '/v3/api-docs' | \
        while read endpoint; do
            echo -e "${GREEN}$endpoint${NC}"
        done
}

# Run a quick health check
health_check() {
    echo -e "${YELLOW}Running health check...${NC}"
    
    # Try multiple health endpoints
    if curl -s http://localhost:${SERVER_PORT:-8080}/status > /dev/null || curl -s http://localhost:${SERVER_PORT:-8080}/service-status > /dev/null; then
        echo -e "${GREEN}✓ Spring Boot API is running${NC}"
        
        # Get detailed health from Actuator
        health_response=$(curl -s http://localhost:${SERVER_PORT:-8080}/actuator/health)
        overall_status=$(echo $health_response | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        if [[ "$overall_status" == "UP" ]]; then
            echo -e "${GREEN}✓ App health status: ${overall_status}${NC}"
        else
            echo -e "${RED}✗ App health status: ${overall_status}${NC}"
            echo -e "${YELLOW}Health details: $(echo $health_response | tr -d '{}' | tr ',' '\n')${NC}"
        fi
    else
        echo -e "${RED}✗ Spring Boot API is not available${NC}"
    fi
    
    if curl -s http://localhost:${MINIO_API_PORT:-9000}/minio/health/live > /dev/null; then
        echo -e "${GREEN}✓ MinIO is running${NC}"
    else
        echo -e "${RED}✗ MinIO is not available${NC}"
    fi
    
    if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is running${NC}"
    else
        echo -e "${RED}✗ PostgreSQL is not available${NC}"
    fi
    
    if [ "${REDIS_ENABLED:-true}" = "true" ]; then
        if redis-cli -h localhost -p ${REDIS_PORT:-6379} ping > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Redis is running${NC}"
        else
            echo -e "${RED}✗ Redis is not available${NC}"
        fi
    fi
}

# Main script
check_docker

if [ $# -eq 0 ]; then
    show_help
fi

case "$1" in
    start)
        start_dev_env
        ;;
    stop)
        stop_dev_env
        ;;
    restart)
        stop_dev_env
        start_dev_env
        ;;
    status)
        check_status
        ;;
    logs)
        show_logs
        ;;
    test)
        run_tests
        ;;
    endpoints)
        show_api_endpoints
        ;;
    health)
        health_check
        ;;
    help)
        show_help
        ;;
    *)
        error_exit "Unknown command: $1. Use 'help' to see available commands."
        ;;
esac

exit 0
