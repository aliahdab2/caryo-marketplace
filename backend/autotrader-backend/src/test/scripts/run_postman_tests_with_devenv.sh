#!/bin/bash

# Determine the project root directory based on script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$PROJECT_ROOT"

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Variable to track if we started the environment
ENV_STARTED_BY_SCRIPT=false

# Function to handle cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}Cleaning up...${NC}"
  
  # Only stop the environment if we started it
  if [ "$ENV_STARTED_BY_SCRIPT" = true ]; then
    echo "Stopping development environment..."
    ./dev-env.sh stop
  else
    echo "Leaving environment running as it was started externally."
  fi
  
  echo -e "${GREEN}Cleanup complete${NC}"
}

# Register the cleanup function to be called on script exit
trap cleanup EXIT

echo -e "${YELLOW}=== Running Postman Tests with Full Development Environment ===${NC}\n"

# Prepare test assets (create test images, PDFs, etc.)
echo -e "${YELLOW}Preparing test assets for Postman tests...${NC}"
"$SCRIPT_DIR/prepare_test_assets.sh"

# Check if the environment is already running
echo -e "${YELLOW}Checking if development environment is already running...${NC}"
ENV_STARTED_BY_SCRIPT=false

# Try to hit the health endpoint
if curl -s http://localhost:${SERVER_PORT:-8080}/actuator/health > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Development environment is already running!${NC}"
  ENV_STARTED_BY_SCRIPT=false
else
  echo -e "${YELLOW}Development environment is not running. Starting it now...${NC}"
  # Start the dev environment using dev-env.sh (which includes S3/MinIO container)
  echo -e "${YELLOW}Starting development environment with S3 container support...${NC}"
  ./dev-env.sh start
  ENV_STARTED_BY_SCRIPT=true
fi

# Brief pause to ensure everything is fully initialized
sleep 5

# Health check to verify all services are running properly
echo -e "\n${YELLOW}Verifying all services are running properly...${NC}"
./dev-env.sh health

# NOTE: The separate create_admin_user.sh script is no longer needed since the admin user is
# automatically created by DataInitializer.java at application startup with the following credentials:
#   - Username: admin
#   - Email: admin@autotrader.com
#   - Password: Admin123!
# We just verify that the admin user is working properly with these credentials.
echo -e "\n${YELLOW}Verifying admin user credentials...${NC}"

# Get credentials from environment file
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="Admin123!"

# Try to login as admin to verify credentials
echo -e "${YELLOW}Testing admin login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/signin \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$ADMIN_USERNAME\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
  echo -e "${GREEN}✓ Admin login successful${NC}"
  # Extract the token for display
  TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4 | cut -c1-20)
  echo -e "${GREEN}✓ Admin token received: ${TOKEN}...${NC}"
else
  echo -e "${RED}✗ Admin login failed: $LOGIN_RESPONSE${NC}"
  echo -e "${YELLOW}⚠️ This may cause some tests to fail. Continuing anyway...${NC}"
fi

# Install Newman if not already installed
if ! command -v newman &> /dev/null; then
    echo -e "\n${YELLOW}Newman not found, installing...${NC}"
    npm install -g newman
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install Newman. Please ensure npm is installed and try again.${NC}"
        exit 1
    fi
else
    echo -e "\n${GREEN}Newman is already installed${NC}"
fi

# Make a directory for reports if it doesn't exist
mkdir -p build/test-reports/postman

# Run the Postman collections with HTML reporter
echo -e "\n${YELLOW}Running Postman tests...${NC}"

# Directory for the collections
POSTMAN_DIR="src/test/resources/postman"
COLLECTIONS_DIR="$POSTMAN_DIR/collections"
ENV_FILE="$POSTMAN_DIR/environment.json"
REPORT_DIR="build/test-reports/postman"

# Make a directory for individual collection reports
mkdir -p "$REPORT_DIR/collections"

# Initialize test result tracking variable
TEST_SUCCESS=true

# Function to run a single collection
run_collection() {
    local collection_name=$1
    local display_name=$2
    
    echo -e "\n${YELLOW}Running $display_name tests...${NC}"
    newman run "$COLLECTIONS_DIR/$collection_name.json" -e "$ENV_FILE" \
      --reporters cli,html \
      --reporter-html-export "$REPORT_DIR/collections/$collection_name-report.html"
      
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ $display_name tests failed${NC}"
        TEST_SUCCESS=false
    else
        echo -e "${GREEN}✓ $display_name tests passed${NC}"
    fi
}

# Run each collection individually
run_collection "auth-tests" "Authentication"
run_collection "reference-data-tests" "Reference Data Overview"
run_collection "car-conditions-tests" "Car Conditions"
run_collection "drive-types-tests" "Drive Types"
run_collection "body-styles-tests" "Body Styles"
run_collection "fuel-types-tests" "Fuel Types"
run_collection "transmissions-tests" "Transmissions"
run_collection "seller-types-tests" "Seller Types"
run_collection "listings-media-tests" "Listings and Media"

# Output test login credentials for reference
echo -e "\n${GREEN}========================================${NC}"
echo -e "${YELLOW}Test Credentials (for debugging):${NC}"
echo -e "Admin Username: ${GREEN}admin${NC}"
echo -e "Admin Password: ${GREEN}Admin123!${NC}"
echo -e "Admin Email: ${GREEN}admin@autotrader.com${NC}"
echo -e "${YELLOW}These credentials are defined in environment.json${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Create a combined HTML report index
cat > "$REPORT_DIR/index.html" << EOL
<!DOCTYPE html>
<html>
<head>
    <title>AutoTrader API Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .collection { margin-bottom: 10px; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>AutoTrader API Test Results</h1>
    <p>Generated on: $(date)</p>
    <h2>Collection Reports:</h2>
    <div class="collection"><a href="collections/auth-tests-report.html">Authentication Tests</a></div>
    <div class="collection"><a href="collections/reference-data-tests-report.html">Reference Data Tests</a></div>
    <div class="collection"><a href="collections/car-conditions-tests-report.html">Car Conditions Tests</a></div>
    <div class="collection"><a href="collections/drive-types-tests-report.html">Drive Types Tests</a></div>
    <div class="collection"><a href="collections/body-styles-tests-report.html">Body Styles Tests</a></div>
    <div class="collection"><a href="collections/fuel-types-tests-report.html">Fuel Types Tests</a></div>
    <div class="collection"><a href="collections/transmissions-tests-report.html">Transmissions Tests</a></div>
    <div class="collection"><a href="collections/seller-types-tests-report.html">Seller Types Tests</a></div>
    <div class="collection"><a href="collections/listings-media-tests-report.html">Listings and Media Tests</a></div>
</body>
</html>
EOL

# Display a clear result message
if [ "$TEST_SUCCESS" = true ]; then
  echo -e "\n${GREEN}========================================${NC}"
  echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo -e "HTML reports available at: build/test-reports/postman/index.html\n"
  TEST_RESULT=0
else
  echo -e "\n${RED}========================================${NC}"
  echo -e "${RED}✗ SOME TESTS FAILED${NC}"
  echo -e "${RED}========================================${NC}"
  echo -e "See details in the HTML reports: build/test-reports/postman/index.html\n"
  TEST_RESULT=1
fi

# Return the test result
exit $TEST_RESULT
