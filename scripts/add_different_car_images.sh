#!/bin/bash

# Script to add different car images for a listing to test gallery functionality
set -e

# Get listing ID from command line argument or default to 4
LISTING_ID=${1:-4}

echo "Adding different car images for listing $LISTING_ID..."

# Create temporary directory for images
TEMP_DIR="/tmp/car_images"
mkdir -p "$TEMP_DIR"

# Use sample car images from placeholder services
echo "Creating different sample car images..."

# Create simple colored rectangles as different car images for testing
# Using ImageMagick convert command if available, or curl from placeholder services

# Function to create a colored image
create_colored_image() {
    local color=$1
    local filename=$2
    local text=$3
    
    # Use placeholder service for reliable results
    echo "Creating $filename with color $color..."
    curl -s "https://via.placeholder.com/400x300/$color/FFFFFF?text=$text" -o "$TEMP_DIR/$filename"
    
    # Check if file was created successfully
    if [ ! -f "$TEMP_DIR/$filename" ] || [ ! -s "$TEMP_DIR/$filename" ]; then
        echo "Failed to download $filename, creating simple fallback..."
        # Create a simple text file as fallback (not ideal but will work)
        echo "Car Image: $text" > "$TEMP_DIR/$filename.txt"
        mv "$TEMP_DIR/$filename.txt" "$TEMP_DIR/$filename"
    fi
}

# Create different colored images
create_colored_image "FF6B6B" "car-$LISTING_ID-2.jpg" "Front+View"
create_colored_image "4ECDC4" "car-$LISTING_ID-3.jpg" "Side+View"
create_colored_image "45B7D1" "car-$LISTING_ID-4.jpg" "Rear+View"
create_colored_image "96CEB4" "car-$LISTING_ID-5.jpg" "Interior"
create_colored_image "FFEAA7" "car-$LISTING_ID-6.jpg" "Engine"

# Upload to MinIO
MINIO_URL="http://localhost:9000"
BUCKET="autotrader-assets"

echo "Uploading images to MinIO..."

for i in {2..6}; do
    filename="car-$LISTING_ID-$i.jpg"
    if [ -f "$TEMP_DIR/$filename" ]; then
        echo "Uploading $filename..."
        curl -X PUT \
            -H "Content-Type: image/jpeg" \
            --data-binary @"$TEMP_DIR/$filename" \
            "$MINIO_URL/$BUCKET/sample/$filename"
        
        if [ $? -eq 0 ]; then
            echo "✓ Successfully uploaded $filename"
        else
            echo "✗ Failed to upload $filename"
        fi
    else
        echo "✗ Image $filename not found in $TEMP_DIR"
    fi
done

# Clean up
rm -rf "$TEMP_DIR"

echo "Done! Different car images have been uploaded for listing $LISTING_ID."
echo "You can now test the gallery functionality with visually distinct images."
