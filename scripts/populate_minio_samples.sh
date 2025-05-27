#!/bin/bash

# Script to download sample car images and upload them to MinIO

MINIO_ALIAS="autotrader-local"
BUCKET_NAME="autotrader-assets"
TEMP_DIR="temp_sample_images"

# Image URLs (using Unsplash for better reliability)
IMAGE_URL_1="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGNhcnN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60" # Yellow sports car
IMAGE_URL_2="https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Y2Fyc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60" # Black porsche
IMAGE_URL_3="https://images.unsplash.com/photo-1542282088-fe841668c6c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjd8fGNhcnN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60" # Red vintage car

# Create a temporary directory for images
mkdir -p "$TEMP_DIR"
echo "Created temporary directory: $TEMP_DIR"

# Download images
echo "Downloading sample images..."
curl -L -o "$TEMP_DIR/car1.jpg" "$IMAGE_URL_1"
curl -L -o "$TEMP_DIR/car2.jpg" "$IMAGE_URL_2"
curl -L -o "$TEMP_DIR/car3.jpg" "$IMAGE_URL_3"

if [ ! -f "$TEMP_DIR/car1.jpg" ] || [ ! -f "$TEMP_DIR/car2.jpg" ] || [ ! -f "$TEMP_DIR/car3.jpg" ]; then
    echo "Error: Failed to download one or more images."
    rm -rf "$TEMP_DIR"
    exit 1
fi
echo "Sample images downloaded successfully."

# Ensure MinIO bucket exists
mc mb "$MINIO_ALIAS/$BUCKET_NAME" --ignore-existing
echo "Ensured MinIO bucket '$BUCKET_NAME' exists."

# Upload images to MinIO
echo "Uploading images to MinIO..."
mc cp "$TEMP_DIR/car1.jpg" "$MINIO_ALIAS/$BUCKET_NAME/1/main.jpg"
mc cp "$TEMP_DIR/car2.jpg" "$MINIO_ALIAS/$BUCKET_NAME/listings/2/main.jpg"
mc cp "$TEMP_DIR/car3.jpg" "$MINIO_ALIAS/$BUCKET_NAME/listings/3/main.jpg"
echo "Images uploaded to MinIO."

# Set bucket policy to public download
mc anonymous set download "$MINIO_ALIAS/$BUCKET_NAME"
echo "Set bucket '$BUCKET_NAME' policy to public download."

# Clean up temporary directory
rm -rf "$TEMP_DIR"
echo "Cleaned up temporary directory."

echo "Sample images successfully populated in MinIO."
