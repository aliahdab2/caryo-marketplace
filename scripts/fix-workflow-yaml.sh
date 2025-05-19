#!/bin/bash
# Script to fix YAML linting issues in GitHub Actions workflow files

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directory containing workflow files
WORKFLOWS_DIR="./.github/workflows"
REUSABLE_DIR="$WORKFLOWS_DIR/reusable"

# Special fix for the problematic Postman tests workflow file
fix_postman_workflow() {
  local file="$WORKFLOWS_DIR/postman-tests.yml"
  local backup="$WORKFLOWS_DIR/postman-tests.yml.bak"
  local clean_file="$WORKFLOWS_DIR/postman-tests-clean.yml"
  
  if [ -f "$file" ]; then
    echo -e "${YELLOW}Fixing Postman workflow file with severe YAML issues...${NC}"
    
    # Create backup of original file if it doesn't exist
    if [ ! -f "$backup" ]; then
      echo "Creating backup of original file..."
      cp "$file" "$backup"
    fi
    
    # Check if our clean version exists
    if [ -f "$clean_file" ]; then
      echo "Using clean template version..."
      cp "$clean_file" "$file"
      echo -e "${GREEN}Successfully replaced problematic workflow with clean version!${NC}"
    else
      echo -e "${RED}Clean template file not found: $clean_file${NC}"
      echo "Falling back to standard whitespace fixes"
      fix_trailing_whitespace "$file"
    fi
  else
    echo -e "${RED}Postman workflow file not found: $file${NC}"
  fi
}

# Function to remove trailing whitespace from a file
fix_trailing_whitespace() {
  local file="$1"
  echo -e "${YELLOW}Fixing trailing whitespace in $file...${NC}"
  
  # Create a temporary file
  local tmpfile=$(mktemp)
  
  # Remove trailing whitespace using sed
  sed 's/[ \t]*$//' "$file" > "$tmpfile"
  
  # Replace original file with the fixed version
  mv "$tmpfile" "$file"
  
  echo -e "${GREEN}Fixed trailing whitespace in $file${NC}"
}

# Function to check if yamllint is installed
check_yamllint() {
  if ! command -v yamllint &> /dev/null; then
    echo -e "${YELLOW}Warning: yamllint is not installed. Cannot validate YAML syntax.${NC}"
    echo "Install with: pip install yamllint"
    return 1
  fi
  return 0
}

# Fix the problematic Postman workflow first
fix_postman_workflow

# Fix all reusable workflow files
echo -e "${YELLOW}Fixing reusable workflow files...${NC}"
for file in "$REUSABLE_DIR"/*.yml; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    fix_trailing_whitespace "$file"
  fi
done

# Fix main workflow files
echo -e "${YELLOW}Fixing main workflow files...${NC}"
for file in "$WORKFLOWS_DIR"/*.yml; do
  if [ -f "$file" ] && [[ "$file" != *"postman-tests.yml"* ]]; then
    echo "Processing $file..."
    fix_trailing_whitespace "$file"
  fi
done

# Validate all files if yamllint is available
if check_yamllint; then
  echo -e "${YELLOW}Validating YAML syntax...${NC}"
  
  echo -e "${YELLOW}Reusable workflows:${NC}"
  for file in "$REUSABLE_DIR"/*.yml; do
    if [ -f "$file" ]; then
      echo "Validating $file..."
      yamllint -d "{extends: relaxed, rules: {line-length: {max: 120}}}" "$file"
    fi
  done
  
  echo -e "${YELLOW}Main workflows:${NC}"
  for file in "$WORKFLOWS_DIR"/*.yml; do
    if [ -f "$file" ] && [[ ! "$file" =~ "tmp-test" ]]; then
      echo "Validating $file..."
      yamllint -d "{extends: relaxed, rules: {line-length: {max: 120}}}" "$file"
    fi
  done
fi

echo -e "${GREEN}All workflow files processed!${NC}"
