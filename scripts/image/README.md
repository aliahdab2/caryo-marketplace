# Car Image Management Scripts for Caryo Marketplace

This directory contains scripts for managing car images in the Caryo Marketplace application.

## Essential Scripts

### 1. `fix_car_images.sh`

The main script for adding car images to MinIO storage. This script handles uploading both primary and additional images for car listings.

**Usage:**
```bash
# Add default images (listings 6-10, multiple images for 8)
./scripts/image/fix_car_images.sh

# Add images for specific listings
./scripts/image/fix_car_images.sh --listings 3,5,8

# Add multiple images for all specified listings
./scripts/image/fix_car_images.sh --all-multi

# Get help
./scripts/image/fix_car_images.sh --help
```

### 2. `post_rebuild.sh`

A helper script to run after rebuilding the development environment. This script restores all car images and performs any other necessary post-rebuild tasks.

**Usage:**
```bash
# After running ./autotrader.sh dev rebuild:
./scripts/post_rebuild.sh
```

The script will:
1. Check if MinIO is available
2. Check if the Backend API is available
3. Restore all car images
4. Provide a success message when complete

### 3. `ensure-minio-bucket.sh`

A utility script to ensure the MinIO bucket exists and has the correct permissions.

**Usage:**
```bash
# Ensure the MinIO bucket exists
./scripts/image/ensure-minio-bucket.sh
```

## Image Paths

Car images are stored in MinIO at the following paths:

- Primary image: `/autotrader-assets/sample/car-{listingId}-1.jpg`
- Additional images: `/autotrader-assets/sample/car-{listingId}-2.jpg`, `/autotrader-assets/sample/car-{listingId}-3.jpg`, etc.

## After a Rebuild

After running `./autotrader.sh dev rebuild`, the MinIO data will be reset. To restore the car images:

```bash
./scripts/post_rebuild.sh
```

The script automatically:
- Waits for services to be available
- Restores all car images
- Confirms when the process is complete

## Adding New Car Images

To add images for a new car listing:

1. Edit the `fix_car_images.sh` script to add URLs for the new listing
2. Run the script with the new listing ID:
   ```bash
   ./scripts/image/fix_car_images.sh --listings <new-listing-id>
   ```
