#!/bin/bash

# restore_all_car_images.sh
#
# A comprehensive script to upload all car images to MinIO for Caryo Marketplace
# This script consolidates the functionality of various image upload scripts into one
#
# Usage: 
#   ./restore_all_car_images.sh              # Restore all default images
#   ./restore_all_car_images.sh --listings 3,5,8  # Restore images for specific listings
#   ./restore_all_car_images.sh --all-multi  # Restore all and add multiple images for all listings

set -e

# Configuration
MINIO_ALIAS="autotrader-local"
BUCKET_NAME="autotrader-assets"
TEMP_DIR="temp_car_images"
DEFAULT_LISTINGS=(6 7 8 9 10)  # Default listings to add primary images
DEFAULT_MULTI_LISTINGS=(8)     # Default listings to add multiple images (Honda Civic is 8)

# Parse command line arguments
SPECIFIC_LISTINGS=()
ALL_MULTI=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --listings)
      IFS=',' read -ra SPECIFIC_LISTINGS <<< "$2"
      shift 2
      ;;
    --all-multi)
      ALL_MULTI=true
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --listings LIST    Comma-separated list of listing IDs (e.g., '3,5,8')"
      echo "  --all-multi        Add multiple images for all listings"
      echo "  --help             Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information."
      exit 1
      ;;
  esac
done

# Create temporary directory
mkdir -p "$TEMP_DIR"
echo "Created temporary directory: $TEMP_DIR"

# Check if MinIO client is available
if ! command -v mc &> /dev/null; then
    echo "Error: MinIO client (mc) is not installed or not in PATH."
    echo "Please install it first: brew install minio/stable/mc"
    exit 1
fi

# Setup MinIO alias if it doesn't exist
mc alias list | grep -q "$MINIO_ALIAS" || {
    echo "Setting up MinIO alias..."
    mc alias set "$MINIO_ALIAS" http://localhost:9000 minioadmin minioadmin
}

# Ensure bucket exists and is accessible
echo "Ensuring MinIO bucket '$BUCKET_NAME' exists..."
mc mb "$MINIO_ALIAS/$BUCKET_NAME" --ignore-existing
echo "MinIO bucket '$BUCKET_NAME' is ready."

# Get primary image URL for a listing
get_primary_image() {
  local listing_id=$1
  case $listing_id in
    6) echo "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGNhcnN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60" ;; # Yellow sports car
    7) echo "https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Y2Fyc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60" ;; # Black porsche
    8) echo "https://images.unsplash.com/photo-1580273916550-e323be2ae537?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60" ;; # Red Honda Civic
    9) echo "https://images.unsplash.com/photo-1583121274602-3e2820c69888?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60" ;; # Blue coupe
    10) echo "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60" ;; # Red muscle car
    1) echo "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop&crop=center&auto=format&q=80" ;; # Luxury sedan
    2) echo "https://images.unsplash.com/photo-1539788816080-8bdd722d8c22?w=800&h=600&fit=crop&crop=center&auto=format&q=80" ;; # Luxury sedan side
    3) echo "https://images.unsplash.com/photo-1592853625511-cc6b7f23a5a2?w=800&h=600&fit=crop&crop=center&auto=format&q=80" ;; # Luxury sedan rear
    4) echo "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&h=600&fit=crop&crop=center&auto=format&q=80" ;; # SUV front
    5) echo "https://images.unsplash.com/photo-1569171206684-dfb2749d96fd?w=800&h=600&fit=crop&crop=center&auto=format&q=80" ;; # SUV side
    *) echo "" ;; # Return empty for undefined listings
  esac
}

# Get additional image URL for a listing
get_additional_image() {
  local listing_id=$1
  local image_number=$2
  
  case $listing_id in
    8) # Honda Civic
      case $image_number in
        2) echo "https://images.unsplash.com/photo-1590362891991-f776e747a588?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8aG9uZGElMjBjaXZpY3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60" ;; # Honda Civic - side view
        3) echo "https://images.unsplash.com/photo-1600259828526-77f8617ceec9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGhvbmRhJTIwY2l2aWN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60" ;; # Honda Civic - rear view
        4) echo "https://images.unsplash.com/photo-1583267746897-2cf4efdc67aa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60" ;; # Car interior (generic)
        *) echo "" ;;
      esac
      ;;
    1|2|3) # Luxury sedan
      case $image_number in
        2) echo "https://images.unsplash.com/photo-1539788816080-8bdd722d8c22?w=800&h=600&fit=crop&crop=center&auto=format&q=80" ;; # Luxury sedan side
        3) echo "https://images.unsplash.com/photo-1592853625511-cc6b7f23a5a2?w=800&h=600&fit=crop&crop=center&auto=format&q=80" ;; # Luxury sedan rear
        4) echo "https://images.unsplash.com/photo-1508693926297-1d61f13e1dc9?w=800&h=600&fit=crop&crop=center&auto=format&q=80" ;; # Luxury sedan interior
        *) echo "" ;;
      esac
      ;;
    4|5) # SUV
      case $image_number in
        2) echo "https://images.unsplash.com/photo-1569171206684-dfb2749d96fd?w=800&h=600&fit=crop&crop=center&auto=format&q=80" ;; # SUV side
        3) echo "https://images.unsplash.com/photo-1532581140115-3e355d1ed1de?w=800&h=600&fit=crop&crop=center&auto=format&q=80" ;; # SUV rear
        4) echo "https://images.unsplash.com/photo-1635310568932-49859d8f7ef4?w=800&h=600&fit=crop&crop=center&auto=format&q=80" ;; # SUV interior
        *) echo "" ;;
      esac
      ;;
    6|7) # Sports car
      case $image_number in
        2) echo "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=800&h=600&fit=crop&crop=center&auto=format&q=80" ;; # Sports car side
        3) echo "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=600&fit=crop&crop=center&auto=format&q=80" ;; # Sports car angle
        4) echo "https://images.unsplash.com/photo-1544381471-989278cb0432?w=800&h=600&fit=crop&crop=center&auto=format&q=80" ;; # Sports car interior
        *) echo "" ;;
      esac
      ;;
    *) echo "" ;;
  esac
}

# Get the number of additional images available for a listing
get_additional_image_count() {
  local listing_id=$1
  
  case $listing_id in
    1|2|3|4|5|6|7|8) echo 3 ;; # 3 additional images (images 2, 3, 4)
    *) echo 0 ;; # No additional images
  esac
}

# Determine which listings to process
LISTINGS_TO_PROCESS=()

if [ ${#SPECIFIC_LISTINGS[@]} -gt 0 ]; then
  # Use specific listings if provided
  LISTINGS_TO_PROCESS=("${SPECIFIC_LISTINGS[@]}")
else
  # Otherwise use default listings
  LISTINGS_TO_PROCESS=("${DEFAULT_LISTINGS[@]}")
fi

# Process primary images (first image for each listing)
echo "=== Uploading primary images for listings: ${LISTINGS_TO_PROCESS[*]} ==="

for listing_id in "${LISTINGS_TO_PROCESS[@]}"; do
  image_url=$(get_primary_image "$listing_id")
  if [[ -n "$image_url" ]]; then
    echo "Downloading primary image for listing $listing_id..."
    output_file="$TEMP_DIR/car-${listing_id}-1.jpg"
    curl -L "$image_url" -o "$output_file" -s --fail || {
      echo "Failed to download primary image for listing $listing_id, skipping..."
      continue
    }
    
    echo "Uploading primary image for listing $listing_id..."
    mc cp "$output_file" "$MINIO_ALIAS/$BUCKET_NAME/sample/car-${listing_id}-1.jpg"
  else
    echo "No primary image defined for listing $listing_id, skipping..."
  fi
done

# Determine which listings should have multiple images
MULTI_LISTINGS=()

if [ "$ALL_MULTI" = true ]; then
  # Add multiple images for all processed listings
  MULTI_LISTINGS=("${LISTINGS_TO_PROCESS[@]}")
else
  # Only add multiple images for default multi listings or if specified
  if [ ${#SPECIFIC_LISTINGS[@]} -gt 0 ]; then
    MULTI_LISTINGS=("${SPECIFIC_LISTINGS[@]}")
  else
    MULTI_LISTINGS=("${DEFAULT_MULTI_LISTINGS[@]}")
  fi
fi

# Process additional images for specified listings
echo ""
echo "=== Uploading additional images for listings: ${MULTI_LISTINGS[*]} ==="

for listing_id in "${MULTI_LISTINGS[@]}"; do
  # Get the number of additional images for this listing
  image_count=$(get_additional_image_count "$listing_id")
  
  if [ "$image_count" -gt 0 ]; then
    echo "Uploading $image_count additional images for listing $listing_id..."
    
    for ((i=2; i<=$((image_count+1)); i++)); do
      image_url=$(get_additional_image "$listing_id" "$i")
      
      if [[ -n "$image_url" ]]; then
        echo "Downloading image $i for listing $listing_id..."
        output_file="$TEMP_DIR/car-${listing_id}-${i}.jpg"
        
        curl -L "$image_url" -o "$output_file" -s --fail || {
          echo "Failed to download image $i for listing $listing_id, skipping..."
          continue
        }
        
        echo "Uploading image $i for listing $listing_id..."
        mc cp "$output_file" "$MINIO_ALIAS/$BUCKET_NAME/sample/car-${listing_id}-${i}.jpg"
      else
        echo "No image URL for image $i of listing $listing_id, skipping..."
      fi
    done
  else
    echo "No additional images defined for listing $listing_id, skipping..."
  fi
done

# Set bucket policy to public download
echo ""
echo "Setting bucket policy to public download..."
mc anonymous set download "$MINIO_ALIAS/$BUCKET_NAME"
echo "Bucket '$BUCKET_NAME' policy set to public download."

# Clean up
echo "Cleaning up temporary directory..."
rm -rf "$TEMP_DIR"

# List all uploaded files by listing
echo ""
echo "=== Summary of uploaded images ==="
for listing_id in "${LISTINGS_TO_PROCESS[@]}"; do
  echo "Listing $listing_id:"
  mc ls "$MINIO_ALIAS/$BUCKET_NAME/sample/" | grep "car-${listing_id}-" || echo "  No images found"
done

echo ""
echo "Image restoration complete! Images are available at URLs like:"
echo "http://localhost:9000/autotrader-assets/sample/car-{listing_id}-{image_number}.jpg"
echo ""
echo "Examples:"
echo "  Primary image for listing 8 (Honda Civic): http://localhost:9000/autotrader-assets/sample/car-8-1.jpg"
echo "  Second image for listing 8: http://localhost:9000/autotrader-assets/sample/car-8-2.jpg"
