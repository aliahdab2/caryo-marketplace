#!/bin/bash
#
# Test Assets Preparation Script
#
# This script creates test assets needed for API testing,
# including image and PDF files for upload testing.
#
# Usage: ./prepare-test-assets.sh [--help]
#

# Set up script environment
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
UTILS_DIR="$PROJECT_ROOT/scripts/utils"

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

# Create directory for test assets if it doesn't exist
ASSETS_DIR="$PROJECT_ROOT/src/test/resources/postman/assets"

# Main function to prepare test assets
prepare_test_assets() {
  print_header "Preparing Test Assets"
  
  print_info "Creating directory for test assets..."
  mkdir -p "$ASSETS_DIR"
  
  print_info "Creating test image for car listing..."
  # Create a simple test JPEG image (1x1 pixel, minimum valid JPEG)
  echo -n -e '\xff\xd8\xff\xe0\x00\x10\x4a\x46\x49\x46\x00\x01\x01\x01\x00\x48\x00\x48\x00\x00\xff\xdb\x00\x43\x00\x03\x02\x02\x03\x02\x02\x03\x03\x03\x03\x04\x03\x03\x04\x05\x08\x05\x05\x04\x04\x05\x0a\x07\x07\x06\x08\x0c\x0a\x0c\x0c\x0b\x0a\x0b\x0b\x0d\x0e\x12\x10\x0d\x0e\x11\x0e\x0b\x0b\x10\x16\x10\x11\x13\x14\x15\x15\x15\x0c\x0f\x17\x18\x16\x14\x18\x12\x14\x15\x14\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x09\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x08\x01\x01\x00\x00\x3f\x00\xd2\xcf\x20\xff\xd9' > "$ASSETS_DIR/test-car.jpg"
  
  print_info "Creating test PDF file..."
  # Create a simple PDF file
  echo '%PDF-1.1
1 0 obj
<< /Type /Catalog
/Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages
/Kids [3 0 R]
/Count 1 >>
endobj
3 0 obj
<< /Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources << >>
/Contents 4 0 R >>
endobj
4 0 obj
<< /Length 41 >>
stream
BT
/F1 24 Tf
100 700 Td
(Test PDF File) Tj
ET
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF' > "$ASSETS_DIR/test-file.pdf"
  
  # Create additional test data if needed
  print_info "Creating test JSON data file..."
  echo '{
  "car": {
    "make": "Test Make",
    "model": "Test Model",
    "year": 2023,
    "price": 25000,
    "description": "This is a test car listing"
  }
}' > "$ASSETS_DIR/test-data.json"

  print_success "Test assets created in $ASSETS_DIR"
  print_info "Asset files:"
  ls -la "$ASSETS_DIR"
  
  print_info "Now update your Postman collection to use these files:"
  print_info "- For car listing image test: Select '$ASSETS_DIR/test-car.jpg'"
  print_info "- For file upload test: Select '$ASSETS_DIR/test-file.pdf'"
  print_info "- For JSON data test: Select '$ASSETS_DIR/test-data.json'"
}

# Show usage information
show_usage() {
  echo "Usage: $(basename "$0") [--help]"
  echo "  --help  Show this help message"
}

# Entry point
main() {
  # No need for environment checks for this script as it doesn't interact with running services
  prepare_test_assets
}

# Execute the entry point
main
