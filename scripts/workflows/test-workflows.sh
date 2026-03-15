#!/bin/bash

# Test script to verify GitHub workflow fixes locally
set -e

echo "🔧 Testing GitHub Workflow Fixes Locally"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

# Test 1: Backend Unit Tests
echo -e "${YELLOW}📋 Testing Backend Unit Tests...${NC}"
cd backend/caryo-backend
./gradlew test --info > /dev/null 2>&1
print_status $? "Backend unit tests"
cd ../..

# Test 2: Frontend Linting
echo -e "${YELLOW}📋 Testing Frontend Linting...${NC}"
cd frontend
npm run lint > /dev/null 2>&1
print_status $? "Frontend linting"

# Test 3: Frontend Tests
echo -e "${YELLOW}📋 Testing Frontend Tests...${NC}"
CI=true npm test -- --watchAll=false --coverage=false --passWithNoTests > /dev/null 2>&1
print_status $? "Frontend tests"

# Test 4: Frontend Build
echo -e "${YELLOW}📋 Testing Frontend Build...${NC}"
npm run build > /dev/null 2>&1
print_status $? "Frontend build"
cd ..

# Test 5: Gradle Wrapper Check
echo -e "${YELLOW}📋 Testing Gradle Wrapper...${NC}"
cd backend/caryo-backend
if [ -f "./gradlew" ] && [ -x "./gradlew" ]; then
    ./gradlew --version > /dev/null 2>&1
    print_status $? "Gradle wrapper"
else
    print_status 1 "Gradle wrapper (missing or not executable)"
fi
cd ../..

echo ""
echo -e "${GREEN}🎉 All local tests completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Commit and push the workflow fixes"
echo "2. Create a pull request to test the GitHub Actions"
echo "3. Monitor the workflow runs in GitHub Actions tab"