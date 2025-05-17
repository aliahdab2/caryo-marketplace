#!/bin/bash

# Production deployment script for Caryo Marketplace backend
# This script helps deploy the application in production mode

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists, if not create from template
if [ ! -f .env ]; then
  if [ -f .env.template ]; then
    echo -e "${YELLOW}No .env file found. Creating from template...${NC}"
    cp .env.template .env
    echo -e "${YELLOW}Please edit .env file with your production values!${NC}"
    exit 1
  else
    echo -e "${RED}No .env or .env.template file found. Cannot continue.${NC}"
    exit 1
  fi
fi

# Function to print usage
print_usage() {
    echo -e "${YELLOW}Usage:${NC} $0 [deploy|start|stop|status|logs|backup|restore]"
    echo ""
    echo "Commands:"
    echo "  deploy    Build and deploy the application in production mode"
    echo "  start     Start the application in production mode (no rebuild)"
    echo "  stop      Stop the running application"
    echo "  status    Show status of all services"
    echo "  logs      Show logs from the backend service"
    echo "  backup    Create backups of database and MinIO data"
    echo "  restore   Restore from backups"
    echo ""
}

# Function to deploy the application
deploy_app() {
    echo -e "${GREEN}Building and deploying the application in production mode...${NC}"
    
    # Build the Docker image
    docker build -t caryo-backend .
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to build Docker image.${NC}"
        exit 1
    fi
    
    # Start the services with production overrides
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to start services.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Application deployed successfully!${NC}"
    echo -e "${GREEN}Backend API is running at http://localhost:8080${NC}"
}

# Function to start the application without rebuild
start_app() {
    echo -e "${GREEN}Starting the application in production mode...${NC}"
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Application started successfully!${NC}"
    else
        echo -e "${RED}Failed to start the application.${NC}"
        exit 1
    fi
}

# Function to stop the application
stop_app() {
    echo -e "${GREEN}Stopping the application...${NC}"
    docker compose -f docker-compose.yml -f docker-compose.prod.yml down
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Application stopped successfully!${NC}"
    else
        echo -e "${RED}Failed to stop the application.${NC}"
        exit 1
    fi
}

# Function to show application status
show_status() {
    echo -e "${GREEN}Application status:${NC}"
    docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
}

# Function to show logs
show_logs() {
    echo -e "${GREEN}Showing logs from backend service...${NC}"
    docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
}

# Function to backup data
backup_data() {
    BACKUP_DIR="./backups/$(date +%Y-%m-%d_%H-%M-%S)"
    mkdir -p $BACKUP_DIR
    
    echo -e "${GREEN}Creating database backup...${NC}"
    docker compose -f docker-compose.yml -f docker-compose.prod.yml exec db pg_dump -U autotrader -d autotrader > $BACKUP_DIR/database.sql
    
    echo -e "${GREEN}Creating MinIO backup...${NC}"
    # This requires MinIO client (mc) to be set up
    # For simplicity, we'll just ensure the volume is backed up
    echo -e "${YELLOW}NOTE: For complete MinIO backup, ensure the Docker volumes are included in your host backup strategy${NC}"
    
    echo -e "${GREEN}Backup created at $BACKUP_DIR${NC}"
}

# Function to restore data
restore_data() {
    # Prompt for backup directory
    echo -e "${YELLOW}Available backups:${NC}"
    ls -1 ./backups/
    read -p "Enter backup directory name: " BACKUP_NAME
    BACKUP_DIR="./backups/$BACKUP_NAME"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${RED}Backup directory not found!${NC}"
        exit 1
    fi
    
    echo -e "${RED}WARNING: This will overwrite current data. Are you sure? (y/N)${NC}"
    read -p "" confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Restore cancelled.${NC}"
        exit 0
    fi
    
    echo -e "${GREEN}Restoring database...${NC}"
    cat $BACKUP_DIR/database.sql | docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db psql -U autotrader -d autotrader
    
    echo -e "${GREEN}Database restored!${NC}"
    echo -e "${YELLOW}NOTE: MinIO data needs to be restored manually from volume backups${NC}"
}

# Main script logic
case "$1" in
    deploy)
        deploy_app
        ;;
    start)
        start_app
        ;;
    stop)
        stop_app
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    backup)
        backup_data
        ;;
    restore)
        restore_data
        ;;
    *)
        print_usage
        exit 1
        ;;
esac

exit 0
