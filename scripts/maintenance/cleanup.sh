#!/bin/bash
# Clean up script to remove redundant, temporary, and unused files
# from the caryo-marketplace project

# Color definitions
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Helper functions
log_info() {
  echo -e "${BOLD}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Make sure we're in the project root
if [ ! -d "backend" ] || [ ! -d "frontend" ] || [ ! -d "scripts" ]; then
  log_error "Please run this script from the project root directory"
  exit 1
fi

log_info "Starting cleanup of redundant files..."

# Create a backup directory for moved files, just in case
BACKUP_DIR="./.cleanup-backup-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"
log_info "Creating backup directory: $BACKUP_DIR"

# 1. Remove duplicate test scripts
log_info "Checking for duplicate test scripts..."

# We'll keep run-postman-tests.sh as the main script and remove others
if [ -f "run-complete-test-new.sh" ] && [ -f "run-complete-test.sh" ]; then
  log_info "Found duplicate test scripts:"
  log_info "- run-complete-test.sh"
  log_info "- run-complete-test-new.sh"
  
  # Backup first
  cp "run-complete-test-new.sh" "$BACKUP_DIR/"
  cp "run-complete-test.sh" "$BACKUP_DIR/"
  
  # Remove duplicate
  rm -f "run-complete-test-new.sh"
  log_success "Removed run-complete-test-new.sh (backup created)"
fi

# 2. Remove debug scripts that are no longer needed now that the issue is fixed
if [ -f "debug-postman-tests.sh" ]; then
  log_info "Found debug script that is no longer needed"
  cp "debug-postman-tests.sh" "$BACKUP_DIR/"
  rm -f "debug-postman-tests.sh"
  log_success "Removed debug-postman-tests.sh (backup created)"
fi

# 3. Clean up diagnostic scripts that are no longer needed
log_info "Looking for unused diagnostic scripts..."

# Check for scripts that might no longer be needed
for script in "scripts/validate-postman-paths.sh" "scripts/fix-postman-workflow.sh" "scripts/deep-cleanup.sh" \
              "scripts/postman-workflow-monitor.sh" "scripts/cleanup-postman-tests.sh"; do
  if [ -f "$script" ]; then
    log_info "Found potentially unused script: $script"
    
    # Backup script before removal
    mkdir -p "$(dirname "$BACKUP_DIR/$script")"
    cp "$script" "$BACKUP_DIR/$script"
    
    # Remove script
    rm -f "$script"
    log_success "Removed $script (backup created)"
  fi
done

# 4. Clean up temporary result files
log_info "Cleaning up temporary result files..."
if [ -d "results" ]; then
  # Check if results dir is empty or contains only temporary files
  if [ -z "$(ls -A results/ 2>/dev/null)" ] || [ "$(find results/ -name '*.html' -o -name '*.json' | wc -l)" -gt 0 ]; then
    mkdir -p "$BACKUP_DIR/results"
    cp -r results/* "$BACKUP_DIR/results/" 2>/dev/null
    rm -rf results/*
    log_success "Cleaned up results directory (backups created)"
  fi
fi

# 5. Clean up backup files
log_info "Cleaning up backup files..."
BACKUP_FILES=$(find . -name "*.bak" -o -name "*.backup" -o -name "*.tmp" -o -name "*.old" | grep -v "node_modules" | grep -v ".git" | grep -v ".next")

if [ ! -z "$BACKUP_FILES" ]; then
  echo "$BACKUP_FILES" | while read -r file; do
    mkdir -p "$(dirname "$BACKUP_DIR/$file")"
    cp "$file" "$BACKUP_DIR/$file" 2>/dev/null
    rm -f "$file"
    log_success "Removed backup file: $file"
  done
fi

# 6. Consolidate diagnostic scripts in scripts directory
log_info "Consolidating diagnostic scripts..."
if [ -f "scripts/diagnose-user-auth.sh" ] && [ -f "scripts/diagnose-postman-tests.sh" ]; then
  log_info "Creating a unified diagnostic script..."
  
  cat > "scripts/diagnose-api.sh" << 'EOL'
#!/bin/bash
# Unified diagnostic script for Caryo Marketplace API
# This script combines the functionality of multiple diagnostic scripts
# Usage: ./diagnose-api.sh [baseUrl]

# Color definitions
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

print_header() {
  echo -e "\n${CYAN}${BOLD}======== $1 ========${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

BASE_URL=${1:-"http://localhost:8080"}

print_header "Caryo Marketplace API Diagnostics"
echo "Date: $(date)"
echo "Base URL: $BASE_URL"

# Check server health
print_header "Server Health Check"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/actuator/health)
if [ "$HEALTH_STATUS" = "200" ]; then
  print_success "Server is healthy ($HEALTH_STATUS)"
  curl -s $BASE_URL/actuator/health | grep -v password | grep -v secret
else
  print_error "Server health check failed ($HEALTH_STATUS)"
  echo "Detailed health response:"
  curl -s $BASE_URL/actuator/health
fi

# Check authentication endpoints
print_header "Authentication Endpoints Check"

echo "Testing /api/auth/* endpoints (correct path pattern):"
API_SIGNUP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/auth/signup)
echo "- /api/auth/signup: $API_SIGNUP_STATUS"
if [ "$API_SIGNUP_STATUS" = "401" ]; then
  print_error "Signup endpoint at /api/auth/signup requires authentication! Should be public."
elif [ "$API_SIGNUP_STATUS" = "404" ]; then
  print_error "Signup endpoint at /api/auth/signup not found (404)."
else
  print_success "Signup endpoint at /api/auth/signup is accessible"
fi

API_SIGNIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/auth/signin)
echo "- /api/auth/signin: $API_SIGNIN_STATUS"
if [ "$API_SIGNIN_STATUS" = "401" ]; then
  print_error "Signin endpoint at /api/auth/signin requires authentication! Should be public."
elif [ "$API_SIGNIN_STATUS" = "404" ]; then
  print_error "Signin endpoint at /api/auth/signin not found (404)."
else
  print_success "Signin endpoint at /api/auth/signin is accessible"
fi

# Test authentication
print_header "Authentication Test"

echo "Testing signup with valid payload..."
SIGNUP_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"diagtest","email":"diagtest@example.com","password":"password123"}')

echo "Signup response:"
echo "$SIGNUP_RESPONSE" | grep -v password | grep -v secret

echo "Testing signin with test credentials..."
SIGNIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}')

echo "Signin response:"
echo "$SIGNIN_RESPONSE" | grep -v password | grep -v secret

# Extract token if available
TOKEN=$(echo "$SIGNIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d':' -f2 | tr -d '"' || echo "")
if [ ! -z "$TOKEN" ]; then
  print_success "Successfully extracted token"
  
  # Test a protected endpoint with token
  echo "Testing protected endpoint with token..."
  AUTH_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/test/user)
  echo "Protected endpoint response:"
  echo "$AUTH_RESPONSE" | grep -v password | grep -v secret
else
  print_error "Failed to extract token from signin response"
fi

# Check Postman collection
print_header "Postman Collection Check"

# Try to find the collection file
COLLECTION_PATH=""
POSSIBLE_PATHS=(
  "./backend/autotrader-backend/src/test/resources/postman/autotrader-api-collection.json"
  "./postman/autotrader-api-collection.json"
  "./postman/Caryo_Marketplace_API_Tests.json"
)

for path in "${POSSIBLE_PATHS[@]}"; do
  if [ -f "$path" ]; then
    COLLECTION_PATH="$path"
    print_success "Found collection file: $COLLECTION_PATH"
    break
  fi
done

if [ -z "$COLLECTION_PATH" ]; then
  print_error "No Postman collection file found!"
  exit 1
fi

# Check if jq is installed
if command -v jq &> /dev/null; then
  echo "Analyzing collection paths..."
  
  # Check for auth endpoints in collection
  AUTH_ENDPOINTS=$(jq -r '.. | select(.request?.url?.raw? != null) | select(.request.url.raw | contains("/auth/"))' "$COLLECTION_PATH")
  if [ ! -z "$AUTH_ENDPOINTS" ]; then
    AUTH_COUNT=$(echo "$AUTH_ENDPOINTS" | jq -r '.request.url.raw' 2>/dev/null | wc -l | xargs)
    echo "Found $AUTH_COUNT auth-related endpoints"
    
    # Check if all raw URLs use /api/auth/ pattern
    RAW_API_AUTH_COUNT=$(echo "$AUTH_ENDPOINTS" | jq -r 'select(.request.url.raw | contains("/api/auth/")) | .request.url.raw' 2>/dev/null | wc -l | xargs)
    if [ "$RAW_API_AUTH_COUNT" -eq "$AUTH_COUNT" ]; then
      print_success "All auth endpoints use /api/auth/* pattern ✓"
    else
      print_warning "Not all auth endpoints use /api/auth/* pattern"
    fi
  else
    print_warning "No auth endpoints found in collection"
  fi
else
  echo "jq not installed. Using basic checks..."
  if grep -q '"/api/auth/' "$COLLECTION_PATH"; then
    print_success "Collection uses /api/auth/ pattern ✓"
  elif grep -q '"/auth/' "$COLLECTION_PATH"; then
    print_warning "Collection uses /auth/ pattern without '/api' prefix"
  fi
fi

print_header "Diagnostics Complete"
EOL

  chmod +x "scripts/diagnose-api.sh"
  log_success "Created unified diagnostic script: scripts/diagnose-api.sh"
  
  # Backup original scripts before removal
  cp "scripts/diagnose-user-auth.sh" "$BACKUP_DIR/scripts/"
  cp "scripts/diagnose-postman-tests.sh" "$BACKUP_DIR/scripts/"
  
  # Remove original scripts
  rm -f "scripts/diagnose-user-auth.sh" "scripts/diagnose-postman-tests.sh"
  log_success "Removed redundant diagnostic scripts (backups created)"
fi

# 7. Clean up lib directory if empty
if [ -d "scripts/lib" ] && [ -z "$(ls -A scripts/lib/ 2>/dev/null)" ]; then
  rmdir "scripts/lib"
  log_success "Removed empty scripts/lib directory"
elif [ -d "scripts/lib" ]; then
  mkdir -p "$BACKUP_DIR/scripts/lib"
  cp -r "scripts/lib/"* "$BACKUP_DIR/scripts/lib/" 2>/dev/null
  rm -rf "scripts/lib/"*
  rmdir "scripts/lib" 2>/dev/null
  log_success "Cleaned up scripts/lib directory (backups created)"
fi

log_info "Cleanup complete! Backup of all removed files is available in: $BACKUP_DIR"
echo "Feel free to delete the backup directory once you've confirmed everything works correctly."
