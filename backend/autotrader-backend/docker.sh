#!/bin/bash

# Docker build and run script for Caryo Marketplace backend
# This script helps with building and running the backend Docker container

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose is not available. Please make sure you have Docker with Compose V2 installed.${NC}"
    exit 1
fi

# Function to print usage
print_usage() {
    echo -e "${YELLOW}Usage:${NC} $0 [build|run|start|stop|logs|restart|status|clean]"
    echo ""
    echo "Commands:"
    echo "  build     Build the Docker image"
    echo "  run       Build and start all services"
    echo "  start     Start all services (without rebuilding)"
    echo "  stop      Stop all services"
    echo "  logs      Show logs from the backend service"
    echo "  restart   Restart the backend service"
    echo "  status    Show status of all services"
    echo "  clean     Remove all containers, volumes, and images related to this project"
    echo ""
}

# Function to build Docker image
build_image() {
    echo -e "${GREEN}Building Docker image...${NC}"
    docker build -t caryo-backend .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Docker image built successfully!${NC}"
    else
        echo -e "${RED}Failed to build Docker image.${NC}"
        exit 1
    fi
}

# Function to start all services
start_services() {
    echo -e "${GREEN}Starting all services...${NC}"
    docker compose up -d
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}All services started successfully!${NC}"
        echo -e "${GREEN}Backend API is available at http://localhost:8080${NC}"
        echo -e "${GREEN}API documentation is available at http://localhost:8080/swagger-ui/index.html${NC}"
        echo -e "${GREEN}MinIO console is available at http://localhost:9001${NC}"
        echo -e "${GREEN}Use 'minioadmin' for both username and password to access MinIO${NC}"
    else
        echo -e "${RED}Failed to start services.${NC}"
        exit 1
    fi
}

# Function to show logs
show_logs() {
    echo -e "${GREEN}Showing logs from backend service...${NC}"
    docker compose logs -f backend
}

# Function to show status
show_status() {
    echo -e "${GREEN}Service status:${NC}"
    docker compose ps
}

# Function to clean up resources
clean_resources() {
    echo -e "${YELLOW}Warning: This will remove all containers, volumes, and images related to this project.${NC}"
    read -p "Are you sure you want to continue? (y/N): " confirm
    
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        echo -e "${GREEN}Stopping and removing all services...${NC}"
        docker compose down --volumes --remove-orphans
        echo -e "${GREEN}Removing Docker images...${NC}"
        docker rmi caryo-backend
        echo -e "${GREEN}Cleanup completed successfully!${NC}"
    else
        echo -e "${YELLOW}Cleanup cancelled.${NC}"
    fi
}

# Main script logic
case "$1" in
    build)
        build_image
        ;;
    run)
        build_image
        start_services
        ;;
    start)
        start_services
        ;;
    stop)
        echo -e "${GREEN}Stopping all services...${NC}"
        docker compose down
        ;;
    logs)
        show_logs
        ;;
    restart)
        echo -e "${GREEN}Restarting backend service...${NC}"
        docker compose restart backend
        ;;
    status)
        show_status
        ;;
    clean)
        clean_resources
        ;;
    *)
        print_usage
        exit 1
        ;;
esac

exit 0
