#!/bin/bash
# Script to run Postman tests locally with improved error handling and reporting

# Color definitions
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
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

# Check if Newman is installed
if ! command -v newman &> /dev/null; then
    log_warning "Newman is not installed. Installing now..."
    npm install -g newman newman-reporter-htmlextra
    
    # Verify installation succeeded
    if ! command -v newman &> /dev/null; then
        log_error "Failed to install Newman. Please install it manually with: npm install -g newman newman-reporter-htmlextra"
        exit 1
    fi
else
    log_info "Newman is already installed."
fi

# Create results directory
mkdir -p results

log_info "Running Postman collection tests..."

# Try to find the right collection file
COLLECTION_PATH=""
if [ -f "./postman/Caryo_Marketplace_API_Tests.json" ]; then
    COLLECTION_PATH="./postman/Caryo_Marketplace_API_Tests.json"
    log_info "Using Caryo_Marketplace_API_Tests.json collection file"
elif [ -f "./backend/autotrader-backend/src/test/resources/postman/autotrader-api-collection.json" ]; then
    COLLECTION_PATH="./backend/autotrader-backend/src/test/resources/postman/autotrader-api-collection.json"
    log_info "Using autotrader-api-collection.json collection file"
else
    log_error "ERROR: Postman collection file not found"
    log_info "Searching for collection files in project..."
    find . -name "*.json" | grep -i -E "collection|postman|api[-_]test" 
    exit 1
fi

# Check if environment file exists
if [ ! -f "./postman/test_environment.json" ]; then
    log_error "Environment file not found at ./postman/test_environment.json"
    log_info "Searching for environment files in project..."
    find . -name "*environment*.json"
    exit 1
else
    log_info "Using environment file: ./postman/test_environment.json"
fi

# Run the tests
log_info "Executing Postman tests..."
newman run "$COLLECTION_PATH" \
    --environment ./postman/test_environment.json \
    --reporters cli,htmlextra \
    --reporter-htmlextra-export results/html-report.html

# Check if tests passed
if [ $? -eq 0 ]; then
    log_success "✅ Postman tests completed successfully"
    log_info "HTML report available at: $(pwd)/results/html-report.html"
    exit 0
else
    log_error "❌ Postman tests failed"
    log_info "HTML report available at: $(pwd)/results/html-report.html"
    exit 1
fi
