#!/bin/bash

# Clean up script to remove original diagnostic scripts after reorganization
# This script removes the old versions of diagnostic scripts from the main scripts directory

echo "🧹 Cleaning up old diagnostic scripts..."

# Path to the root scripts directory
SCRIPTS_DIR="$(dirname "$(dirname "$0")")"

# List of scripts that were moved to diagnostics folder
OLD_SCRIPTS=(
  "$SCRIPTS_DIR/check-api-cors.js"
  "$SCRIPTS_DIR/test-google-oauth-credentials.js"
  "$SCRIPTS_DIR/monitor-auth-session.js"
)

# Check for each old script and remove if present
for script in "${OLD_SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    echo "Removing: $script"
    rm "$script"
  fi
done

echo "✅ Clean up completed"
echo "The diagnostic scripts are now organized in: $SCRIPTS_DIR/diagnostics/"
