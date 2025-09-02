#!/bin/bash

# Enhanced Production deployment script for Caryo Marketplace backend
# This script provides comprehensive deployment management with dev-like features

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
cd "${PROJECT_ROOT}"

# Docker Compose project name
export COMPOSE_PROJECT_NAME="caryo_prod"

# Default environment file
ENV_FILE="${PROJECT_ROOT}/.env"

# Error handling
error_exit() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

# Print a header
print_header() {
    echo -e "\n${BLUE}=================================="
    echo -e "Caryo Production Deployment - $1"
    echo -e "==================================${NC}\n"
}

# Print available commands
print_help() {
    echo -e "${CYAN}Usage:${NC} ./deploy-enhanced.sh [command] [options]"
    echo
    echo -e "${CYAN}Available commands:${NC}"
    echo -e "  ${GREEN}deploy${NC}       - Full deployment (build + start)"
    echo -e "  ${GREEN}start${NC}        - Start services (no rebuild)"
    echo -e "  ${GREEN}stop${NC}         - Stop all services"
    echo -e "  ${GREEN}restart${NC}      - Restart all services"
    echo -e "  ${GREEN}status${NC}       - Show service status"
    echo -e "  ${GREEN}health${NC}       - Check service health"
    echo -e "  ${GREEN}logs${NC}         - Show logs (use --follow for live logs)"
    echo -e "  ${GREEN}backup${NC}       - Create database and file backups"
    echo -e "  ${GREEN}restore${NC}      - Restore from backups"
    echo -e "  ${GREEN}update${NC}       - Update and redeploy"
    echo -e "  ${GREEN}clean${NC}        - Clean up containers and volumes"
    echo -e "  ${GREEN}shell${NC}        - Open shell in backend container"
    echo -e "  ${GREEN}db-shell${NC}     - Open database shell"
    echo -e "  ${GREEN}endpoints${NC}    - List API endpoints"
    echo -e "  ${GREEN}help${NC}         - Show this help message"
    echo
    echo -e "${CYAN}Options:${NC}"
    echo -e "  ${GREEN}--follow${NC}     - Follow logs in real-time (for logs command)"
    echo -e "  ${GREEN}--rebuild${NC}    - Force rebuild Docker images"
    echo -e "  ${GREEN}--no-cache${NC}   - Build without Docker cache"
    echo
    echo -e "${CYAN}Examples:${NC}"
    echo -e "  ${GREEN}./deploy-enhanced.sh deploy${NC}                - Full deployment"
    echo -e "  ${GREEN}./deploy-enhanced.sh deploy --rebuild${NC}      - Deploy with rebuild"
    echo -e "  ${GREEN}./deploy-enhanced.sh logs --follow${NC}         - Follow logs"
    echo -e "  ${GREEN}./deploy-enhanced.sh health${NC}                - Check all services"
    echo
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        error_exit "Docker is not running. Please start Docker and try again."
    fi
}

# Check if .env file exists, create from template if not
check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "${ENV_FILE}.template" ]; then
            echo -e "${YELLOW}No .env file found. Creating from template...${NC}"
            cp "${ENV_FILE}.template" "$ENV_FILE"
            echo -e "${YELLOW}Please edit .env file with your production values!${NC}"
            exit 1
        else
            echo -e "${YELLOW}Creating default .env file...${NC}"
            cat > "$ENV_FILE" <<'EOF'
# Database Configuration
DB_USER=autotrader
DB_PASSWORD=change_me_in_production
DB_NAME=autotrader

# MinIO Configuration
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=change_me_in_production
S3_BUCKET_NAME=caryo-assets
S3_REGION=us-east-1

# Application Configuration
JWT_SECRET=change_me_to_long_random_string
SERVER_PORT=8080

# Java Configuration
JAVA_OPTS=-Xms512m -Xmx1g -XX:+UseG1GC -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/app/logs
EOF
            echo -e "${RED}Created default .env file. Please edit it with your production values before deploying!${NC}"
            exit 1
        fi
    fi
}

# Load environment variables
load_env() {
    if [ -f "$ENV_FILE" ]; then
        echo -e "${YELLOW}Loading environment variables...${NC}"
        source "$ENV_FILE"
    fi
}

# Wait for service to be ready
wait_for_service() {
    local service_name="$1"
    local url="$2"
    local max_attempts="${3:-60}"
    local attempt=0
    
    echo -e "${YELLOW}Waiting for ${service_name}...${NC}"
    while [ $attempt -lt $max_attempts ]; do
        if curl -s --max-time 2 "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}${service_name} is ready${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}${service_name} failed to start within ${max_attempts}s${NC}"
    return 1
}

# Deploy the application
deploy_app() {
    local rebuild=false
    local no_cache=""
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --rebuild)
                rebuild=true
                shift
                ;;
            --no-cache)
                no_cache="--no-cache"
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    print_header "Deploying Application"
    
    # Build the Docker image
    if [ "$rebuild" = true ]; then
        echo -e "${YELLOW}Rebuilding Docker image...${NC}"
        docker build $no_cache -t caryo-backend . || error_exit "Failed to build Docker image"
    else
        echo -e "${YELLOW}Building Docker image...${NC}"
        docker build -t caryo-backend . || error_exit "Failed to build Docker image"
    fi
    
    # Start the services with production overrides
    echo -e "${YELLOW}Starting services...${NC}"
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d || error_exit "Failed to start services"
    
    # Wait for services to be ready
    echo -e "${YELLOW}Waiting for services to initialize...${NC}"
    
    # Wait for database
    wait_for_service "Database" "http://localhost:5432" 30 || true
    
    # Wait for MinIO
    wait_for_service "MinIO" "http://localhost:9000/minio/health/live" 30 || true
    
    # Wait for backend API
    wait_for_service "Backend API" "http://localhost:${SERVER_PORT:-8080}/actuator/health" 90
    
    echo -e "${GREEN}Application deployed successfully!${NC}"
    show_service_info
}

# Start services without rebuild
start_app() {
    print_header "Starting Services"
    echo -e "${YELLOW}Starting services...${NC}"
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d || error_exit "Failed to start services"
    
    # Wait for backend to be ready
    wait_for_service "Backend API" "http://localhost:${SERVER_PORT:-8080}/actuator/health" 60
    
    echo -e "${GREEN}Services started successfully!${NC}"
    show_service_info
}

# Stop services
stop_app() {
    print_header "Stopping Services"
    echo -e "${YELLOW}Stopping services...${NC}"
    docker compose -f docker-compose.yml -f docker-compose.prod.yml down || error_exit "Failed to stop services"
    echo -e "${GREEN}Services stopped successfully!${NC}"
}

# Restart services
restart_app() {
    print_header "Restarting Services"
    stop_app
    sleep 2
    start_app
}

# Show service status
show_status() {
    print_header "Service Status"
    docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
    echo
    health_check
}

# Health check for all services
health_check() {
    echo -e "${YELLOW}Checking service health...${NC}"
    local failed=0

    # Check backend API
    if curl -s --max-time 5 "http://localhost:${SERVER_PORT:-8080}/actuator/health" | grep -q "UP"; then
        echo -e "${GREEN}✓ Backend API is healthy${NC}"
    else
        echo -e "${RED}✗ Backend API is not healthy${NC}"
        failed=1
    fi

    # Check database connection via backend
    if curl -s --max-time 5 "http://localhost:${SERVER_PORT:-8080}/actuator/health" | grep -q "db"; then
        echo -e "${GREEN}✓ Database connection is healthy${NC}"
    else
        echo -e "${RED}✗ Database connection issues${NC}"
        failed=1
    fi

    # Check MinIO
    if curl -s --max-time 5 "http://localhost:9000/minio/health/live" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ MinIO is healthy${NC}"
    else
        echo -e "${RED}✗ MinIO is not healthy${NC}"
        failed=1
    fi

    # Check Nginx
    if curl -s --max-time 5 "http://localhost:80/" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Nginx is healthy${NC}"
    else
        echo -e "${RED}✗ Nginx is not healthy${NC}"
        failed=1
    fi

    # Check Email Service
    if curl -s --max-time 5 "http://localhost:${SERVER_PORT:-8080}/api/debug/email/health" | grep -q '"healthy":true'; then
        echo -e "${GREEN}✓ Email service is healthy${NC}"
    else
        echo -e "${RED}✗ Email service is not healthy${NC}"
        failed=1
    fi

    if [ $failed -eq 0 ]; then
        echo -e "\n${GREEN}All services are healthy!${NC}"
        return 0
    else
        echo -e "\n${RED}Some services are not healthy. Check logs for details.${NC}"
        return 1
    fi
}

# Show logs
show_logs() {
    local follow=false
    local service=""
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --follow|-f)
                follow=true
                shift
                ;;
            backend|nginx|db|minio)
                service="$1"
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    if [ "$follow" = true ]; then
        if [ -n "$service" ]; then
            echo -e "${YELLOW}Following logs for ${service}...${NC}"
            docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f "$service"
        else
            echo -e "${YELLOW}Following all logs...${NC}"
            docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
        fi
    else
        if [ -n "$service" ]; then
            echo -e "${YELLOW}Showing recent logs for ${service}...${NC}"
            docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail 100 "$service"
        else
            echo -e "${YELLOW}Showing recent logs...${NC}"
            docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail 50
        fi
    fi
}

# Create backups
backup_data() {
    local backup_dir="./backups/$(date +%Y-%m-%d_%H-%M-%S)"
    mkdir -p "$backup_dir"
    
    print_header "Creating Backups"
    
    echo -e "${YELLOW}Creating database backup...${NC}"
    if docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db pg_dump -U "${DB_USER:-autotrader}" -d "${DB_NAME:-autotrader}" > "$backup_dir/database.sql"; then
        echo -e "${GREEN}Database backup created: $backup_dir/database.sql${NC}"
    else
        echo -e "${RED}Database backup failed${NC}"
    fi
    
    echo -e "${YELLOW}Creating uploads backup...${NC}"
    if [ -d "./uploads" ]; then
        tar -czf "$backup_dir/uploads.tar.gz" -C . uploads
        echo -e "${GREEN}Uploads backup created: $backup_dir/uploads.tar.gz${NC}"
    else
        echo -e "${YELLOW}No uploads directory found${NC}"
    fi
    
    echo -e "${YELLOW}Creating logs backup...${NC}"
    if [ -d "./logs" ]; then
        tar -czf "$backup_dir/logs.tar.gz" -C . logs
        echo -e "${GREEN}Logs backup created: $backup_dir/logs.tar.gz${NC}"
    else
        echo -e "${YELLOW}No logs directory found${NC}"
    fi
    
    echo -e "${GREEN}Backup completed: $backup_dir${NC}"
}

# Restore from backups
restore_data() {
    echo -e "${YELLOW}Available backups:${NC}"
    if [ -d "./backups" ]; then
        ls -1 ./backups/
    else
        echo -e "${RED}No backups directory found${NC}"
        exit 1
    fi
    
    read -p "Enter backup directory name: " backup_name
    local backup_dir="./backups/$backup_name"
    
    if [ ! -d "$backup_dir" ]; then
        error_exit "Backup directory not found: $backup_dir"
    fi
    
    echo -e "${RED}WARNING: This will overwrite current data. Are you sure? (y/N)${NC}"
    read -p "" confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Restore cancelled.${NC}"
        exit 0
    fi
    
    print_header "Restoring Data"
    
    if [ -f "$backup_dir/database.sql" ]; then
        echo -e "${YELLOW}Restoring database...${NC}"
        cat "$backup_dir/database.sql" | docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db psql -U "${DB_USER:-autotrader}" -d "${DB_NAME:-autotrader}"
        echo -e "${GREEN}Database restored${NC}"
    fi
    
    if [ -f "$backup_dir/uploads.tar.gz" ]; then
        echo -e "${YELLOW}Restoring uploads...${NC}"
        tar -xzf "$backup_dir/uploads.tar.gz"
        echo -e "${GREEN}Uploads restored${NC}"
    fi
    
    echo -e "${GREEN}Restore completed${NC}"
}

# Update and redeploy
update_app() {
    print_header "Updating Application"
    
    echo -e "${YELLOW}Pulling latest changes...${NC}"
    git pull || echo -e "${YELLOW}Git pull failed or not in a git repository${NC}"
    
    echo -e "${YELLOW}Creating backup before update...${NC}"
    backup_data
    
    echo -e "${YELLOW}Redeploying with rebuild...${NC}"
    deploy_app --rebuild
}

# Clean up containers and volumes
clean_app() {
    print_header "Cleaning Up"
    
    echo -e "${RED}WARNING: This will remove all containers, volumes, and data. Are you sure? (y/N)${NC}"
    read -p "" confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Clean cancelled.${NC}"
        exit 0
    fi
    
    echo -e "${YELLOW}Stopping and removing containers...${NC}"
    docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v --remove-orphans
    
    echo -e "${YELLOW}Removing Docker images...${NC}"
    docker rmi caryo-backend 2>/dev/null || true
    
    echo -e "${GREEN}Cleanup completed${NC}"
}

# Open shell in backend container
open_shell() {
    echo -e "${YELLOW}Opening shell in backend container...${NC}"
    docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend /bin/bash
}

# Open database shell
open_db_shell() {
    echo -e "${YELLOW}Opening database shell...${NC}"
    docker compose -f docker-compose.yml -f docker-compose.prod.yml exec db psql -U "${DB_USER:-autotrader}" -d "${DB_NAME:-autotrader}"
}

# List API endpoints
show_endpoints() {
    echo -e "${YELLOW}Fetching API endpoints...${NC}"
    if curl -s "http://localhost:${SERVER_PORT:-8080}/actuator/mappings" | command -v jq >/dev/null 2>&1; then
        curl -s "http://localhost:${SERVER_PORT:-8080}/actuator/mappings" | jq -r '.contexts[].mappings.dispatcherServlets.dispatcherServlet[].details.requestMappingConditions.patterns[]' | sort | uniq
    else
        curl -s "http://localhost:${SERVER_PORT:-8080}/actuator/mappings" | grep -o '"patterns":\[[^]]*\]' | sed 's/.*\["//;s/"\]//;s/","/\n/g' | grep -vE 'actuator|error|swagger|v3' | sort | uniq
    fi
}

# Show service information
show_service_info() {
    echo
    echo -e "${CYAN}Service Information:${NC}"
    echo -e "- Backend API:    ${GREEN}http://localhost:${SERVER_PORT:-8080}${NC}"
    echo -e "- Swagger UI:     ${GREEN}http://localhost:${SERVER_PORT:-8080}/swagger-ui/index.html${NC}"
    echo -e "- Health Check:   ${GREEN}http://localhost:${SERVER_PORT:-8080}/actuator/health${NC}"
    echo -e "- Mail Server:    ${GREEN}SMTP configured (check logs for details)${NC}"
    echo -e "- MinIO Console:  ${GREEN}http://localhost:9001${NC}"
    echo -e "- Nginx (HTTP):   ${GREEN}http://localhost:80${NC}"
    echo -e "- Nginx (HTTPS):  ${GREEN}https://localhost:443${NC}"
    echo
    echo -e "${YELLOW}Use './deploy-enhanced.sh health' to check service health${NC}"
    echo -e "${YELLOW}Use './deploy-enhanced.sh logs --follow' to monitor logs${NC}"
}

# Main function
main() {
    check_docker
    check_env_file
    load_env
    
    if [ "$#" -eq 0 ]; then
        print_header "Help"
        print_help
        exit 0
    fi
    
    local command="$1"
    shift
    
    case "$command" in
        deploy)
            deploy_app "$@"
            ;;
        start)
            start_app
            ;;
        stop)
            stop_app
            ;;
        restart)
            restart_app
            ;;
        status)
            show_status
            ;;
        health)
            health_check
            ;;
        logs)
            show_logs "$@"
            ;;
        backup)
            backup_data
            ;;
        restore)
            restore_data
            ;;
        update)
            update_app
            ;;
        clean)
            clean_app
            ;;
        shell)
            open_shell
            ;;
        db-shell)
            open_db_shell
            ;;
        endpoints)
            show_endpoints
            ;;
        help)
            print_header "Help"
            print_help
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
