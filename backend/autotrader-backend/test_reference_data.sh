#!/bin/bash

# Test script for Reference Data API endpoints
# Usage: ./test_reference_data.sh [base_url]

# Default to localhost if no base URL provided
BASE_URL=${1:-"http://localhost:8080"}
ADMIN_TOKEN=""

echo "===== AutoTrader Marketplace Reference Data API Test Script ====="
echo "Base URL: $BASE_URL"
echo ""

# Function to perform a GET request and display the result
function test_get() {
    local endpoint=$1
    local description=$2
    
    echo "Testing $description..."
    echo "GET $BASE_URL$endpoint"
    curl -s -X GET "$BASE_URL$endpoint" | jq '.' || echo "Failed to parse JSON response"
    echo ""
}

# Function to perform an authenticated request (for admin endpoints)
function test_admin() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    if [ -z "$ADMIN_TOKEN" ]; then
        echo "Admin token not set. Please login first."
        return 1
    fi
    
    echo "Testing $description (ADMIN)..."
    echo "$method $BASE_URL$endpoint"
    
    if [ "$method" == "POST" ] || [ "$method" == "PUT" ]; then
        curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -d "$data" \
            "$BASE_URL$endpoint" | jq '.' || echo "Failed to parse JSON response"
    else
        curl -s -X "$method" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            "$BASE_URL$endpoint" | jq '.' || echo "Failed to parse JSON response"
    fi
    echo ""
}

# Function to perform admin login
function admin_login() {
    local username=$1
    local password=$2
    
    echo "Logging in as admin..."
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$username\",\"password\":\"$password\"}" \
        "$BASE_URL/api/auth/signin")
    
    ADMIN_TOKEN=$(echo $response | jq -r '.accessToken')
    
    if [ "$ADMIN_TOKEN" == "null" ] || [ -z "$ADMIN_TOKEN" ]; then
        echo "Failed to get admin token. Check credentials."
        echo "Response: $response"
        return 1
    else
        echo "Successfully logged in as admin"
        echo "Token: ${ADMIN_TOKEN:0:15}..."
        return 0
    fi
}

# Test the combined reference data endpoint
test_get "/api/reference-data" "Combined Reference Data Endpoint"

# Test Car Conditions endpoints
test_get "/api/car-conditions" "Get All Car Conditions"
test_get "/api/car-conditions/search?q=new" "Search Car Conditions"

# Test Drive Types endpoints
test_get "/api/drive-types" "Get All Drive Types"
test_get "/api/drive-types/search?q=wheel" "Search Drive Types"

# Test Body Styles endpoints
test_get "/api/body-styles" "Get All Body Styles"
test_get "/api/body-styles/search?q=sedan" "Search Body Styles"

# Test Fuel Types endpoints
test_get "/api/fuel-types" "Get All Fuel Types"
test_get "/api/fuel-types/search?q=gas" "Search Fuel Types"

# Test Transmissions endpoints
test_get "/api/transmissions" "Get All Transmissions"
test_get "/api/transmissions/search?q=auto" "Search Transmissions"

# Test Seller Types endpoints
test_get "/api/seller-types" "Get All Seller Types"
test_get "/api/seller-types/search?q=dealer" "Search Seller Types"

# Admin login (uncomment and set credentials to test admin endpoints)
# admin_login "admin" "admin123"

# Example of admin operations (uncomment to test)
# test_admin "POST" "/api/car-conditions" "Create Car Condition" '{"name":"mint","displayNameEn":"Mint Condition","displayNameAr":"حالة ممتازة"}'
# test_admin "PUT" "/api/car-conditions/1" "Update Car Condition" '{"name":"new","displayNameEn":"Brand New","displayNameAr":"جديد تماما"}'
# test_admin "DELETE" "/api/car-conditions/2" "Delete Car Condition"

echo "===== Reference Data API Tests Completed ====="
