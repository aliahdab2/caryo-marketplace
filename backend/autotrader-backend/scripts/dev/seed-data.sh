#!/bin/bash

# Sample Data Generation Script for Development

echo "Starting sample data generation..."

# Base URL of your API
API_URL="http://localhost:8080/api"

# Admin auth token - you'll need to get this after login
AUTH_TOKEN=""

# Function to generate random string
random_string() {
  cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w ${1:-12} | head -n 1
}

# Create test users if they don't exist
create_test_users() {
  echo "Creating test users..."
  
  # Regular user
  curl -s -X POST "${API_URL}/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{
      "username":"testuser",
      "email":"testuser@example.com",
      "password":"Password123",
      "role":["user"]
    }'
  echo ""

  # Admin user
  curl -s -X POST "${API_URL}/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{
      "username":"testadmin",
      "email":"testadmin@example.com",
      "password":"Password123",
      "role":["admin"]
    }'
  echo ""
  
  # Get admin token for further operations
  token_response=$(curl -s -X POST "${API_URL}/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{
      "username":"testadmin",
      "password":"Password123"
    }')
  
  AUTH_TOKEN=$(echo $token_response | grep -o '"token":"[^"]*' | sed 's/"token":"//')
  echo "Admin token obtained"
}

# Create sample car listings
create_sample_listings() {
  echo "Creating sample car listings..."
  
  # Car brands and models
  brands=("Toyota" "Honda" "Ford" "BMW" "Mercedes" "Tesla" "Hyundai" "Kia")
  models_toyota=("Camry" "Corolla" "RAV4" "Highlander" "Tacoma")
  models_honda=("Civic" "Accord" "CR-V" "Pilot" "Odyssey")
  models_ford=("F-150" "Mustang" "Explorer" "Escape" "Focus")
  models_bmw=("3 Series" "5 Series" "X3" "X5" "7 Series")
  models_mercedes=("C-Class" "E-Class" "S-Class" "GLC" "GLE")
  models_tesla=("Model 3" "Model Y" "Model S" "Model X" "Cybertruck")
  models_hyundai=("Elantra" "Sonata" "Tucson" "Santa Fe" "Palisade")
  models_kia=("Forte" "K5" "Sportage" "Sorento" "Telluride")
  
  # Create 20 sample listings
  for i in {1..20}; do
    # Select random brand
    random_brand_index=$((RANDOM % ${#brands[@]}))
    brand=${brands[$random_brand_index]}
    
    # Select random model based on brand
    case $brand in
      "Toyota")
        models=("${models_toyota[@]}")
        ;;
      "Honda")
        models=("${models_honda[@]}")
        ;;
      "Ford")
        models=("${models_ford[@]}")
        ;;
      "BMW")
        models=("${models_bmw[@]}")
        ;;
      "Mercedes")
        models=("${models_mercedes[@]}")
        ;;
      "Tesla")
        models=("${models_tesla[@]}")
        ;;
      "Hyundai")
        models=("${models_hyundai[@]}")
        ;;
      "Kia")
        models=("${models_kia[@]}")
        ;;
    esac
    
    random_model_index=$((RANDOM % ${#models[@]}))
    model=${models[$random_model_index]}
    
    # Random year between 2010 and 2025
    year=$((2010 + RANDOM % 16))
    
    # Random price between $5,000 and $100,000
    price=$((5000 + RANDOM % 95001))
    
    # Random mileage between 0 and 150,000
    mileage=$((RANDOM % 150001))
    
    # Create the listing
    response=$(curl -s -X POST "${API_URL}/listings" \
      -H "Authorization: Bearer ${AUTH_TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{
        "title": "'"$year $brand $model"'",
        "description": "Great condition '"$brand $model"' with '"$mileage"' miles. Features include AC, power windows, and more.",
        "price": '"$price"',
        "year": '"$year"',
        "make": "'"$brand"'",
        "model": "'"$model"'",
        "mileage": '"$mileage"',
        "condition": "USED",
        "bodyType": "SEDAN",
        "fuelType": "GASOLINE",
        "transmission": "AUTOMATIC",
        "locationId": 1
      }')
    
    # Extract listing ID
    listing_id=$(echo $response | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
    
    if [ ! -z "$listing_id" ]; then
      echo "Created listing $i: $year $brand $model (ID: $listing_id)"
      
      # Auto-approve the listing since we're creating test data
      curl -s -X PUT "${API_URL}/admin/listings/${listing_id}/approve" \
        -H "Authorization: Bearer ${AUTH_TOKEN}"
    else
      echo "Failed to create listing $i"
    fi
  done
}

# Main execution
create_test_users
if [ ! -z "$AUTH_TOKEN" ]; then
  create_sample_listings
else
  echo "Failed to obtain auth token. Cannot create sample listings."
fi

echo "Sample data generation complete!"
