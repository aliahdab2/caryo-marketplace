#!/bin/bash

# Script to fix the API paths in Postman collections
# This script updates URL paths in the Postman collection to match
# actual API endpoints as configured in Spring Boot

echo "Fixing API paths in Postman collection..."

COLLECTION_FILE="$(pwd)/../../backend/autotrader-backend/src/test/resources/postman/autotrader-api-collection.json"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed. Please install jq to run this script."
    exit 1
fi

# Create a backup
cp "$COLLECTION_FILE" "${COLLECTION_FILE}.bak"

# Examine the URL structure in the collection
echo "Current URL structures in collection:"
jq -r '.item[].item[].request.url.raw' "$COLLECTION_FILE" 2>/dev/null | sort | uniq

# Extract the baseUrl placeholder
BASE_URL=$(jq -r '.item[0].item[0].request.url.host[0]' "$COLLECTION_FILE")
echo "Base URL placeholder: $BASE_URL"

# Improve the path handling - fix inconsistent paths
# This addresses the issue where some paths use /api/auth/signup while
# the Spring Boot controller might be mapped to just /auth/signup
TMP_FILE=$(mktemp)
jq '
  # Function to fix paths - ensure consistency
  def fix_path(p):
    # Specific rules can be added here based on Spring Boot controller mappings
    if (p | contains([["auth", "signup"]])) then
      ["auth", "signup"]
    elif (p | contains([["auth", "signin"]])) then
      ["auth", "signin"]
    elif (p | contains([["api", "auth", "signup"]])) then
      ["auth", "signup"]
    elif (p | contains([["api", "auth", "signin"]])) then
      ["auth", "signin"]
    elif (p | contains([["api", "reference-data"]])) then
      ["api", "reference-data"]
    else
      p
    end;

  # Apply the fix to all requests
  walk(
    if type == "object" and .request and .request.url and .request.url.path then
      .request.url.path = fix_path(.request.url.path) | .
    else
      .
    end
  )
' "$COLLECTION_FILE" > "$TMP_FILE" && mv "$TMP_FILE" "$COLLECTION_FILE"

# Update raw URLs to match the fixed paths
TMP_FILE=$(mktemp)
jq '
  walk(
    if type == "object" and .request and .request.url and .request.url.path and .request.url.raw then
      .request.url.raw = (.request.url.host[0] + "/" + (.request.url.path | join("/"))) | .
    else
      .
    end
  )
' "$COLLECTION_FILE" > "$TMP_FILE" && mv "$TMP_FILE" "$COLLECTION_FILE"

echo "Updated URL structures:"
jq -r '.item[].item[].request.url.raw' "$COLLECTION_FILE" 2>/dev/null | sort | uniq

echo "Collection updated successfully. Backup saved as ${COLLECTION_FILE}.bak"
