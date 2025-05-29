#!/bin/bash
# Script for directly testing reusable GitHub Action workflow components

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Define base directory
WORKFLOWS_DIR="./.github/workflows"
REUSABLE_DIR="$WORKFLOWS_DIR/reusable"

# Function to check if a file exists
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓ File exists: $1${NC}"
    return 0
  else
    echo -e "${RED}✗ File missing: $1${NC}"
    return 1
  fi
}

# Function to validate YAML syntax
validate_yaml() {
  if command -v yamllint &> /dev/null; then
    echo "Validating YAML syntax for $1..."
    yamllint -d "{extends: relaxed, rules: {line-length: {max: 120}}}" "$1"
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✓ YAML syntax is valid${NC}"
      return 0
    else
      echo -e "${RED}✗ YAML syntax has errors${NC}"
      return 1
    fi
  else
    echo -e "${YELLOW}⚠ yamllint not found, skipping YAML validation${NC}"
    echo "Install with: pip install yamllint"
    return 0
  fi
}

# Function to test a reusable workflow file
test_reusable_workflow() {
  local workflow_file="$1"
  local file_name=$(basename "$workflow_file")
  
  echo -e "${YELLOW}========================================${NC}"
  echo -e "${YELLOW}Testing reusable workflow: $file_name${NC}"
  echo -e "${YELLOW}========================================${NC}"
  
  # Check if file exists
  if ! check_file "$workflow_file"; then
    return 1
  fi
  
  # Validate YAML syntax
  validate_yaml "$workflow_file"
  
  # Read the file and extract key information for validation
  echo "Analyzing workflow structure..."
  
  # Check if it's properly defined as a reusable workflow
  if ! grep -q "workflow_call:" "$workflow_file"; then
    echo -e "${RED}✗ Not properly defined as a reusable workflow (missing workflow_call)${NC}"
    return 1
  fi
  
  # Extract input parameters
  echo "Checking input parameters..."
  INPUTS=$(grep -A 50 "inputs:" "$workflow_file" | sed -n '/inputs:/,/jobs:/p' | grep -v "jobs:")
  echo "$INPUTS"
  
  # Extract jobs
  echo "Checking jobs..."
  if ! grep -q "jobs:" "$workflow_file"; then
    echo -e "${RED}✗ No jobs defined in the workflow${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✓ Basic structure validation passed${NC}"
  
  # Perform further checks based on workflow type
  case "$file_name" in
    "gradle-setup.yml")
      echo "Checking Gradle setup specific elements..."
      if ! grep -q "setup-java" "$workflow_file"; then
        echo -e "${RED}✗ Missing setup-java action${NC}"
      else
        echo -e "${GREEN}✓ Found setup-java action${NC}"
      fi
      
      if ! grep -q "gradle-wrapper" "$workflow_file"; then
        echo -e "${YELLOW}⚠ May be missing Gradle wrapper validation${NC}"
      else
        echo -e "${GREEN}✓ Found Gradle wrapper validation${NC}"
      fi
      ;;
      
    "docker-services-setup.yml")
      echo "Checking Docker services setup specific elements..."
      if ! grep -q "compose" "$workflow_file"; then
        echo -e "${RED}✗ May be missing Docker Compose setup${NC}"
      else
        echo -e "${GREEN}✓ Found Docker Compose setup${NC}"
      fi
      ;;
      
    "spring-boot-setup.yml")
      echo "Checking Spring Boot setup specific elements..."
      if ! grep -q "bootRun" "$workflow_file"; then
        echo -e "${RED}✗ Missing bootRun task for Spring Boot${NC}"
      else
        echo -e "${GREEN}✓ Found bootRun task${NC}"
      fi
      ;;
      
    "postman-tests.yml")
      echo "Checking Postman tests specific elements..."
      if ! grep -q "newman" "$workflow_file"; then
        echo -e "${RED}✗ Missing Newman runner for Postman tests${NC}"
      else
        echo -e "${GREEN}✓ Found Newman runner${NC}"
      fi
      ;;
  esac
  
  echo -e "${GREEN}✓ Testing completed for: $file_name${NC}"
  echo ""
}

# Show help if no arguments
if [ $# -eq 0 ]; then
  echo "Usage: $0 [all|gradle|docker|spring-boot|postman]"
  echo "  all         - Test all reusable workflows"
  echo "  gradle      - Test Gradle setup workflow"
  echo "  docker      - Test Docker services setup workflow"
  echo "  spring-boot - Test Spring Boot setup workflow"
  echo "  postman     - Test Postman tests workflow"
  exit 0
fi

# Main execution
case "$1" in
  "all")
    test_reusable_workflow "$REUSABLE_DIR/gradle-setup.yml"
    test_reusable_workflow "$REUSABLE_DIR/docker-services-setup.yml"
    test_reusable_workflow "$REUSABLE_DIR/spring-boot-setup.yml"
    test_reusable_workflow "$REUSABLE_DIR/postman-tests.yml"
    ;;
  "gradle")
    test_reusable_workflow "$REUSABLE_DIR/gradle-setup.yml"
    ;;
  "docker")
    test_reusable_workflow "$REUSABLE_DIR/docker-services-setup.yml"
    ;;
  "spring-boot")
    test_reusable_workflow "$REUSABLE_DIR/spring-boot-setup.yml"
    ;;
  "postman")
    test_reusable_workflow "$REUSABLE_DIR/postman-tests.yml"
    ;;
  *)
    echo -e "${RED}Unknown option: $1${NC}"
    echo "Usage: $0 [all|gradle|docker|spring-boot|postman]"
    exit 1
    ;;
esac

echo -e "${GREEN}All tests completed.${NC}"
