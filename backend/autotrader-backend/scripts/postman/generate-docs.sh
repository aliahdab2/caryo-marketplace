#!/bin/bash
#
# API Documentation Generation Script
#
# This script generates API documentation from Postman collections
# and creates a markdown file with documentation for all endpoints
#
# Usage: ./generate-docs.sh [--output path/to/output/dir] [--help]
#   --output     Specify an output directory (default: ../../docs)
#   --help       Show this help message
#

# Set up script environment
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
# We're in scripts/postman, need to go up two levels to get to project root
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
UTILS_DIR="$PROJECT_ROOT/scripts/utils"

# Debug path info
echo "Script directory: $SCRIPT_DIR"
echo "Project root: $PROJECT_ROOT"

# Fallback utility functions in case template.sh can't be loaded
if [ ! -f "$UTILS_DIR/template.sh" ]; then
    # Colors for output
    GREEN='\033[0;32m'
    RED='\033[0;31m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color
    
    # Print functions
    print_message() { echo -e "${2}${1}${NC}"; }
    print_success() { print_message "✓ $1" "$GREEN"; }
    print_error() { print_message "✗ $1" "$RED"; }
    print_warning() { print_message "! $1" "$YELLOW"; }
    print_info() { print_message "ℹ $1" "$BLUE"; }
    print_header() {
        echo -e "\n${BLUE}======================="
        echo -e "$1"
        echo -e "=======================${NC}\n"
    }
fi

# Source common utilities if available
if [ -f "$UTILS_DIR/template.sh" ]; then
    source "$UTILS_DIR/template.sh"
fi

# Set variables
POSTMAN_DIR="$PROJECT_ROOT/src/test/resources/postman"
# Check if the Postman directory exists
if [ ! -d "$POSTMAN_DIR" ]; then
    print_warning "Postman directory not found at: $POSTMAN_DIR"
    print_info "Trying alternate location..."
    POSTMAN_DIR="/Users/aliahdab/Documents/Dev/ali/autotrader-marketplace/backend/autotrader-backend/src/test/resources/postman"
    if [ ! -d "$POSTMAN_DIR" ]; then
        print_error "Unable to find Postman directory"
        exit 1
    else
        print_success "Found Postman directory at: $POSTMAN_DIR"
    fi
fi
OUTPUT_DIR="$PROJECT_ROOT/docs"
# Make sure docs directory exists at project root
if [ ! -d "$OUTPUT_DIR" ]; then
    print_warning "Creating output directory: $OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR"
fi
OUTPUT_FILE="api_documentation_generated.md"

# Debug paths
echo "POSTMAN_DIR: $POSTMAN_DIR"
echo "OUTPUT_DIR: $OUTPUT_DIR"

# Make sure the output directory exists
mkdir -p "$OUTPUT_DIR"

# Parse script-specific arguments
parse_args() {
  for arg in "$@"; do
    case $arg in
      --output)
        shift
        OUTPUT_DIR="$1"
        shift
        ;;
      --help)
        show_usage
        exit 0
        ;;
      *)
        # Unknown option
        ;;
    esac
  done
}

# Show usage information
show_usage() {
  echo "Usage: $(basename "$0") [--output path/to/output/dir] [--help]"
  echo "  --output    Specify an output directory (default: ../../docs)"
  echo "  --help      Show this help message"
}

# Generate documentation
generate_docs() {
  print_header "Generating API Documentation"
  
  # Check if jq is installed
  if ! command_exists jq; then
    print_error "jq is not installed. Please install it to generate documentation."
    return 1
  fi
  
  # Create output directory if it doesn't exist
  mkdir -p "$OUTPUT_DIR"
  
  # Path to output file
  local output_path="$OUTPUT_DIR/$OUTPUT_FILE"
  
  print_info "Generating documentation to: $output_path"
  
  # Start generating the documentation
  cat > "$output_path" << EOL
# AutoTrader Marketplace API Documentation

This documentation is automatically generated from the Postman collections.

Last updated: $(date)

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Reference Data](#reference-data)
4. [Listings](#listings)
5. [User Management](#user-management)

## Overview

The AutoTrader Marketplace API provides endpoints for managing car listings, user accounts, and reference data.

## Authentication

Authentication is handled using JWT tokens. To authenticate:

1. Register a new user via POST /auth/signup
2. Login via POST /auth/signin to obtain a token
3. Include the token in subsequent requests in the Authorization header: \`Bearer <token>\`

EOL

  # Process each collection
  # Make sure the collections directory exists
  local collections_dir="$POSTMAN_DIR/collections"
  if [ ! -d "$collections_dir" ]; then
    print_warning "Collections directory not found: $collections_dir"
    print_info "Looking in: $POSTMAN_DIR"
    collections_dir="$POSTMAN_DIR"
  fi
  
  print_info "Searching for collections in: $collections_dir"
  local collections=("$collections_dir"/*.json)
  
  if [ ! -f "${collections[0]}" ]; then
    print_warning "No JSON files found in $collections_dir"
    return 1
  fi
  
  for collection in "${collections[@]}"; do
    local collection_name=$(basename "$collection" .json)
    print_info "Processing collection: $collection_name"
    
    # Extract collection info
    if ! jq -r '.info.name' "$collection" &>/dev/null; then
      print_warning "Skipping $collection_name: Invalid format or not a Postman collection"
      continue
    fi
    
    local name=$(jq -r '.info.name' "$collection")
    local description=$(jq -r '.info.description // "No description provided"' "$collection")
    
    # Add collection title
    echo -e "\n## ${name}\n" >> "$output_path"
    echo -e "${description}\n" >> "$output_path"
    
    # Process items in the collection
    jq -c '.item[]' "$collection" 2>/dev/null | while read -r item; do
      local item_name=$(echo "$item" | jq -r '.name')
      echo -e "### ${item_name}\n" >> "$output_path"
      
      # Process requests in the item
      echo "$item" | jq -c '.item[]? // .' | while read -r request_item; do
        if echo "$request_item" | jq -e '.request' >/dev/null; then
          local request_name=$(echo "$request_item" | jq -r '.name')
          local request_method=$(echo "$request_item" | jq -r '.request.method')
          local request_url=$(echo "$request_item" | jq -r '.request.url.raw // .request.url')
          
          echo -e "#### ${request_name}\n" >> "$output_path"
          echo -e "**Method:** \`${request_method}\`\n" >> "$output_path"
          echo -e "**URL:** \`${request_url}\`\n" >> "$output_path"
          
          # Extract request headers
          if echo "$request_item" | jq -e '.request.header' >/dev/null; then
            echo -e "**Headers:**\n" >> "$output_path"
            echo -e "| Header | Value |" >> "$output_path"
            echo -e "|--------|-------|" >> "$output_path"
            
            echo "$request_item" | jq -c '.request.header[]' | while read -r header; do
              local header_key=$(echo "$header" | jq -r '.key')
              local header_value=$(echo "$header" | jq -r '.value')
              echo -e "| ${header_key} | ${header_value} |" >> "$output_path"
            done
            
            echo -e "\n" >> "$output_path"
          fi
          
          # Extract request body if present
          if echo "$request_item" | jq -e '.request.body.raw' >/dev/null; then
            echo -e "**Request Body Example:**\n" >> "$output_path"
            echo -e "\`\`\`json" >> "$output_path"
            echo "$request_item" | jq -r '.request.body.raw' >> "$output_path"
            echo -e "\`\`\`\n" >> "$output_path"
          fi
          
          # Extract response examples if present
          if echo "$request_item" | jq -e '.response[0]' >/dev/null; then
            echo -e "**Response Example:**\n" >> "$output_path"
            
            local resp=$(echo "$request_item" | jq -r '.response[0].code')
            echo -e "Status: ${resp}\n" >> "$output_path"
            
            if echo "$request_item" | jq -e '.response[0].body' >/dev/null; then
              echo -e "\`\`\`json" >> "$output_path"
              echo "$request_item" | jq -r '.response[0].body' >> "$output_path"
              echo -e "\`\`\`\n" >> "$output_path"
            fi
          fi
        fi
      done
    done
  done
  
  print_success "Documentation generated successfully!"
  print_info "Output file: $output_path"
  
  return 0
}

# Main function that will be called after template initialization
main() {
  # Parse arguments
  parse_args "$@"

  # Generate documentation
  generate_docs
}

# Call main function
main "$@"
