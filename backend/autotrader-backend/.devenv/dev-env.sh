#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.." && pwd)"
cd "${PROJECT_ROOT}"

# Docker Compose project name
export COMPOSE_PROJECT_NAME="autotrader_dev"

error_exit() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

# Helper function to pull Docker images in parallel
pull_docker_images() {
    local images=(
        "gradle:8.5-jdk21"
        "postgres:15-alpine"
        "minio/minio"
        "minio/mc"
        "adminer"
    )
    
    # Detect platform for proper Docker image selection
    local platform=""
    if [[ "$(uname -m)" == "arm64" ]] || [[ "$(uname -m)" == "aarch64" ]]; then
        platform="--platform linux/arm64"
        echo -e "${YELLOW}Detected ARM64 architecture${NC}"
    else
        platform="--platform linux/amd64"
        echo -e "${YELLOW}Using AMD64 architecture${NC}"
    fi
    
    echo -e "${YELLOW}Pulling ${#images[@]} Docker images in parallel...${NC}"
    
    # Start all pulls in background with platform specification
    local pids=()
    for image in "${images[@]}"; do
        echo -e "  Pulling ${CYAN}${image}${NC}..."
        docker pull ${platform} "$image" > /dev/null 2>&1 &
        pids+=($!)
    done
    
    # Wait for all pulls to complete
    local failed=0
    for pid in "${pids[@]}"; do
        if ! wait "$pid"; then
            failed=1
        fi
    done
    
    if [ $failed -eq 1 ]; then
        echo -e "${RED}Some Docker image pulls failed${NC}"
        return 1
    fi
    
    echo -e "${GREEN}All Docker images pulled successfully${NC}"
}

# Helper function to run Gradle build in Docker container
run_gradle_build() {
    local gradle_args="$1"
    local gradle_image="gradle:8.5-jdk21"
    
    echo -e "${YELLOW}Running: gradle ${gradle_args}${NC}"
    
    # Detect platform for proper Docker image selection
    local platform=""
    if [[ "$(uname -m)" == "arm64" ]] || [[ "$(uname -m)" == "aarch64" ]]; then
        platform="--platform linux/arm64"
        echo -e "${YELLOW}Detected ARM64 architecture, using ARM64 Docker image${NC}"
    else
        platform="--platform linux/amd64"
        echo -e "${YELLOW}Using AMD64 Docker image${NC}"
    fi
    
    # Try Docker Gradle container first
    echo -e "${YELLOW}Attempting build with Docker Gradle container...${NC}"
    if docker run --rm \
        ${platform} \
        -v "${PROJECT_ROOT}:/app" \
        -w /app \
        -e GRADLE_USER_HOME=/tmp/.gradle \
        "${gradle_image}" \
        gradle ${gradle_args} 2>/dev/null; then
        echo -e "${GREEN}Gradle build completed successfully${NC}"
        return 0
    fi
    
    # Fallback to local Gradle wrapper if Docker fails
    echo -e "${YELLOW}Docker build failed, falling back to local Gradle wrapper...${NC}"
    
    # Check if gradlew exists and is executable
    if [ ! -f "./gradlew" ]; then
        error_exit "No gradlew found and Docker build failed"
    fi
    
    # Make gradlew executable if it isn't
    chmod +x ./gradlew
    
    # Try local Gradle wrapper
    if ./gradlew ${gradle_args}; then
        echo -e "${GREEN}Gradle build completed successfully with local wrapper${NC}"
        return 0
    else
        error_exit "Both Docker and local Gradle builds failed"
    fi
}

# Helper function to restore car images
restore_car_images() {
    local workspace_root="${PROJECT_ROOT}/../../"
    local post_rebuild_script="${workspace_root}/scripts/post_rebuild.sh"
    
    echo -e "${YELLOW}Restoring car images...${NC}"
    
    if [ -f "$post_rebuild_script" ]; then
        (
            cd "$workspace_root" || error_exit "Failed to change to workspace root"
            if ./scripts/post_rebuild.sh; then
                echo -e "${GREEN}Car images restored successfully${NC}"
            else
                echo -e "${YELLOW}Warning: Image restoration failed. You can run './scripts/post_rebuild.sh' manually.${NC}"
            fi
        )
    else
        echo -e "${YELLOW}Warning: post_rebuild.sh script not found at: ${post_rebuild_script}${NC}"
        echo -e "${YELLOW}Skipping car image restoration${NC}"
    fi
}

show_help() {
    echo "Usage: ./dev-env.sh [COMMAND]"
    echo "Commands:"
    echo "  start           - Start the development environment"
    echo "  stop            - Stop the development environment"
    echo "  restart         - Restart the development environment"
    echo "  rebuild         - Rebuild (with tests)"
    echo "  rebuild-notest  - Rebuild (skip tests)"
    echo "  status          - Show container status"
    echo "  logs            - Follow logs"
    echo "  test            - Run tests"
    echo "  endpoints       - List API endpoints"
    echo "  health          - Check service health"
    echo "  help            - Show help"
    exit 0
}

check_docker() {
    if ! docker info > /dev/null 2>&1; then
        error_exit "Docker is not running. Please start Docker and try again."
    fi
}

start_dev_env() {
    # Load environment variables
    [ -f .devenv/.env ] && echo -e "${YELLOW}Loading .env...${NC}" && source .devenv/.env
    [ -f .devenv/.env.local ] && echo -e "${YELLOW}Loading .env.local...${NC}" && source .devenv/.env.local

    echo -e "${YELLOW}Starting environment...${NC}"
    docker compose -f .devenv/docker-compose.dev.yml up -d || error_exit "Failed to start services"

    echo -e "${YELLOW}Waiting for services to be ready...${NC}"
    local max_attempts=90  # Increased timeout for bucket creation
    local attempt=0
    
    # First check if MinIO is ready
    echo -e "${YELLOW}Waiting for MinIO...${NC}"
    while [ $attempt -lt 30 ]; do
        if curl -s --max-time 2 "http://localhost:${MINIO_API_PORT:-9000}/minio/health/live" > /dev/null 2>&1; then
            echo -e "${GREEN}MinIO is ready${NC}"
            break
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    # Wait a bit more for bucket creation
    echo -e "${YELLOW}Waiting for bucket creation...${NC}"
    sleep 10
    
    # Then check if Spring Boot is ready
    echo -e "${YELLOW}Waiting for Spring Boot application...${NC}"
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -s --max-time 2 "http://localhost:${SERVER_PORT:-8080}/status" > /dev/null 2>&1; then
            break
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    echo

    if [ $attempt -eq $max_attempts ]; then
        echo -e "${RED}Warning: Services may not be fully ready after ${max_attempts}s${NC}"
        echo -e "${YELLOW}Check logs with: docker compose -f .devenv/docker-compose.dev.yml logs app${NC}"
    else
        echo -e "${GREEN}Services are ready!${NC}"
    fi

    echo -e "\n${GREEN}Development Environment Started Successfully!${NC}"
    echo -e "${CYAN}Available Services:${NC}"
    echo -e "- API Server:     ${GREEN}http://localhost:${SERVER_PORT:-8080}${NC}"
    echo -e "- Swagger UI:     ${GREEN}http://localhost:${SERVER_PORT:-8080}/swagger-ui/index.html${NC}"
    echo -e "- MinIO Console:  ${GREEN}http://localhost:${MINIO_CONSOLE_PORT:-9001}${NC} (${MINIO_ROOT_USER:-minioadmin}/${MINIO_ROOT_PASSWORD:-minioadmin})"
    echo -e "- Adminer:        ${GREEN}http://localhost:8081${NC} (postgres/${DB_PASSWORD:-postgres})"
    echo -e "- Debug Port:     ${GREEN}${JVM_DEBUG_PORT:-5005}${NC}"

    if [ "${REDIS_ENABLED:-true}" = "true" ] && docker compose -f .devenv/docker-compose.dev.yml ps | grep -q redis; then
        echo -e "- Redis:          ${GREEN}localhost:${REDIS_PORT:-6379}${NC}"
    fi
    
    echo -e "\n${YELLOW}Use './autotrader.sh dev health' to check service health${NC}"
}

stop_dev_env() {
    echo -e "${YELLOW}Stopping environment...${NC}"
    docker compose -f .devenv/docker-compose.dev.yml down || error_exit "Failed to stop services"
    echo -e "${GREEN}Stopped${NC}"
}

rebuild_dev_env() {
    echo -e "${YELLOW}Rebuilding (with tests)...${NC}"
    
    # Stop and clean up existing containers and volumes
    echo -e "${YELLOW}Stopping existing containers...${NC}"
    docker compose -f .devenv/docker-compose.dev.yml down -v
    
    # Pull required Docker images in parallel for faster execution
    echo -e "${YELLOW}Pulling Docker images...${NC}"
    pull_docker_images
    
    # Build the application using Docker Gradle container
    echo -e "${YELLOW}Building application...${NC}"
    run_gradle_build "clean build"
    
    # Start services
    echo -e "${YELLOW}Starting services...${NC}"
    docker compose -f .devenv/docker-compose.dev.yml up --build -d || error_exit "Failed to start services"
    
    # Wait for bucket creation and services to be ready
    echo -e "${YELLOW}Waiting for services to initialize...${NC}"
    sleep 15
    
    # Initialize development environment
    start_dev_env
    
    # Restore car images if script exists
    restore_car_images
}

rebuild_dev_env_notest() {
    echo -e "${YELLOW}Rebuilding (without tests)...${NC}"
    
    # Stop and clean up existing containers and volumes
    echo -e "${YELLOW}Stopping existing containers...${NC}"
    docker compose -f .devenv/docker-compose.dev.yml down -v
    
    # Pull required Docker images in parallel for faster execution
    echo -e "${YELLOW}Pulling Docker images...${NC}"
    pull_docker_images
    
    # Build the application using Docker Gradle container, skipping tests
    echo -e "${YELLOW}Building application (skipping tests)...${NC}"
    run_gradle_build "clean build -x test"
    
    # Start services
    echo -e "${YELLOW}Starting services...${NC}"
    docker compose -f .devenv/docker-compose.dev.yml up --build -d || error_exit "Failed to start services"
    
    # Wait for bucket creation and services to be ready
    echo -e "${YELLOW}Waiting for services to initialize...${NC}"
    sleep 15
    
    # Initialize development environment
    start_dev_env
    
    # Restore car images if script exists
    restore_car_images
}

check_status() {
    docker compose -f .devenv/docker-compose.dev.yml ps
}

show_logs() {
    docker compose -f .devenv/docker-compose.dev.yml logs -f
}

run_tests() {
    docker compose -f .devenv/docker-compose.dev.yml exec app gradle test || error_exit "Tests failed"
}

show_api_endpoints() {
    docker compose -f .devenv/docker-compose.dev.yml exec app curl -s http://localhost:8080/actuator/mappings | \
    grep -o '"patterns":\[[^]]*\]' | sed 's/.*\["//;s/"\]//;s/","/\n/g' | grep -vE 'actuator|error|swagger|v3' | sort | while read ep; do
        echo -e "${GREEN}$ep${NC}"
    done
}

health_check() {
    echo -e "${YELLOW}Checking health...${NC}"
    local failed=0

    # Check Spring Boot API
    if curl -s --max-time 5 "http://localhost:${SERVER_PORT:-8080}/status" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Spring Boot API running${NC}"
    else
        echo -e "${RED}✗ Spring Boot API not running${NC}"
        failed=1
    fi

    # Check MinIO
    if curl -s --max-time 5 "http://localhost:${MINIO_API_PORT:-9000}/minio/health/live" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ MinIO running${NC}"
    else
        echo -e "${RED}✗ MinIO not running${NC}"
        failed=1
    fi

    # Check PostgreSQL
    if docker compose -f .devenv/docker-compose.dev.yml exec -T postgres pg_isready -q 2>/dev/null; then
        echo -e "${GREEN}✓ PostgreSQL running${NC}"
    else
        echo -e "${RED}✗ PostgreSQL not available${NC}"
        failed=1
    fi

    # Check Redis (if enabled)
    if [ "${REDIS_ENABLED:-true}" = "true" ]; then
        if docker compose -f .devenv/docker-compose.dev.yml exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
            echo -e "${GREEN}✓ Redis running${NC}"
        else
            echo -e "${RED}✗ Redis not available${NC}"
            failed=1
        fi
    fi

    if [ $failed -eq 0 ]; then
        echo -e "\n${GREEN}All services are healthy${NC}"
        return 0
    else
        echo -e "\n${RED}Some services are not healthy${NC}"
        return 1
    fi
}

# Main
check_docker

case "$1" in
    start) start_dev_env ;;
    stop) stop_dev_env ;;
    restart) stop_dev_env && start_dev_env ;;
    rebuild) rebuild_dev_env ;;
    rebuild-notest) rebuild_dev_env_notest ;;
    status) check_status ;;
    logs) show_logs ;;
    test) run_tests ;;
    endpoints) show_api_endpoints ;;
    health) health_check ;;
    help) show_help ;;
    *) error_exit "Unknown command: $1. Use 'help' to see available commands." ;;
esac

exit 0
