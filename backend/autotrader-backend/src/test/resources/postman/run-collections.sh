#!/bin/bash

# Run Postman collections using Newman
# Requires Newman (npm install -g newman) to be installed

# Set variables
POSTMAN_DIR="$(dirname "$0")"
COLLECTIONS_DIR="$POSTMAN_DIR/collections"
ENVIRONMENT_FILE="$POSTMAN_DIR/environment.json"

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print header
echo -e "${YELLOW}============================"
echo -e "AutoTrader API Tests Runner"
echo -e "============================${NC}"

# Check if Newman is installed
if ! command -v newman &> /dev/null; then
    echo -e "${RED}Newman is not installed. Please install it using: npm install -g newman${NC}"
    exit 1
fi

# Function to run a collection
run_collection() {
    local collection_file=$1
    local collection_name=$(basename "$collection_file" .json)
    
    echo -e "${YELLOW}Running $collection_name...${NC}"
    
    newman run "$collection_file" -e "$ENVIRONMENT_FILE" --silent
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $collection_name tests passed${NC}"
        return 0
    else
        echo -e "${RED}✗ $collection_name tests failed${NC}"
        return 1
    fi
}

# Run the main collection
if [[ "$1" == "--all" ]]; then
    echo -e "${YELLOW}Running all tests from main collection...${NC}"
    newman run "$POSTMAN_DIR/autotrader-api-collection.json" -e "$ENVIRONMENT_FILE"
else
    # Run individual collections
    echo -e "${YELLOW}Running authentication tests...${NC}"
    run_collection "$COLLECTIONS_DIR/auth-tests.json"
    
    echo -e "${YELLOW}Running reference data overview tests...${NC}"
    run_collection "$COLLECTIONS_DIR/reference-data-tests.json"
    
    echo -e "${YELLOW}Running car condition tests...${NC}"
    run_collection "$COLLECTIONS_DIR/car-conditions-tests.json"
    
    echo -e "${YELLOW}Running drive types tests...${NC}"
    run_collection "$COLLECTIONS_DIR/drive-types-tests.json"
    
    echo -e "${YELLOW}Running body styles tests...${NC}"
    run_collection "$COLLECTIONS_DIR/body-styles-tests.json"
    
    echo -e "${YELLOW}Running fuel types tests...${NC}"
    run_collection "$COLLECTIONS_DIR/fuel-types-tests.json"
    
    echo -e "${YELLOW}Running transmissions tests...${NC}"
    run_collection "$COLLECTIONS_DIR/transmissions-tests.json"
    
    echo -e "${YELLOW}Running seller types tests...${NC}"
    run_collection "$COLLECTIONS_DIR/seller-types-tests.json"
fi

echo -e "${GREEN}All collections executed${NC}"
