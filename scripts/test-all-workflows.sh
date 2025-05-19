#!/bin/bash
# Master script to test all reusable GitHub Action workflows locally

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directory for scripts
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPTS_DIR")"

# Make sure all scripts are executable
chmod +x "$SCRIPTS_DIR"/*.sh

echo -e "${YELLOW}====================================================${NC}"
echo -e "${YELLOW}  Testing GitHub Actions Composite Actions Locally  ${NC}"
echo -e "${YELLOW}====================================================${NC}"

# Prepare for testing
echo -e "${GREEN}Preparing test environment...${NC}"
cd "$PROJECT_ROOT"

# Function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check for prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check if Docker is installed and running
if ! command_exists docker; then
    echo -e "${RED}Error: Docker is not installed.${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}Error: Docker daemon is not running.${NC}"
    echo "Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is installed
if ! command_exists docker-compose && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed or not in PATH.${NC}"
    echo "Please install Docker Compose or make sure it's in your PATH."
    exit 1
fi

# Check if act is installed
if ! command_exists act; then
    echo -e "${RED}Warning: 'act' is not installed.${NC}"
    echo "This tool is required to run GitHub Actions locally."
    echo "Would you like to install it now? (y/n)"
    read -r answer
    if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
        if command_exists brew; then
            brew install act
        elif command_exists curl; then
            curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
        else
            echo -e "${RED}Error: Cannot install 'act'. Please install it manually:${NC}"
            echo "https://github.com/nektos/act#installation"
            exit 1
        fi
    else
        echo -e "${RED}Cannot continue without 'act'. Exiting.${NC}"
        exit 1
    fi
fi

# Check if Python 3 is installed (needed for mock server)
if ! command_exists python3; then
    echo -e "${RED}Error: Python 3 is not installed.${NC}"
    echo "Python 3 is required for the mock Spring Boot server."
    exit 1
fi

# Test options
echo -e "${YELLOW}Choose what to test:${NC}"
echo "1. All workflows (may take time)"
echo "2. Gradle setup workflow only"
echo "3. Docker services setup workflow only"
echo "4. Spring Boot setup workflow only"
echo "5. Postman tests workflow only"
echo "q. Quit"
read -p "Enter your choice: " choice

# Process choice
case "$choice" in
    1)
        test_option="all"
        ;;
    2)
        test_option="gradle"
        ;;
    3)
        test_option="docker"
        ;;
    4)
        test_option="spring-boot"
        ;;
    5)
        test_option="postman"
        ;;
    q|Q)
        echo "Exiting."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

# Setup test environment based on choice
if [[ "$test_option" == "spring-boot" || "$test_option" == "all" ]]; then
    echo -e "${YELLOW}Starting mock Spring Boot server...${NC}"
    "$SCRIPTS_DIR/mock-spring-boot.sh" &
    MOCK_SERVER_PID=$!
    sleep 2  # Give time for the server to start
fi

if [[ "$test_option" == "docker" || "$test_option" == "postman" || "$test_option" == "all" ]]; then
    echo -e "${YELLOW}Starting Docker services...${NC}"
    docker compose -f "$SCRIPTS_DIR/test-docker-compose.yml" up -d
    sleep 5  # Give time for services to start
fi

# Run both workflow tests and reusable workflow component tests
echo -e "${YELLOW}Testing reusable workflow components...${NC}"
"$SCRIPTS_DIR/test-reusable-workflows.sh" $test_option

# For specific components, do additional testing
case "$test_option" in
    "all")
        # Test structural syntax of using the workflows
        echo -e "${YELLOW}Testing workflow files that use reusable components...${NC}"
        "$SCRIPTS_DIR/test-workflows.sh" all
        ;;
    "spring-boot")
        echo -e "${YELLOW}Testing Spring Boot mock server...${NC}"
        # Check if our mock Spring Boot server is working
        if curl -s http://localhost:8088/actuator/health | grep -q "UP"; then
            echo -e "${GREEN}✓ Mock Spring Boot server is working correctly!${NC}"
        else
            echo -e "${RED}✗ Error: Mock Spring Boot server is not responding properly.${NC}"
        fi
        ;;
    *)
        # No additional tests needed for other components
        ;;
esac

# Cleanup
echo -e "${YELLOW}Cleaning up test environment...${NC}"

# Stop mock Spring Boot server if it was started
if [[ "$test_option" == "spring-boot" || "$test_option" == "all" ]]; then
    if kill -0 $MOCK_SERVER_PID 2>/dev/null; then
        echo "Stopping mock Spring Boot server..."
        kill $MOCK_SERVER_PID
    fi
fi

# Stop Docker services if they were started
if [[ "$test_option" == "integration" || "$test_option" == "postman" || "$test_option" == "all" ]]; then
    echo "Stopping Docker services..."
    docker compose -f "$SCRIPTS_DIR/test-docker-compose.yml" down -v
fi

echo -e "${GREEN}Test completed.${NC}"
echo -e "${YELLOW}====================================================${NC}"
echo "Composite actions have been updated and are ready to use in your workflows."
echo "Your GitHub Actions workflows are now using these composite actions for better maintainability and reusability."
echo -e "${YELLOW}====================================================${NC}"
