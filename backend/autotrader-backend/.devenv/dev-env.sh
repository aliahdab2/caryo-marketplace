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
    [ -f .devenv/.env ] && echo -e "${YELLOW}Loading .env...${NC}" && source .devenv/.env
    [ -f .devenv/.env.local ] && echo -e "${YELLOW}Loading .env.local...${NC}" && source .devenv/.env.local

    echo -e "${YELLOW}Starting environment...${NC}"
    docker compose -f .devenv/docker-compose.dev.yml up -d || error_exit "Failed to start services"

    echo -e "${YELLOW}Waiting for services...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:${SERVER_PORT:-8080}/status > /dev/null; then break; fi
        echo -n "." && sleep 1
    done
    echo

    echo -e "${GREEN}Started!${NC}"
    echo -e "- API: ${GREEN}http://localhost:${SERVER_PORT:-8080}${NC}"
    echo -e "- Swagger: ${GREEN}http://localhost:${SERVER_PORT:-8080}/swagger-ui/index.html${NC}"
    echo -e "- MinIO: ${GREEN}http://localhost:${MINIO_CONSOLE_PORT:-9001}${NC} (${MINIO_ROOT_USER:-minioadmin}/${MINIO_ROOT_PASSWORD:-minioadmin})"
    echo -e "- Adminer: ${GREEN}http://localhost:8081${NC} (postgres/${DB_PASSWORD:-postgres})"
    echo -e "- Debug Port: ${GREEN}${JVM_DEBUG_PORT:-5005}${NC}"

    if [ "${REDIS_ENABLED:-true}" = "true" ] && docker-compose -f .devenv/docker-compose.dev.yml ps | grep -q redis; then
        echo -e "- Redis: ${GREEN}localhost:${REDIS_PORT:-6379}${NC}"
    fi
}

stop_dev_env() {
    echo -e "${YELLOW}Stopping environment...${NC}"
    docker-compose -f .devenv/docker-compose.dev.yml down || error_exit "Failed to stop services"
    echo -e "${GREEN}Stopped${NC}"
}

rebuild_dev_env() {
    echo -e "${YELLOW}Rebuilding (with tests)...${NC}"
    docker-compose -f .devenv/docker-compose.dev.yml down -v
    docker pull gradle:8.5-jdk21 postgres:15-alpine minio/minio minio/mc adminer
    ./gradlew clean build || error_exit "Gradle build failed"
    docker-compose -f .devenv/docker-compose.dev.yml up --build -d || error_exit "Failed to start services"
    start_dev_env
}

rebuild_dev_env_notest() {
    echo -e "${YELLOW}Rebuilding (without tests)...${NC}"
    docker-compose -f .devenv/docker-compose.dev.yml down -v
    docker pull gradle:8.5-jdk21 postgres:15-alpine minio/minio minio/mc adminer
    ./gradlew clean build -x test || error_exit "Gradle build failed"
    docker-compose -f .devenv/docker-compose.dev.yml up --build -d || error_exit "Failed to start services"
    start_dev_env
}

check_status() {
    docker-compose -f .devenv/docker-compose.dev.yml ps
}

show_logs() {
    docker-compose -f .devenv/docker-compose.dev.yml logs -f
}

run_tests() {
    docker-compose -f .devenv/docker-compose.dev.yml exec app gradle test || error_exit "Tests failed"
}

show_api_endpoints() {
    docker-compose -f .devenv/docker-compose.dev.yml exec app curl -s http://localhost:8080/actuator/mappings | \
    grep -o '"patterns":\[[^]]*\]' | sed 's/.*\["//;s/"\]//;s/","/\n/g' | grep -vE 'actuator|error|swagger|v3' | sort | while read ep; do
        echo -e "${GREEN}$ep${NC}"
    done
}

health_check() {
    echo -e "${YELLOW}Checking health...${NC}"

    curl -s http://localhost:${SERVER_PORT:-8080}/status >/dev/null && \
        echo -e "${GREEN}✓ Spring Boot API running${NC}" || \
        echo -e "${RED}✗ Spring Boot API not running${NC}"

    curl -s http://localhost:${MINIO_API_PORT:-9000}/minio/health/live >/dev/null && \
        echo -e "${GREEN}✓ MinIO running${NC}" || \
        echo -e "${RED}✗ MinIO not running${NC}"

    command -v pg_isready >/dev/null && pg_isready -h localhost -p 5432 >/dev/null && \
        echo -e "${GREEN}✓ PostgreSQL running${NC}" || \
        echo -e "${RED}✗ PostgreSQL not available${NC}"

    if [ "${REDIS_ENABLED:-true}" = "true" ]; then
        command -v redis-cli >/dev/null && redis-cli -h localhost -p ${REDIS_PORT:-6379} ping | grep -q PONG && \
            echo -e "${GREEN}✓ Redis running${NC}" || \
            echo -e "${RED}✗ Redis not available${NC}"
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
