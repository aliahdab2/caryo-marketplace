#!/bin/bash
#
# Script to generate sample data for development environment
#

echo "Generating sample data for development..."

# Get API base URL from arguments or use default
API_URL=${1:-"http://localhost:8080/api"}

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo "Error: curl is required but not installed."
    exit 1
fi

# Function to generate random data
generate_random_car() {
    local BRANDS=("Toyota" "Honda" "BMW" "Mercedes" "Audi" "Ford" "Chevrolet" "Hyundai" "Kia" "Nissan")
    local MODELS=("Camry" "Civic" "3 Series" "C-Class" "A4" "Mustang" "Malibu" "Elantra" "Optima" "Altima")
    local COLORS=("Red" "Blue" "Black" "White" "Silver" "Green" "Yellow" "Orange" "Purple" "Gray")
    local YEARS=(2018 2019 2020 2021 2022 2023 2024)
    local PRICES=(15000 18000 22000 25000 30000 35000 40000 45000 50000 60000)
    
    local BRAND_INDEX=$((RANDOM % 10))
    local MODEL_INDEX=$((RANDOM % 10))
    local COLOR_INDEX=$((RANDOM % 10))
    local YEAR_INDEX=$((RANDOM % 7))
    local PRICE_INDEX=$((RANDOM % 10))
    
    local BRAND=${BRANDS[$BRAND_INDEX]}
    local MODEL=${MODELS[$MODEL_INDEX]}
    local COLOR=${COLORS[$COLOR_INDEX]}
    local YEAR=${YEARS[$YEAR_INDEX]}
    local PRICE=${PRICES[$PRICE_INDEX]}
    local MILEAGE=$((RANDOM % 100000 + 5000))
    
    # Create JSON payload
    cat <<EOF
{
    "title": "$YEAR $BRAND $MODEL - $COLOR",
    "description": "This is a beautiful $COLOR $YEAR $BRAND $MODEL with $MILEAGE miles. Well maintained and in excellent condition.",
    "brand": "$BRAND",
    "model": "$MODEL",
    "year": $YEAR,
    "price": $PRICE,
    "mileage": $MILEAGE,
    "color": "$COLOR",
    "fuelType": "GASOLINE",
    "transmission": "AUTOMATIC",
    "bodyType": "SEDAN",
    "locationId": 1
}
EOF
}

# Create admin user if it doesn't exist
echo "Creating admin user..."
ADMIN_PAYLOAD='{
    "username": "admin",
    "email": "admin@example.com",
    "password": "Admin123!",
    "role": ["admin", "user"]
}'

curl -s -X POST "$API_URL/auth/signup" \
    -H "Content-Type: application/json" \
    -d "$ADMIN_PAYLOAD" > /dev/null

# Login as admin to get JWT token
echo "Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "email": "admin@example.com", "password": "Admin123!"}')

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
    echo "Error: Failed to get authentication token."
    exit 1
fi

echo "Successfully logged in."

# Create regular test user
echo "Creating test user..."
USER_PAYLOAD='{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!"
}'

curl -s -X POST "$API_URL/auth/signup" \
    -H "Content-Type: application/json" \
    -d "$USER_PAYLOAD" > /dev/null

# Create sample car listings
echo "Creating sample car listings..."
for i in {1..20}; do
    echo "Creating listing $i..."
    CAR_PAYLOAD=$(generate_random_car)
    
    # Create listing
    RESPONSE=$(curl -s -X POST "$API_URL/listings" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "$CAR_PAYLOAD")
    
    # Extract listing ID
    LISTING_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
    
    if [ ! -z "$LISTING_ID" ] && [ "$LISTING_ID" -gt 0 ]; then
        # Approve listing as admin
        curl -s -X POST "$API_URL/admin/listings/$LISTING_ID/approve" \
            -H "Authorization: Bearer $TOKEN" > /dev/null
        echo "Listing $i created and approved (ID: $LISTING_ID)"
    else
        echo "Failed to create listing $i"
    fi
done

echo "Sample data generation completed!"
