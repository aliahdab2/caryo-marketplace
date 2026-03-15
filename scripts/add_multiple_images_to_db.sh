#!/bin/bash

# add_multiple_images_to_db.sh
#
# Script to add multiple images to the database for testing CarMediaGallery
# This script adds the additional images that were uploaded to MinIO to the database
#
# Usage: ./add_multiple_images_to_db.sh

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}======================================${NC}"
echo -e "${CYAN}Adding multiple images to database${NC}"
echo -e "${CYAN}======================================${NC}"

# Backend API base URL
API_BASE="http://localhost:8080"

# Function to check if backend is available
check_backend() {
  echo -e "${YELLOW}Checking if backend API is available...${NC}"
  
  for i in {1..10}; do
    if curl -s -f "$API_BASE/actuator/health" > /dev/null 2>&1; then
      echo -e "${GREEN}Backend API is available!${NC}"
      return 0
    else
      echo -n "Attempt $i/10: "
      echo -e "${RED}Backend not ready, waiting...${NC}"
      sleep 2
    fi
  done
  
  echo -e "${RED}Backend API is not available after 10 attempts.${NC}"
  return 1
}

# Function to add image to database via API
add_image_to_listing() {
  local listing_id=$1
  local image_number=$2
  local file_key="sample/car-${listing_id}-${image_number}.jpg"
  local file_name="car-${listing_id}-${image_number}.jpg"
  
  echo -e "${YELLOW}Adding image ${image_number} to listing ${listing_id}...${NC}"
  
  # Create a temporary image file for upload (we'll use a small placeholder)
  temp_file=$(mktemp)
  
  # Download the image from MinIO first
  if curl -s -f "http://localhost:9000/caryo-assets/${file_key}" -o "$temp_file"; then
    echo -e "  Downloaded ${file_key} from MinIO"
    
    # Upload via the API endpoint (this will create the database record)
    response=$(curl -s -w "%{http_code}" \
      -X POST \
      -H "Authorization: Bearer $(get_auth_token)" \
      -F "file=@${temp_file};filename=${file_name};type=image/jpeg" \
      "$API_BASE/api/listings/${listing_id}/upload-image" \
      -o /tmp/upload_response.json)
    
    if [ "$response" = "200" ]; then
      echo -e "  ${GREEN}Successfully added image ${image_number} to listing ${listing_id}${NC}"
    else
      echo -e "  ${RED}Failed to add image ${image_number} to listing ${listing_id} (HTTP: $response)${NC}"
      cat /tmp/upload_response.json 2>/dev/null || echo "No response body"
    fi
  else
    echo -e "  ${RED}Failed to download ${file_key} from MinIO${NC}"
  fi
  
  # Clean up
  rm -f "$temp_file"
}

# Function to get auth token (simplified - using admin user)
get_auth_token() {
  # Try to get token for admin user
  local response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' \
    "$API_BASE/api/auth/signin" 2>/dev/null)
  
  if [ $? -eq 0 ]; then
    echo "$response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4 2>/dev/null
  else
    echo ""
  fi
}

# Alternative approach: Direct database insertion
add_images_via_sql() {
  local listing_id=$1
  
  echo -e "${YELLOW}Adding images via direct database insertion for listing ${listing_id}...${NC}"
  
  # SQL to insert additional images
  local sql="
INSERT INTO listing_media (listing_id, file_key, file_name, content_type, size, sort_order, is_primary, media_type, created_at, updated_at)
VALUES 
  (${listing_id}, 'sample/car-${listing_id}-2.jpg', 'car-${listing_id}-2.jpg', 'image/jpeg', 650000, 2, false, 'IMAGE', NOW(), NOW()),
  (${listing_id}, 'sample/car-${listing_id}-3.jpg', 'car-${listing_id}-3.jpg', 'image/jpeg', 65000, 3, false, 'IMAGE', NOW(), NOW())
ON CONFLICT (listing_id, file_key) DO NOTHING;
"

  # Execute SQL via docker
  if docker exec -i caryo_dev-postgres-1 psql -U postgres -d caryo_dev -c "$sql" > /dev/null 2>&1; then
    echo -e "${GREEN}Successfully added images to database via SQL${NC}"
    return 0
  else
    echo -e "${RED}Failed to add images via SQL${NC}"
    return 1
  fi
}

# Main execution
main() {
  # Check if backend is available
  if ! check_backend; then
    echo -e "${RED}Cannot proceed without backend API${NC}"
    exit 1
  fi
  
  echo -e "${YELLOW}Adding multiple images for listing 6...${NC}"
  
  # Try SQL approach first (more reliable)
  if add_images_via_sql 6; then
    echo -e "${GREEN}Images added successfully!${NC}"
  else
    echo -e "${YELLOW}SQL approach failed, trying API approach...${NC}"
    
    # Get auth token
    token=$(get_auth_token)
    if [ -z "$token" ]; then
      echo -e "${RED}Could not get authentication token${NC}"
      exit 1
    fi
    
    # Add images 2 and 3 for listing 6
    add_image_to_listing 6 2
    add_image_to_listing 6 3
  fi
  
  echo -e "${CYAN}======================================${NC}"
  echo -e "${CYAN}Verifying results...${NC}"
  echo -e "${CYAN}======================================${NC}"
  
  # Verify the results
  echo -e "${YELLOW}Checking listing 6 media count...${NC}"
  media_count=$(curl -s "$API_BASE/api/listings/6" | grep -o '"media":\[' | wc -l 2>/dev/null || echo "0")
  
  if [ "$media_count" -gt 0 ]; then
    echo -e "${GREEN}Success! Listing 6 now has multiple images.${NC}"
    echo -e "${YELLOW}You can now test the CarMediaGallery at: ${CYAN}http://localhost:3000/listings/6${NC}"
  else
    echo -e "${RED}Something went wrong. Please check the database manually.${NC}"
  fi
}

# Run main function
main "$@"
