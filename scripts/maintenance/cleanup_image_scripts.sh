#!/bin/bash

# cleanup_image_scripts.sh
#
# This script cleans up redundant car image scripts, keeping only the essential ones.
#
# Usage: ./cleanup_image_scripts.sh

set -e

echo "Cleaning up redundant car image scripts..."

# Scripts to keep
KEEP_SCRIPTS=(
  "fix_car_images.sh"      # Main script for adding all car images
  "post_rebuild.sh"        # Helper script for post-rebuild tasks
  "ensure-minio-bucket.sh" # Utility for ensuring MinIO bucket exists
)

# Scripts to remove (add more if needed)
REMOVE_SCRIPTS=(
  "add_multiple_images_to_listing.sh"
  "add_honda_civic_images.sh"
  "add_more_sample_images.sh"
  "add_different_car_images.sh"
  "add_car_images_with_mc.sh"
  "restore_all_car_images.sh"
  "fix_car8_image.sh"
  "populate_minio_samples.sh"
)

# Create backup directory
BACKUP_DIR="scripts/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Created backup directory: $BACKUP_DIR"

# Move scripts to backup directory
for script in "${REMOVE_SCRIPTS[@]}"; do
  if [ -f "scripts/$script" ]; then
    echo "Moving $script to backup..."
    cp "scripts/$script" "$BACKUP_DIR/"
    rm "scripts/$script"
  else
    echo "Script $script not found, skipping..."
  fi
done

echo ""
echo "=============================================="
echo "Cleanup complete!"
echo "=============================================="
echo ""
echo "The following scripts have been kept:"
for script in "${KEEP_SCRIPTS[@]}"; do
  echo "  - $script"
done
echo ""
echo "The following scripts have been backed up to $BACKUP_DIR and removed:"
for script in "${REMOVE_SCRIPTS[@]}"; do
  if [ -f "$BACKUP_DIR/$script" ]; then
    echo "  - $script"
  fi
done
echo ""
echo "To restore a script if needed, copy it back from the backup directory."
