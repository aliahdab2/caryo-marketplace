#!/bin/bash
# Enhanced diagnostic script to check Postman test setup and backend availability

# Color definitions
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Helper functions
log_info() {
  echo -e "${BOLD}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_section() {
  echo -e "\n${BLUE}${BOLD}==== $1 ====${NC}"
}

log_section "Postman Test Diagnostics"
log_info "Current directory: $(pwd)"

# Check basic requirements
log_section "Checking Basic Requirements"

# Check if Newman is installed
if ! command -v newman &> /dev/null; then
    log_error "Newman is not installed. Please install it with: npm install -g newman newman-reporter-htmlextra"
else
    log_success "Newman is installed: $(newman --version)"
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    log_warning "Docker is not running or not installed"
else
    log_success "Docker is running: $(docker --version)"
fi

# Check for Java installation
if ! command -v java &> /dev/null; then
    log_warning "Java is not installed or not in PATH"
else
    log_success "Java is installed: $(java -version 2>&1 | head -n 1)"
fi

# Check for collection file
log_section "Checking Postman Files"

# Try to find the right collection file
COLLECTION_PATH=""
if [ -f "./postman/Caryo_Marketplace_API_Tests.json" ]; then
    COLLECTION_PATH="./postman/Caryo_Marketplace_API_Tests.json"
    log_success "Found collection file: $COLLECTION_PATH"
elif [ -f "./backend/autotrader-backend/src/test/resources/postman/autotrader-api-collection.json" ]; then
    COLLECTION_PATH="./backend/autotrader-backend/src/test/resources/postman/autotrader-api-collection.json"
    log_success "Found collection file: $COLLECTION_PATH"
else
    log_error "No Postman collection file found!"
    log_info "Searching for possible collection files..."
    find . -name "*.json" | grep -i -E "collection|postman|api[-_]test"
fi

# Check for environment file
ENV_FILE_PATH="./postman/test_environment.json"
ABS_ENV_PATH="/Users/aliahdab/Documents/Dev/caryo-marketplace/postman/test_environment.json"

if [ -f "$ENV_FILE_PATH" ]; then
    log_success "Found environment file: $ENV_FILE_PATH"
    ls -la "$ENV_FILE_PATH"
    
    # Check if it's a symlink pointing to a non-existent file
    if [ -L "$ENV_FILE_PATH" ] && [ ! -e "$ENV_FILE_PATH" ]; then
        log_error "The environment file is a broken symlink!"
        log_info "Symlink points to: $(readlink -f "$ENV_FILE_PATH")"
    fi
    
    # Check baseUrl in environment file
    BASE_URL=$(grep -o '"baseUrl"[^}]*' "$ENV_FILE_PATH" | grep -o '"value": "[^"]*' | cut -d'"' -f4)
    if [ ! -z "$BASE_URL" ]; then
        log_info "Environment file has baseUrl set to: $BASE_URL"
    else
        log_warning "Could not find baseUrl in environment file"
    fi
elif [ -f "$ABS_ENV_PATH" ] && [ "$ENV_FILE_PATH" != "$ABS_ENV_PATH" ]; then
    log_success "Found environment file at absolute path: $ABS_ENV_PATH"
    ls -la "$ABS_ENV_PATH"
    ENV_FILE_PATH="$ABS_ENV_PATH"
    
    # Check baseUrl in environment file
    BASE_URL=$(grep -o '"baseUrl"[^}]*' "$ENV_FILE_PATH" | grep -o '"value": "[^"]*' | cut -d'"' -f4)
    if [ ! -z "$BASE_URL" ]; then
        log_info "Environment file has baseUrl set to: $BASE_URL"
    else
        log_warning "Could not find baseUrl in environment file"
    fi
else
    log_error "Environment file not found!"
    log_info "Searching for environment files in project..."
    find . -name "*environment*.json"
fi

# Check backend services
log_section "Checking Backend Services"

# Check if PostgreSQL container is running
if docker ps | grep -q "db"; then
    log_success "PostgreSQL container is running"
    
    # Check PostgreSQL connectivity
    if docker exec $(docker ps -q -f name=db) pg_isready -U autotrader -t 5 2>/dev/null; then
        log_success "PostgreSQL is accepting connections"
    else
        log_warning "PostgreSQL container is not accepting connections"
    fi
else
    log_warning "PostgreSQL container is not running"
fi

# Check if Minio container is running
if docker ps | grep -q "minio"; then
    log_success "MinIO container is running"
else
    log_warning "MinIO container is not running"
fi

# Check Spring Boot application
log_section "Checking Spring Boot Application"

# Determine the expected base URL (from environment file or default)
if [ -z "$BASE_URL" ]; then
    BASE_URL="http://localhost:8080"
    log_info "Using default baseUrl: $BASE_URL"
fi

# Check if Spring Boot is running on the specified port
PORT=$(echo $BASE_URL | sed -E 's|^.*://[^/]*:([0-9]+).*$|\1|')
if [ -z "$PORT" ] || [ "$PORT" = "$BASE_URL" ]; then
    # If no port in URL, assume default ports
    if [[ "$BASE_URL" == "https://"* ]]; then
        PORT=443
    else
        PORT=80
    fi
fi

HOST=$(echo $BASE_URL | sed -E 's|^.*://([^:/]*).*$|\1|')
if [ "$HOST" = "localhost" ]; then
    if nc -z localhost $PORT 2>/dev/null; then
        log_success "Something is listening on $HOST:$PORT"
        
        # Try to check if it's our Spring Boot app
        if curl -s $BASE_URL/actuator/health 2>/dev/null | grep -q "UP"; then
            log_success "Spring Boot application is running and healthy (via actuator)"
        elif curl -s $BASE_URL/health 2>/dev/null | grep -q "UP"; then
            log_success "Spring Boot application is running and healthy (via health)"
        elif curl -s $BASE_URL/status 2>/dev/null | grep -q "UP"; then
            log_success "Spring Boot application is running and healthy (via status)"
        elif curl -s -I -o /dev/null -w "%{http_code}" $BASE_URL/ 2>/dev/null | grep -q "200\|302"; then
            log_success "Spring Boot application is responding to requests (via root path)"
        else
            log_warning "Something is running on $HOST:$PORT, but it doesn't seem to be our Spring Boot application"
        fi
    else
        log_error "Nothing is listening on $HOST:$PORT. Spring Boot application is not running!"
        
        # Check if maybe running on a different port
        for alt_port in 8080 8081 8082 8090; do
            if [ "$alt_port" != "$PORT" ] && nc -z localhost $alt_port 2>/dev/null; then
                log_warning "Found service on port $alt_port - could Spring Boot be running on a non-standard port?"
                log_warning "Try updating the baseUrl in the environment file to use port $alt_port"
                break
            fi
        done
    fi
else
    # For non-localhost hosts, just try to connect
    if curl -s --connect-timeout 5 -I -o /dev/null -w "%{http_code}" $BASE_URL/ 2>/dev/null | grep -q "200\|302\|401\|403"; then
        log_success "Successfully connected to $BASE_URL"
    else
        log_error "Failed to connect to $BASE_URL"
        log_info "If this is a remote host, check that it's reachable and the API is running"
    fi
fi

# Try to make a test request to the API
log_section "Testing API Connection"

log_info "Attempting to connect to $BASE_URL..."
curl -s -I -X GET "$BASE_URL" -o /dev/null -w "Status code: %{http_code}\n" || echo "Failed to connect to $BASE_URL"

# Ask if user wants to run the tests
log_section "Run Tests"

if [ -z "$COLLECTION_PATH" ] || [ ! -f "$ENV_FILE_PATH" ]; then
    log_error "Cannot run tests: Missing collection file or environment file"
    exit 1
fi

read -p "Would you like to run the Postman tests now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Create results directory
    mkdir -p results
    
    log_info "Running Postman tests..."
    log_info "Using collection: $COLLECTION_PATH"
    log_info "Using environment: $ENV_FILE_PATH"
    
    # Execute Newman
    newman run "$COLLECTION_PATH" \
        --environment "$ENV_FILE_PATH" \
        --reporters cli,htmlextra \
        --reporter-htmlextra-export results/html-report.html
    
    TEST_EXIT_CODE=$?
    
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        log_success "✅ Postman tests completed successfully"
        log_info "HTML report available at: $(pwd)/results/html-report.html"
    else
        log_error "❌ Postman tests failed with exit code: $TEST_EXIT_CODE"
        log_info "HTML report available at: $(pwd)/results/html-report.html"
        
        # Try to identify common issues
        if grep -q "ECONNREFUSED" results/html-report.html 2>/dev/null; then
            log_error "Connection refused errors detected. The backend server is not running or not accessible."
            log_info "Make sure the Spring Boot application is started before running tests."
        elif grep -q "Unauthorized" results/html-report.html 2>/dev/null; then
            log_warning "Authentication issues detected. Check if you need valid auth tokens for your tests."
        fi
    fi
else
    log_info "Skipping test execution"
fi

log_section "Diagnostics Complete"
log_info "If issues persist, check the following:"
log_info "1. Make sure the Spring Boot application is running on the correct port"
log_info "2. Verify that all required services (database, minio) are running"
log_info "3. Check that the baseUrl in the environment file matches the actual API endpoint"
log_info "4. Ensure the Postman collection tests are compatible with your API version"
log_info "5. Run 'cd ./backend/autotrader-backend && ./start-dev.sh' to start all services"
