#!/bin/bash

# Car Data Management Testing Script
# Tests CarQuery API integration and SyrianCars web scraping

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:8080"
ADMIN_USERNAME="admin@caryo.sy"
ADMIN_PASSWORD="admin123"

echo -e "${BLUE}🚗 Car Data Management Testing Script${NC}"
echo -e "${BLUE}======================================${NC}"

# Function to check if application is running
check_app_status() {
    echo -e "${YELLOW}Checking if application is running...${NC}"
    if curl -s "${BASE_URL}/actuator/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Application is running${NC}"
        return 0
    else
        echo -e "${RED}✗ Application is not running${NC}"
        echo -e "${YELLOW}Please start the application first:${NC}"
        echo -e "  cd backend/caryo-backend"
        echo -e "  ./gradlew bootRun --args='--spring.profiles.active=test'"
        return 1
    fi
}

# Function to authenticate and get JWT token
get_jwt_token() {
    echo -e "${YELLOW}Authenticating as admin...${NC}"

    # First, login to get JWT token
    LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/signin" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"${ADMIN_USERNAME}\",\"password\":\"${ADMIN_PASSWORD}\"}")

    # Extract token from response
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

    if [ -z "$TOKEN" ]; then
        echo -e "${RED}✗ Failed to authenticate${NC}"
        echo -e "${RED}Login response: $LOGIN_RESPONSE${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ Authentication successful${NC}"
    echo "$TOKEN"
}

# Function to test endpoint
test_endpoint() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4
    local token=$5

    echo -e "${YELLOW}Testing: $description${NC}"
    echo -e "${BLUE}Method: $method${NC}"
    echo -e "${BLUE}URL: $url${NC}"

    local curl_cmd="curl -s -X $method \"$BASE_URL$url\""

    if [ -n "$token" ]; then
        curl_cmd="$curl_cmd -H \"Authorization: Bearer $token\""
    fi

    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H \"Content-Type: application/json\" -d '$data'"
    fi

    echo -e "${YELLOW}Executing: $curl_cmd${NC}"

    local response
    if [ "$method" = "GET" ]; then
        response=$(eval "$curl_cmd")
    else
        response=$(eval "$curl_cmd")
    fi

    # Check if response contains success or error
    if echo "$response" | grep -q '"success":true\|"status":"success"'; then
        echo -e "${GREEN}✓ SUCCESS${NC}"
    elif echo "$response" | grep -q '"success":false\|"error"\|"status":"error"'; then
        echo -e "${RED}✗ FAILED${NC}"
    else
        echo -e "${YELLOW}⚠ UNKNOWN RESPONSE${NC}"
    fi

    echo -e "${BLUE}Response: $response${NC}"
    echo -e "${BLUE}----------------------------------------${NC}"
}

# Main testing function
run_tests() {
    echo -e "${BLUE}Starting comprehensive car data testing...${NC}"

    # Get JWT token for admin operations
    TOKEN=$(get_jwt_token)
    if [ $? -ne 0 ]; then
        echo -e "${RED}Cannot proceed without authentication${NC}"
        exit 1
    fi

    echo -e "${GREEN}Starting endpoint tests...${NC}"
    echo

    # Test 1: Load CarQuery data directly to database
    echo -e "${YELLOW}⚠️  Note: CarQuery API requires internet connection${NC}"
    test_endpoint "POST" "/api/admin/data/load-carquery" "" "Load CarQuery Data (Direct to DB)" "$TOKEN"

    # Test 2: Load SyrianCars data directly to database
    echo -e "${YELLOW}⚠️  Note: SyrianCars scraping requires internet connection${NC}"
    test_endpoint "POST" "/api/admin/data/load-syrian-cars" "" "Load SyrianCars Data (Direct to DB)" "$TOKEN"

    # Test 3: Get all brands
    test_endpoint "GET" "/api/admin/car-brands" "" "Get All Car Brands" "$TOKEN"

    # Test 4: Search brands
    test_endpoint "GET" "/api/admin/car-brands/search?query=toyota" "" "Search Car Brands" "$TOKEN"

    # Test 5: Get brands by status
    test_endpoint "GET" "/api/admin/car-brands/status/true" "" "Get Active Brands" "$TOKEN"

    # Test 6: Get all models
    test_endpoint "GET" "/api/admin/car-models" "" "Get All Car Models" "$TOKEN"

    # Test 7: Search models
    test_endpoint "GET" "/api/admin/car-models/search?query=corolla" "" "Search Car Models" "$TOKEN"

    # Test 8: Get models by brand
    test_endpoint "GET" "/api/admin/car-models/brand/1" "" "Get Models by Brand" "$TOKEN"

    # Test 10: Test admin car brand endpoints
    echo -e "${GREEN}Testing Admin Car Brand endpoints...${NC}"

    # Create a test brand
    CREATE_BRAND_DATA='{
        "name": "Test Brand",
        "displayNameEn": "Test Brand",
        "displayNameAr": "علامة تجارية تجريبية",
        "slug": "test-brand",
        "active": true
    }'
    test_endpoint "POST" "/api/admin/car-brands" "$CREATE_BRAND_DATA" "Create Car Brand" "$TOKEN"

    # Get all brands
    test_endpoint "GET" "/api/admin/car-brands?page=0&size=10" "" "Get Car Brands" "$TOKEN"

    echo -e "${GREEN}All tests completed!${NC}"
}

# Function to test individual providers
test_provider() {
    local provider=$1
    echo -e "${BLUE}Testing $provider Provider${NC}"

    TOKEN=$(get_jwt_token)
    if [ $? -ne 0 ]; then
        return 1
    fi

    case $provider in
        "CarQuery")
            test_endpoint "POST" "/api/admin/data/load-carquery" "" "Load CarQuery Data (Direct)" "$TOKEN"
            ;;
        "SyrianCars")
            test_endpoint "POST" "/api/admin/data/load-syrian-cars" "" "Load SyrianCars Data (Direct)" "$TOKEN"
            ;;
        *)
            echo -e "${RED}Unknown provider: $provider${NC}"
            return 1
            ;;
    esac
}

# Function to show usage
show_usage() {
    echo -e "${BLUE}Usage: $0 [command]${NC}"
    echo
    echo "Commands:"
    echo "  all           - Run all tests"
    echo "  carquery      - Test CarQuery API integration"
    echo "  syriancars    - Test SyrianCars web scraping"
    echo "  admin         - Test admin CRUD operations"
    echo "  health        - Check application health"
    echo "  help          - Show this help message"
    echo
    echo "Examples:"
    echo "  $0 all"
    echo "  $0 carquery"
    echo "  $0 syriancars"
    echo
    echo "Prerequisites:"
    echo "  - Application must be running on http://localhost:8080"
    echo "  - Admin user must exist (admin@caryo.sy / admin123)"
    echo "  - For CarQuery: Internet connection and API key required"
    echo "  - For SyrianCars scraping: Enable in application.properties"
}

# Main script logic
main() {
    local command=${1:-"all"}

    case $command in
        "all")
            if check_app_status; then
                run_tests
            fi
            ;;
        "carquery")
            if check_app_status; then
                test_provider "CarQuery"
            fi
            ;;
        "syriancars")
            if check_app_status; then
                test_provider "SyrianCars"
            fi
            ;;
        "admin")
            if check_app_status; then
                TOKEN=$(get_jwt_token)
                if [ $? -eq 0 ]; then
                    # Test admin endpoints
                    test_endpoint "GET" "/api/admin/car-brands?page=0&size=10" "" "Get Car Brands" "$TOKEN"
                    test_endpoint "GET" "/api/admin/car-models?page=0&size=10" "" "Get Car Models" "$TOKEN"
                fi
            fi
            ;;
        "health")
            check_app_status
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            echo -e "${RED}Unknown command: $command${NC}"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
