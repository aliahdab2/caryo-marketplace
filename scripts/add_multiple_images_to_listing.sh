#!/bin/bash

# Script to add multiple images to a specific listing
set -e

# Configuration
LISTING_ID=${1:-4}  # Default to listing 4 if no argument provided
TEMP_DIR="temp_multiple_images"

echo "Adding multiple images to listing $LISTING_ID..."

# Create temporary directory
mkdir -p "$TEMP_DIR"
echo "Created temporary directory: $TEMP_DIR"

# Array of different car image URLs for the same listing
declare -a ADDITIONAL_IMAGES=(
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&crop=center&auto=format&q=80"  # BMW front
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=600&fit=crop&crop=center&auto=format&q=80"  # BMW side
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop&crop=center&auto=format&q=80"  # BMW interior
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&crop=center&auto=format&q=80"  # BMW back
    "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop&crop=center&auto=format&q=80"  # BMW engine
)

# Download additional images
echo "Downloading additional images for listing $LISTING_ID..."
for i in "${!ADDITIONAL_IMAGES[@]}"; do
    image_number=$((i + 2))  # Start from image 2 (since main.jpg is image 1)
    echo "Downloading image $image_number for listing $LISTING_ID..."
    curl -L "${ADDITIONAL_IMAGES[$i]}" -o "$TEMP_DIR/car-${LISTING_ID}-${image_number}.jpg" -s --fail || echo "Failed to download image $image_number, skipping..."
done

echo "Additional images downloaded successfully."

# Check if MinIO client is available
if ! command -v mc &> /dev/null; then
    echo "Error: MinIO client (mc) is not installed or not in PATH."
    echo "Please install it first: brew install minio/stable/mc"
    exit 1
fi

# Ensure bucket exists and is accessible
echo "Ensuring MinIO bucket 'autotrader-assets' exists..."
mc mb autotrader-local/autotrader-assets --ignore-existing
echo "MinIO bucket 'autotrader-assets' is ready."

# Upload additional images to MinIO
echo "Uploading additional images to MinIO for listing $LISTING_ID..."
for i in "${!ADDITIONAL_IMAGES[@]}"; do
    image_number=$((i + 2))
    file_path="$TEMP_DIR/car-${LISTING_ID}-${image_number}.jpg"
    
    if [ -f "$file_path" ] && [ -s "$file_path" ]; then
        echo "Uploading image $image_number for listing $LISTING_ID..."
        # Upload to both the sample directory (for API compatibility) and listings directory
        mc cp "$file_path" "autotrader-local/autotrader-assets/sample/car-${LISTING_ID}-${image_number}.jpg"
        mc cp "$file_path" "autotrader-local/autotrader-assets/listings/${LISTING_ID}/image-${image_number}.jpg"
    else
        echo "Skipping empty or missing image $image_number"
    fi
done

# Set bucket policy to public download
echo "Setting bucket policy to public download..."
mc anonymous set download autotrader-local/autotrader-assets
echo "Bucket 'autotrader-assets' policy set to public download."

# Clean up
echo "Cleaning up temporary directory..."
rm -rf "$TEMP_DIR"

echo "Additional images successfully added to listing $LISTING_ID!"

# List all uploaded files for this listing
echo "Current files for listing $LISTING_ID:"
mc ls autotrader-local/autotrader-assets/sample/ | grep "car-${LISTING_ID}-"
mc ls autotrader-local/autotrader-assets/listings/${LISTING_ID}/ 2>/dev/null || echo "No files in listings/${LISTING_ID}/ directory"

echo ""
echo "To insert these images into the database, you'll need to run SQL commands or use the backend API."
echo "The images are available at URLs like:"
echo "http://localhost:9000/autotrader-assets/sample/car-${LISTING_ID}-2.jpg"
echo "http://localhost:9000/autotrader-assets/sample/car-${LISTING_ID}-3.jpg"
echo "etc."
