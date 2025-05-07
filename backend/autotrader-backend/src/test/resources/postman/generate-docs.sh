#!/bin/bash

# Script to generate API documentation from Postman collections
# This will create a markdown file with documentation for all reference data endpoints

# Set variables
POSTMAN_DIR="$(dirname "$0")"
OUTPUT_DIR="../../../docs"
OUTPUT_FILE="$OUTPUT_DIR/generated_reference_data_api.md"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "jq is not installed. Please install it to generate documentation."
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Start generating the documentation
cat > "$OUTPUT_FILE" << EOL
# AutoTrader Marketplace API - Reference Data Endpoints

This documentation is automatically generated from the Postman collections.

Last updated: $(date)

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Reference Data Entities](#reference-data-entities)
   - [Car Conditions](#car-conditions)
   - [Drive Types](#drive-types)
   - [Body Styles](#body-styles)
   - [Fuel Types](#fuel-types)
   - [Transmissions](#transmissions)
   - [Seller Types](#seller-types)

## Overview

The AutoTrader Marketplace API provides endpoints for managing reference data entities. These entities 
are used throughout the system to provide standardized options for vehicle listings.

## Authentication

Most GET endpoints are publicly accessible, while POST, PUT, and DELETE operations require admin authentication.
Authentication is handled via JWT tokens. See the [Authentication](#authentication) section for details.

To use authenticated endpoints:
1. Obtain a JWT token by logging in
2. Include the token in the Authorization header: \`Authorization: Bearer YOUR_TOKEN\`

EOL

# Function to extract endpoint documentation from a collection file
extract_endpoints() {
    local file=$1
    local entity=$2
    local entity_header=$3
    
    echo "Extracting documentation from $file..."
    
    # Add entity header to the documentation
    cat >> "$OUTPUT_FILE" << EOL

## $entity_header

EOL

    # Extract requests from the collection
    jq -r '.item[] | {name: .name, method: .request.method, url: .request.url.raw, description: (.event[] | select(.listen == "test") | .script.exec | join("\n"))}' "$file" | 
    jq -r '. | "### " + .name + "\n\n" + 
             "**Endpoint:** `" + .method + " " + (.url | gsub("\\{\\{baseUrl\\}\\}"; "{baseUrl}")) + "`\n\n" + 
             "**Description:** " + (.name | gsub("\\(Admin\\)"; "") | gsub("Get "; "") | gsub("Create "; "Creates ") | gsub("Update "; "Updates ") | gsub("Delete "; "Deletes ")) + "\n\n" + 
             if (.method == "POST" or .method == "PUT" or .method == "DELETE") then "**Authentication Required:** Yes (Admin)\n\n" else "**Authentication Required:** No\n\n" end +
             if (.method == "POST" or .method == "PUT") then "**Request Body:**\n```json\n{\n    \"name\": \"string\",\n    \"displayNameEn\": \"string\",\n    \"displayNameAr\": \"string\"\n}\n```\n\n" else "" end +
             "**Response:**\n```json\n" + 
             if (.method == "GET") then "[\n    {\n        \"id\": 1,\n        \"name\": \"string\",\n        \"displayNameEn\": \"string\",\n        \"displayNameAr\": \"string\"\n    }\n]" 
             elif (.method == "DELETE") then "" 
             else "{\n    \"id\": 1,\n    \"name\": \"string\",\n    \"displayNameEn\": \"string\",\n    \"displayNameAr\": \"string\"\n}" end +
             "\n```\n"' >> "$OUTPUT_FILE"
}

# Process each collection file
extract_endpoints "$POSTMAN_DIR/collections/car-conditions-tests.json" "car-conditions" "Car Conditions"
extract_endpoints "$POSTMAN_DIR/collections/drive-types-tests.json" "drive-types" "Drive Types"
extract_endpoints "$POSTMAN_DIR/collections/body-styles-tests.json" "body-styles" "Body Styles"
extract_endpoints "$POSTMAN_DIR/collections/fuel-types-tests.json" "fuel-types" "Fuel Types"
extract_endpoints "$POSTMAN_DIR/collections/transmissions-tests.json" "transmissions" "Transmissions"
extract_endpoints "$POSTMAN_DIR/collections/seller-types-tests.json" "seller-types" "Seller Types"

echo "Documentation generated successfully: $OUTPUT_FILE"
