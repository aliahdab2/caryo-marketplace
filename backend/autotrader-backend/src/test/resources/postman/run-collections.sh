#!/bin/bash

# Run Postman collections using Newman
# Requires Newman (npm install -g newman) to be installed

# Set variables
POSTMAN_DIR="$(dirname "$0")"
COLLECTIONS_DIR="$POSTMAN_DIR/collections"
ENVIRONMENT_FILE="$POSTMAN_DIR/environment.json"
MAIN_COLLECTION="$POSTMAN_DIR/autotrader-api-collection.json"

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Function to run specific folder from main collection
run_collection_folder() {
    local folder_name=$1
    
    echo -e "${BLUE}Running $folder_name tests from main collection...${NC}"
    
    newman run "$MAIN_COLLECTION" \
        --folder "$folder_name" \
        -e "$ENVIRONMENT_FILE" \
        --reporters cli \
        --bail
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $folder_name tests passed${NC}"
        return 0
    else
        echo -e "${RED}✗ $folder_name tests failed${NC}"
        return 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    "--all")
        echo -e "${YELLOW}Running all tests from main collection...${NC}"
        newman run "$MAIN_COLLECTION" -e "$ENVIRONMENT_FILE"
        ;;
    "--slug")
        echo -e "${BLUE}🧪 Running Slug-Based Filtering Tests Only${NC}"
        run_collection "$COLLECTIONS_DIR/slug-filtering-tests.json"
        ;;
    "--reference")
        echo -e "${BLUE}Running Reference Data Tests Only${NC}"
        run_collection_folder "Reference Data"
        ;;
    "--help"|"-h")
        echo -e "${BLUE}Usage: $0 [OPTIONS]${NC}"
        echo ""
        echo "Options:"
        echo "  --all         Run all tests from main collection"
        echo "  --slug        Run only slug-based filtering tests"
        echo "  --reference   Run only reference data tests"
        echo "  --help, -h    Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                # Run individual collections"
        echo "  $0 --all          # Run complete main collection"
        echo "  $0 --slug         # Run only slug filtering tests"
        exit 0
        ;;
    *)
        # Run individual collections (default behavior)
        echo -e "${YELLOW}Running individual collections...${NC}"
        
        if [[ -f "$COLLECTIONS_DIR/auth-tests.json" ]]; then
            run_collection "$COLLECTIONS_DIR/auth-tests.json"
        fi
        
        if [[ -f "$COLLECTIONS_DIR/reference-data-tests.json" ]]; then
            run_collection "$COLLECTIONS_DIR/reference-data-tests.json"
        fi
        
        if [[ -f "$COLLECTIONS_DIR/car-conditions-tests.json" ]]; then
            run_collection "$COLLECTIONS_DIR/car-conditions-tests.json"
        fi
        
        if [[ -f "$COLLECTIONS_DIR/drive-types-tests.json" ]]; then
            run_collection "$COLLECTIONS_DIR/drive-types-tests.json"
        fi
        
        if [[ -f "$COLLECTIONS_DIR/body-styles-tests.json" ]]; then
            run_collection "$COLLECTIONS_DIR/body-styles-tests.json"
        fi
        
        if [[ -f "$COLLECTIONS_DIR/fuel-types-tests.json" ]]; then
            run_collection "$COLLECTIONS_DIR/fuel-types-tests.json"
        fi
        
        if [[ -f "$COLLECTIONS_DIR/transmissions-tests.json" ]]; then
            run_collection "$COLLECTIONS_DIR/transmissions-tests.json"
        fi
        
        if [[ -f "$COLLECTIONS_DIR/seller-types-tests.json" ]]; then
            run_collection "$COLLECTIONS_DIR/seller-types-tests.json"
        fi
        
        if [[ -f "$COLLECTIONS_DIR/slug-filtering-tests.json" ]]; then
            run_collection "$COLLECTIONS_DIR/slug-filtering-tests.json"
        fi
        
        echo -e "${BLUE}💡 Tip: Use '$0 --slug' to run slug filtering tests specifically${NC}"
        ;;
esac

echo -e "${GREEN}Test execution completed${NC}"
