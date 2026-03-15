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

# Function to add images via SQL (most reliable approach)
add_images_via_sql() {
  local listing_id=$1
  
  echo -e "${YELLOW}Adding images via direct database insertion for listing ${listing_id}...${NC}"
  
  # SQL to insert additional images
  local sql="
INSERT INTO listing_media (listing_id, file_key, file_name, content_type, size, sort_order, is_primary, media_type)
VALUES 
  (${listing_id}, 'sample/car-${listing_id}-2.jpg', 'car-${listing_id}-2.jpg', 'image/jpeg', 650000, 2, false, 'IMAGE'),
  (${listing_id}, 'sample/car-${listing_id}-3.jpg', 'car-${listing_id}-3.jpg', 'image/jpeg', 65000, 3, false, 'IMAGE');
"

  echo -e "${YELLOW}Executing SQL to add images...${NC}"
  
  # Execute SQL via docker
  if docker exec -i caryo_dev-postgres-1 psql -U postgres -d caryo -c "$sql"; then
    echo -e "${GREEN}Successfully added images to database via SQL${NC}"
    return 0
  else
    echo -e "${RED}Failed to add images via SQL${NC}"
    return 1
  fi
}

# Function to verify results
verify_results() {
  local listing_id=$1
  
  echo -e "${CYAN}======================================${NC}"
  echo -e "${CYAN}Verifying results...${NC}"
  echo -e "${CYAN}======================================${NC}"
  
  # Wait a moment for the database to update
  sleep 2
  
  # Check via API
  echo -e "${YELLOW}Checking listing ${listing_id} media via API...${NC}"
  
  local api_response=$(curl -s "http://localhost:8080/api/listings/${listing_id}" 2>/dev/null)
  local media_count=$(echo "$api_response" | grep -o '"id":[0-9]*' | wc -l 2>/dev/null || echo "0")
  
  if [ "$media_count" -gt 1 ]; then
    echo -e "${GREEN}Success! Listing ${listing_id} now has ${media_count} images.${NC}"
    echo -e "${YELLOW}You can now test the CarMediaGallery at: ${CYAN}http://localhost:3000/listings/${listing_id}${NC}"
    
    # Show the media details
    echo -e "${YELLOW}Media details:${NC}"
    echo "$api_response" | grep -A 20 '"media"' | head -30 || echo "Could not parse media details"
    
    return 0
  else
    echo -e "${RED}Issue: Listing ${listing_id} still only has ${media_count} image(s).${NC}"
    return 1
  fi
}

# Main execution
main() {
  echo -e "${YELLOW}Adding multiple images for listing 6...${NC}"
  
  # Add images via SQL
  if add_images_via_sql 6; then
    echo -e "${GREEN}Images added successfully!${NC}"
    
    # Verify the results
    if verify_results 6; then
      echo -e "${GREEN}✅ All done! CarMediaGallery should now work with multiple images.${NC}"
    else
      echo -e "${YELLOW}⚠️  Images were added but verification failed. Try refreshing the page.${NC}"
    fi
  else
    echo -e "${RED}❌ Failed to add images to database${NC}"
    exit 1
  fi
}

# Run main function
main "$@"
