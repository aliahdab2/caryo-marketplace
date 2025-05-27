#!/bin/bash

# Script to add more sample car images to MinIO
set -e

echo "Adding more sample car images to MinIO..."

# Create temporary directory
TEMP_DIR="temp_additional_images"
mkdir -p "$TEMP_DIR"
echo "Created temporary directory: $TEMP_DIR"

# Array of Unsplash car image URLs (different car photos)
declare -a CAR_URLS=(
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&crop=center&auto=format&q=80"  # BMW
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=600&fit=crop&crop=center&auto=format&q=80"  # Porsche
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop&crop=center&auto=format&q=80"  # Mercedes
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&crop=center&auto=format&q=80"  # Audi
    "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop&crop=center&auto=format&q=80"  # Tesla
    "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=600&fit=crop&crop=center&auto=format&q=80"  # Honda
    "https://images.unsplash.com/photo-1549399297-4366d1d51b9d?w=800&h=600&fit=crop&crop=center&auto=format&q=80"  # Toyota
    "https://images.unsplash.com/photo-1485463611174-f302f6a5c1c9?w=800&h=600&fit=crop&crop=center&auto=format&q=80"  # Sports car
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop&crop=center&auto=format&q=80"  # Classic car
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop&crop=center&auto=format&q=80"  # SUV
)

# Download images
echo "Downloading additional sample images..."
for i in "${!CAR_URLS[@]}"; do
    listing_id=$((i + 4))  # Start from listing 4 onwards
    echo "Downloading image for listing $listing_id..."
    curl -L "${CAR_URLS[$i]}" -o "$TEMP_DIR/car${listing_id}.jpg" -s --fail || echo "Failed to download image $listing_id, skipping..."
done

echo "Additional sample images downloaded successfully."

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

# Upload images to MinIO
echo "Uploading additional images to MinIO..."
for i in "${!CAR_URLS[@]}"; do
    listing_id=$((i + 4))
    if [ -f "$TEMP_DIR/car${listing_id}.jpg" ] && [ -s "$TEMP_DIR/car${listing_id}.jpg" ]; then
        echo "Uploading image for listing $listing_id..."
        mc cp "$TEMP_DIR/car${listing_id}.jpg" "autotrader-local/autotrader-assets/listings/${listing_id}/main.jpg"
    else
        echo "Skipping empty or missing image for listing $listing_id"
    fi
done

echo "Additional images uploaded to MinIO."

# Set bucket policy to public download
echo "Setting bucket policy to public download..."
mc anonymous set download autotrader-local/autotrader-assets
echo "Bucket 'autotrader-assets' policy set to public download."

# Clean up
echo "Cleaning up temporary directory..."
rm -rf "$TEMP_DIR"

echo "Additional sample images successfully added to MinIO!"
echo "Images uploaded for listings 4-13 (10 additional images)"

# List all uploaded files
echo "Current files in bucket:"
mc ls autotrader-local/autotrader-assets --recursive
