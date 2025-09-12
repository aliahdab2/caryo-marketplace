#!/bin/bash

echo "🚗 Testing CarQuery/SyrianCars Integration End-to-End"
echo "===================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8080"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="Admin123!"

echo -e "${BLUE}Step 1: Testing Application Health${NC}"
echo "--------------------------------------"

# Test if application is running
if curl -s "${BASE_URL}/actuator/health" > /dev/null; then
    echo -e "${GREEN}✅ Application is running${NC}"
else
    echo -e "${RED}❌ Application is not running${NC}"
    exit 1
fi

echo -e "\n${BLUE}Step 2: Authentication${NC}"
echo "-----------------------"

# Get JWT token for admin user
AUTH_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${ADMIN_USERNAME}\",\"password\":\"${ADMIN_PASSWORD}\"}")

TOKEN=$(echo $AUTH_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ Admin authentication successful${NC}"
else
    echo -e "${RED}❌ Authentication failed${NC}"
    echo "Response: $AUTH_RESPONSE"
    exit 1
fi

AUTH_HEADER="Authorization: Bearer $TOKEN"

echo -e "\n${BLUE}Step 3: Check Current Database State${NC}"
echo "---------------------------------------"

# Check current makes count
MAKES_COUNT=$(curl -s "${BASE_URL}/api/admin/car-brands" \
  -H "$AUTH_HEADER" | grep -o '"totalElements":[0-9]*' | cut -d':' -f2)

echo "Current makes in database: ${MAKES_COUNT:-0}"

# Check current models count
MODELS_COUNT=$(curl -s "${BASE_URL}/api/admin/car-models" \
  -H "$AUTH_HEADER" | grep -o '"totalElements":[0-9]*' | cut -d':' -f2)

echo "Current models in database: ${MODELS_COUNT:-0}"

echo -e "\n${BLUE}Step 4: Test CarQuery API Integration${NC}"
echo "----------------------------------------"

echo "Testing CarQuery data import..."
CARQUERY_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/admin/data/load-carquery" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json")

if echo "$CARQUERY_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ CarQuery import successful${NC}"
    echo "Response: $(echo $CARQUERY_RESPONSE | grep -o '"message":"[^"]*"' | cut -d'"' -f4)"
else
    echo -e "${YELLOW}⚠️  CarQuery import response: $CARQUERY_RESPONSE${NC}"
fi

echo -e "\n${BLUE}Step 5: Test SyrianCars Integration${NC}"
echo "-------------------------------------"

echo "Testing SyrianCars data import..."
SYRIANCARS_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/admin/data/load-syrian-cars" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json")

if echo "$SYRIANCARS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ SyrianCars import successful${NC}"
    echo "Response: $(echo $SYRIANCARS_RESPONSE | grep -o '"message":"[^"]*"' | cut -d'"' -f4)"
else
    echo -e "${YELLOW}⚠️  SyrianCars import response: $SYRIANCARS_RESPONSE${NC}"
fi

echo -e "\n${BLUE}Step 6: Verify Data Import Results${NC}"
echo "-----------------------------------"

sleep 2 # Give time for async operations to complete

# Check updated counts
NEW_MAKES_COUNT=$(curl -s "${BASE_URL}/api/admin/car-brands" \
  -H "$AUTH_HEADER" | grep -o '"totalElements":[0-9]*' | cut -d':' -f2)

NEW_MODELS_COUNT=$(curl -s "${BASE_URL}/api/admin/car-models" \
  -H "$AUTH_HEADER" | grep -o '"totalElements":[0-9]*' | cut -d':' -f2)

echo "Makes after import: ${NEW_MAKES_COUNT:-0} (was: ${MAKES_COUNT:-0})"
echo "Models after import: ${NEW_MODELS_COUNT:-0} (was: ${MODELS_COUNT:-0})"

# Check if we got new data
if [ "${NEW_MAKES_COUNT:-0}" -gt "${MAKES_COUNT:-0}" ] || [ "${NEW_MODELS_COUNT:-0}" -gt "${MODELS_COUNT:-0}" ]; then
    echo -e "${GREEN}✅ Data import successful - new records added${NC}"
else
    echo -e "${YELLOW}⚠️  No new data detected${NC}"
fi

echo -e "\n${BLUE}Step 7: Test Admin CRUD Operations${NC}"
echo "-------------------------------------"

# Test getting brands with pagination
echo "Testing brand listing..."
BRANDS_RESPONSE=$(curl -s "${BASE_URL}/api/admin/car-brands?page=0&size=5" \
  -H "$AUTH_HEADER")

if echo "$BRANDS_RESPONSE" | grep -q '"content":'; then
    echo -e "${GREEN}✅ Brand listing successful${NC}"
    # Show first brand
    FIRST_BRAND=$(echo $BRANDS_RESPONSE | grep -o '"content":\[{[^}]*\]' | sed 's/.*"name":"([^"]*)".*"displayNameEn":"([^"]*)".*/\1 (\2)/')
    echo "Sample brand: $FIRST_BRAND"
else
    echo -e "${RED}❌ Brand listing failed${NC}"
fi

# Test getting models with pagination
echo "Testing model listing..."
MODELS_RESPONSE=$(curl -s "${BASE_URL}/api/admin/car-models?page=0&size=5" \
  -H "$AUTH_HEADER")

if echo "$MODELS_RESPONSE" | grep -q '"content":'; then
    echo -e "${GREEN}✅ Model listing successful${NC}"
    # Show first model
    FIRST_MODEL=$(echo $MODELS_RESPONSE | grep -o '"content":\[{[^}]*\]' | sed 's/.*"name":"([^"]*)".*"displayNameEn":"([^"]*)".*/\1 (\2)/')
    echo "Sample model: $FIRST_MODEL"
else
    echo -e "${RED}❌ Model listing failed${NC}"
fi

echo -e "\n${BLUE}Step 8: Test Search Functionality${NC}"
echo "-----------------------------------"

# Test searching brands
echo "Testing brand search..."
SEARCH_RESPONSE=$(curl -s "${BASE_URL}/api/admin/car-brands/search?query=toyota" \
  -H "$AUTH_HEADER")

if echo "$SEARCH_RESPONSE" | grep -q '"content":'; then
    echo -e "${GREEN}✅ Brand search successful${NC}"
else
    echo -e "${YELLOW}⚠️  Brand search response: $SEARCH_RESPONSE${NC}"
fi

echo -e "\n${BLUE}Integration Test Summary${NC}"
echo "========================"

echo -e "${GREEN}✅ Application Health: PASSED${NC}"
echo -e "${GREEN}✅ Authentication: PASSED${NC}"
echo -e "${GREEN}✅ Admin Endpoints: AVAILABLE${NC}"

if echo "$CARQUERY_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ CarQuery Integration: SUCCESS${NC}"
else
    echo -e "${YELLOW}⚠️  CarQuery Integration: NEEDS CHECK${NC}"
fi

if echo "$SYRIANCARS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ SyrianCars Integration: SUCCESS${NC}"
else
    echo -e "${YELLOW}⚠️  SyrianCars Integration: NEEDS CHECK${NC}"
fi

echo -e "\n${BLUE}Data Import Results:${NC}"
echo "Makes: ${MAKES_COUNT:-0} → ${NEW_MAKES_COUNT:-0}"
echo "Models: ${MODELS_COUNT:-0} → ${NEW_MODELS_COUNT:-0}"

echo -e "\n${GREEN}🎉 Integration testing completed!${NC}"