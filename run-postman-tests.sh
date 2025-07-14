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

# Show usage information
show_usage() {
    echo -e "${BOLD}Usage: $0 [OPTIONS]${NC}"
    echo ""
    echo -e "${BOLD}Options:${NC}"
    echo "  --all         Run all tests from main collection"
    echo "  --slug        Run only slug-based filtering tests"
    echo "  --reference   Run only reference data tests"
    echo "  --help, -h    Show this help message"
    echo ""
    echo -e "${BOLD}Examples:${NC}"
    echo "  $0                # Run all postman tests (default)"
    echo "  $0 --slug         # Run only slug filtering tests"
    echo "  $0 --reference    # Run only reference data tests"
    echo ""
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

# Check if jq is installed (for JSON manipulation)
if ! command -v jq &> /dev/null; then
    log_warning "jq is not installed. Installing now..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install jq || { log_error "Failed to install jq. Please install manually: brew install jq"; exit 1; }
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y jq || { log_error "Failed to install jq. Please install manually: sudo apt-get install jq"; exit 1; }
    else
        log_error "Please install jq manually for your OS: https://stedolan.github.io/jq/download/"
        exit 1
    fi
    log_info "jq installed successfully."
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

# Default environment variables
API_BASE_URL="http://localhost:8080"
AUTH_TOKEN=""

# Check if Spring Boot application is running
if curl -s http://localhost:8080/actuator/health | grep -q "UP"; then
    log_success "✅ Spring Boot application is running"
else
    log_warning "⚠️ Spring Boot application might not be running. Trying to continue..."
    log_info "If tests fail, please start the Spring Boot application with:"
    log_info "cd backend/autotrader-backend && ./gradlew bootRun --args='--spring.profiles.active=dev'"
fi

# Environment file path
ENV_FILE="./postman/test_environment.json"

# Create environment file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    log_warning "Environment file not found at $ENV_FILE"
    log_info "Creating a basic environment file..."
    
    # Create directory if it doesn't exist
    mkdir -p ./postman
    
    # Create a basic environment JSON
    cat > "$ENV_FILE" << EOL
{
  "id": "test-environment",
  "name": "Test Environment",
  "values": [
    {
      "key": "baseUrl",
      "value": "${API_BASE_URL}",
      "type": "default",
      "enabled": true
    },
    {
      "key": "authToken",
      "value": "",
      "type": "default",
      "enabled": true
    }
  ]
}
EOL
    log_success "Created environment file at $ENV_FILE"
else
    log_info "Using existing environment file: $ENV_FILE"
    
    # Update baseUrl in the environment file to ensure it's correct
    if command -v jq &> /dev/null; then
        CURRENT_BASE_URL=$(jq -r '.values[] | select(.key=="baseUrl") | .value' "$ENV_FILE")
        if [ "$CURRENT_BASE_URL" != "$API_BASE_URL" ] && [ "$CURRENT_BASE_URL" == "{{baseurl}}" ]; then
            log_warning "Fixing baseUrl in environment file (was: $CURRENT_BASE_URL)"
            TMP_FILE=$(mktemp)
            jq --arg url "$API_BASE_URL" '.values = [.values[] | if .key=="baseUrl" then .value=$url else . end]' "$ENV_FILE" > "$TMP_FILE"
            mv "$TMP_FILE" "$ENV_FILE"
            log_success "Updated baseUrl to $API_BASE_URL"
        fi
    fi
fi

# Check if we need to authenticate and get a token
if ! grep -q "authToken.*\"value\":.*[a-zA-Z0-9]" "$ENV_FILE" || grep -q "authToken.*\"value\":\s*\"\"" "$ENV_FILE"; then
    log_info "No auth token found in environment file. Attempting to authenticate..."
    
    # Try to authenticate
    AUTH_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/signin" \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"Admin123!"}')
    
    # Extract token if possible
    if [ ! -z "$AUTH_RESPONSE" ] && [[ "$AUTH_RESPONSE" == *"token"* ]]; then
        AUTH_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.token // .accessToken // .access_token // ""')
        if [ ! -z "$AUTH_TOKEN" ] && [ "$AUTH_TOKEN" != "null" ]; then
            log_success "✅ Authentication successful"
            
            # Update token in environment file
            TMP_FILE=$(mktemp)
            jq --arg token "$AUTH_TOKEN" '.values = [.values[] | if .key=="authToken" then .value=$token else . end]' "$ENV_FILE" > "$TMP_FILE"
            mv "$TMP_FILE" "$ENV_FILE"
            log_success "Updated auth token in environment file"
        fi
    else
        log_warning "Authentication failed, will try to run tests without a token"
    fi
fi

# Parse additional command line arguments
ADDITIONAL_OPTIONS=""
if [ ! -z "$1" ]; then
    ADDITIONAL_OPTIONS="$@"
    log_info "Additional options provided: $ADDITIONAL_OPTIONS"
fi

# Parse command line arguments
RUN_MODE="all"
while [[ $# -gt 0 ]]; do
    case $1 in
        --slug)
            RUN_MODE="slug"
            shift
            ;;
        --reference)
            RUN_MODE="reference"
            shift
            ;;
        --all)
            RUN_MODE="all"
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Verify environment file before running tests
log_info "Validating environment file..."
if ! jq empty "$ENV_FILE" 2>/dev/null; then
    log_error "Environment file is not valid JSON. Please check the format."
    exit 1
fi

# Double check baseUrl in the environment
BASE_URL_VALUE=$(jq -r '.values[] | select(.key=="baseUrl") | .value' "$ENV_FILE")
if [ -z "$BASE_URL_VALUE" ] || [ "$BASE_URL_VALUE" == "null" ] || [ "$BASE_URL_VALUE" == "{{baseurl}}" ]; then
    log_warning "Invalid baseUrl in environment file: '$BASE_URL_VALUE'"
    log_info "Creating temporary environment file with correct baseUrl..."
    TMP_ENV_FILE=$(mktemp)
    jq --arg url "$API_BASE_URL" '.values = [.values[] | if .key=="baseUrl" then .value=$url else . end]' "$ENV_FILE" > "$TMP_ENV_FILE"
    ENV_FILE="$TMP_ENV_FILE"
    log_info "Using temporary environment file with correct baseUrl: $API_BASE_URL"
fi

# Run the tests based on selected mode
log_info "Executing Postman tests in '$RUN_MODE' mode..."

case "$RUN_MODE" in
    "slug")
        log_info "🧪 Running Slug-Based Filtering Tests Only"
        COMMAND="newman run \"$COLLECTION_PATH\" --folder \"Slug-Based Filtering\" --environment \"$ENV_FILE\" --reporters cli,htmlextra --reporter-htmlextra-export results/slug-filtering-report.html"
        ;;
    "reference")
        log_info "📊 Running Reference Data Tests Only"
        COMMAND="newman run \"$COLLECTION_PATH\" --folder \"Reference Data\" --environment \"$ENV_FILE\" --reporters cli,htmlextra --reporter-htmlextra-export results/reference-data-report.html"
        ;;
    "all"|*)
        log_info "🔄 Running All Tests"
        COMMAND="newman run \"$COLLECTION_PATH\" --environment \"$ENV_FILE\" --reporters cli,htmlextra --reporter-htmlextra-export results/html-report.html"
        ;;
esac

# Add any additional options to the command
if [ ! -z "$ADDITIONAL_OPTIONS" ]; then
    COMMAND="$COMMAND $ADDITIONAL_OPTIONS"
fi

# Display the command being executed
log_info "Running command: $COMMAND"

# Execute the command
eval $COMMAND
TEST_EXIT_CODE=$?

# Check if tests passed
if [ $TEST_EXIT_CODE -eq 0 ]; then
    log_success "✅ Postman tests completed successfully"
    log_info "HTML report available at: $(pwd)/results/html-report.html"
    exit 0
else
    log_error "❌ Postman tests failed with exit code: $TEST_EXIT_CODE"
    log_info "HTML report available at: $(pwd)/results/html-report.html"
    
    # Additional diagnostics on failure
    log_info "Running API health check..."
    curl -i "$API_BASE_URL/actuator/health"
    
    # If there's a temp file, clean it up
    if [[ "$ENV_FILE" == /tmp/* ]]; then
        rm -f "$ENV_FILE"
    fi
    
    exit $TEST_EXIT_CODE
fi
