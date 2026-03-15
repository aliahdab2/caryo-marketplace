#!/bin/bash

echo "🧪 Testing CarQuery API Client Unit Test"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Step 1: Running CarQuery API Unit Tests${NC}"
echo "--------------------------------------------"

cd /Users/aliahdab/Documents/caryo-marketplace/backend/caryo-backend

# Run just the CarQuery related tests
echo "Running CarQueryApiClient tests..."
./gradlew test --tests "*CarQueryApiClient*" --continue 2>&1 | grep -E "(FAILED|BUILD|Error|Exception|PASSED|Tests run)" | tail -10

echo -e "\n${GREEN}Step 2: Testing CarQuery Service Integration${NC}"
echo "-------------------------------------------------"

echo "Running CarQueryDataService tests..."
./gradlew test --tests "*CarQueryDataService*" --continue 2>&1 | grep -E "(FAILED|BUILD|Error|Exception|PASSED|Tests run)" | tail -10

echo -e "\n${GREEN}Step 3: Testing SyrianCars Service${NC}"
echo "--------------------------------------"

echo "Running SyrianCarsDataService tests..."
./gradlew test --tests "*SyrianCarsDataService*" --continue 2>&1 | grep -E "(FAILED|BUILD|Error|Exception|PASSED|Tests run)" | tail -10

echo -e "\n${GREEN}Step 4: Testing Translation Service${NC}"
echo "----------------------------------------"

echo "Running ArabicTranslationService tests..."
./gradlew test --tests "*ArabicTranslationService*" --continue 2>&1 | grep -E "(FAILED|BUILD|Error|Exception|PASSED|Tests run)" | tail -10

echo -e "\n${GREEN}Step 5: Testing Admin Controllers${NC}"
echo "--------------------------------------"

echo "Running AdminDataManagementController tests..."
./gradlew test --tests "*AdminDataManagementController*" --continue 2>&1 | grep -E "(FAILED|BUILD|Error|Exception|PASSED|Tests run)" | tail -10

echo -e "\n${YELLOW}📊 Unit Test Summary${NC}"
echo "===================="

# Count total tests run
TOTAL_TESTS=$(./gradlew test --tests "*CarQuery*Service* OR *SyrianCars* OR *AdminDataManagement*" --continue 2>&1 | grep -E "Tests run:" | tail -1 | sed 's/.*Tests run: \([0-9]*\).*/\1/')

if [ -n "$TOTAL_TESTS" ] && [ "$TOTAL_TESTS" -gt 0 ]; then
    echo -e "${GREEN}✅ Tests executed: $TOTAL_TESTS${NC}"
else
    echo -e "${RED}❌ No tests were executed${NC}"
fi

echo -e "\n${GREEN}🎯 Next Steps:${NC}"
echo "1. If CarQuery API tests fail, check API connectivity"
echo "2. If SyrianCars tests fail, check web scraping configuration"
echo "3. If translation tests fail, check OpenAI API key"
echo "4. If admin controller tests fail, check endpoint configuration"

echo -e "\n${GREEN}💡 To run full integration tests:${NC}"
echo "   ./test_carquery_integration.sh"
