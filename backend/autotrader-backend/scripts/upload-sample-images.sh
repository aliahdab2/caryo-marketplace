#!/bin/bash

# Script to upload sample car images to MinIO for dev environment
# This script assumes MinIO is running via docker-compose

# Define variables
MINIO_ALIAS="devminio"
MINIO_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="autotrader-assets"
TEMP_DIR="/tmp/sample_car_images"

# Create temp directory for sample images
mkdir -p $TEMP_DIR

echo "📥 Downloading sample car images..."
# Download sample static car images (reliable sources with direct JPG files)
curl -s https://images.unsplash.com/photo-1494976388531-d1058494cdd8 -o $TEMP_DIR/car1.jpg
curl -s https://images.unsplash.com/photo-1583121274602-3e2820c69888 -o $TEMP_DIR/car2.jpg
curl -s https://images.unsplash.com/photo-1555215695-3004980ad54e -o $TEMP_DIR/car3.jpg

# Validate downloaded images
for i in 1 2 3; do
  if [ ! -s "$TEMP_DIR/car$i.jpg" ]; then
    echo "❌ Failed to download car$i.jpg. Using a backup method..."
    curl -s -L -o $TEMP_DIR/car$i.jpg "https://picsum.photos/800/600?random=$i"
  fi
  
  # Verify image file validity
  file_type=$(file -b --mime-type $TEMP_DIR/car$i.jpg)
  if [[ $file_type != image/* ]]; then
    echo "❌ Downloaded file car$i.jpg is not a valid image. Using a backup image..."
    cp $(dirname "$0")/default_car.jpg $TEMP_DIR/car$i.jpg 2>/dev/null || curl -s -L -o $TEMP_DIR/car$i.jpg "https://via.placeholder.com/800x600.jpg?text=Car+$i"
  fi
done

echo "🔧 Setting up MinIO client..."
# Check if mc is installed
if ! command -v mc &> /dev/null; then
    echo "❌ MinIO client (mc) not found. Please install it first."
    echo "   Visit https://min.io/docs/minio/linux/reference/minio-mc.html for installation instructions."
    exit 1
fi

# Set up MinIO client 
echo "Configuring MinIO client with endpoint: $MINIO_ENDPOINT"
mc alias set $MINIO_ALIAS $MINIO_ENDPOINT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY

# Test connection
if ! mc admin info $MINIO_ALIAS &> /dev/null; then
    echo "❌ Cannot connect to MinIO server at $MINIO_ENDPOINT"
    echo "Is MinIO running? Check with 'docker ps | grep minio'"
    echo "Attempting to connect to docker container directly..."
    
    # Try to use docker internal endpoint if running in the same network
    MINIO_CONTAINER=$(docker ps | grep minio | awk '{print $1}')
    if [ ! -z "$MINIO_CONTAINER" ]; then
        echo "Found MinIO container: $MINIO_CONTAINER"
        MINIO_ENDPOINT="http://minio:9000"
        echo "Trying internal Docker network endpoint: $MINIO_ENDPOINT"
        mc alias set $MINIO_ALIAS $MINIO_ENDPOINT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY
    else
        echo "No MinIO container found running."
        exit 1
    fi
fi

echo "🔍 Checking if bucket exists..."
# Ensure bucket exists
if ! mc ls $MINIO_ALIAS/$MINIO_BUCKET &> /dev/null; then
    echo "Creating bucket: $MINIO_BUCKET"
    mc mb $MINIO_ALIAS/$MINIO_BUCKET
    # Set bucket policy to public (for dev environment)
    echo "Setting bucket policy to public-read for development purposes"
    mc policy set public $MINIO_ALIAS/$MINIO_BUCKET
fi

echo "📤 Uploading images to MinIO..."
# Create directories if they don't exist
for i in 1 2 3; do
    mc mkdir -p $MINIO_ALIAS/$MINIO_BUCKET/listings/$i/ &> /dev/null
done

# Upload images with proper content type
mc cp --attr "Content-Type=image/jpeg" $TEMP_DIR/car1.jpg $MINIO_ALIAS/$MINIO_BUCKET/listings/1/main.jpg
echo "✅ Uploaded image for listing 1"

mc cp --attr "Content-Type=image/jpeg" $TEMP_DIR/car2.jpg $MINIO_ALIAS/$MINIO_BUCKET/listings/2/main.jpg
echo "✅ Uploaded image for listing 2"

mc cp --attr "Content-Type=image/jpeg" $TEMP_DIR/car3.jpg $MINIO_ALIAS/$MINIO_BUCKET/listings/3/main.jpg
echo "✅ Uploaded image for listing 3"

# Verify uploads
echo "🔍 Verifying uploads..."
for i in 1 2 3; do
    if mc stat $MINIO_ALIAS/$MINIO_BUCKET/listings/$i/main.jpg &> /dev/null; then
        echo "✅ Verified listing $i image exists"
    else
        echo "❌ Failed to verify listing $i image"
    fi
done

# Clean up temp files
echo "🧹 Cleaning up temporary files..."
rm -rf $TEMP_DIR

# Generate public URLs
echo "📋 Image URLs for testing:"
for i in 1 2 3; do
    URL=$(mc share download $MINIO_ALIAS/$MINIO_BUCKET/listings/$i/main.jpg --expire=8760h | grep -o "http.*")
    echo "Listing $i image: $URL"
done

echo ""
echo "✅ All done! Images uploaded to MinIO bucket: $MINIO_BUCKET"
echo "Image paths:"
echo "- listings/1/main.jpg"
echo "- listings/2/main.jpg"
echo "- listings/3/main.jpg"
echo ""
echo "🔎 Debugging tips if images still aren't visible:"
echo "1. Check application logs for S3/MinIO related errors"
echo "2. Verify S3 client configuration in application.properties"
echo "3. Ensure the application has permissions to access the MinIO bucket"
echo "4. Try accessing the MinIO Web UI at http://localhost:9001 to verify uploads"
