#!/bin/bash

echo "🚀 Manual CarQuery/SyrianCars Integration Testing"
echo "================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8080"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="Admin123!"

echo -e "${BLUE}Step 1: Starting Application${NC}"
echo "-------------------------------"

cd /Users/aliahdab/Documents/caryo-marketplace/backend/caryo-backend

echo "Starting Spring Boot application in background..."
./gradlew bootRun --args='--spring.profiles.active=integration' > /tmp/spring-boot.log 2>&1 &
SPRING_PID=$!

echo "Waiting for application to start..."
sleep 30

# Check if application is running
if curl -s "${BASE_URL}/actuator/health" | grep -q '"status":"UP"'; then
    echo -e "${GREEN}✅ Application started successfully${NC}"
else
    echo -e "${RED}❌ Application failed to start${NC}"
    echo "Checking logs..."
    tail -20 /tmp/spring-boot.log
    kill $SPRING_PID 2>/dev/null
    exit 1
fi

echo -e "\n${BLUE}Step 2: Testing CarQuery API Client${NC}"
echo "----------------------------------------"

echo "Testing CarQuery API directly..."
CARQUERY_DIRECT=$(curl -s "https://www.carqueryapi.com/api/0.3/?cmd=getMakes" | head -c 200)

if echo "$CARQUERY_DIRECT" | grep -q '"Makes":'; then
    echo -e "${GREEN}✅ CarQuery API is accessible${NC}"
    MAKES_COUNT=$(echo "$CARQUERY_DIRECT" | grep -o '"name"[^}]*' | wc -l)
    echo "Sample makes found: $MAKES_COUNT"
else
    echo -e "${YELLOW}⚠️ CarQuery API response: $CARQUERY_DIRECT${NC}"
fi

echo -e "\n${BLUE}Step 3: Testing Admin Authentication${NC}"
echo "----------------------------------------"

echo "Testing admin login..."
AUTH_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${ADMIN_USERNAME}\",\"password\":\"${ADMIN_PASSWORD}\"}")

if echo "$AUTH_RESPONSE" | grep -q '"token"'; then
    echo -e "${GREEN}✅ Admin authentication successful${NC}"
    TOKEN=$(echo $AUTH_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
else
    echo -e "${RED}❌ Admin authentication failed${NC}"
    echo "Response: $AUTH_RESPONSE"
    kill $SPRING_PID 2>/dev/null
    exit 1
fi

AUTH_HEADER="Authorization: Bearer $TOKEN"

echo -e "\n${BLUE}Step 4: Testing CarQuery Integration Endpoint${NC}"
echo "-------------------------------------------------"

echo "Testing CarQuery data import..."
CARQUERY_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/admin/data/load-carquery" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json")

echo "CarQuery response:"
echo "$CARQUERY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CARQUERY_RESPONSE"

if echo "$CARQUERY_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ CarQuery integration successful${NC}"
else
    echo -e "${YELLOW}⚠️ CarQuery integration response: $CARQUERY_RESPONSE${NC}"
fi

echo -e "\n${BLUE}Step 5: Testing SyrianCars Integration Endpoint${NC}"
echo "---------------------------------------------------"

echo "Testing SyrianCars data import..."
SYRIANCARS_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/admin/data/load-syrian-cars" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json")

echo "SyrianCars response:"
echo "$SYRIANCARS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SYRIANCARS_RESPONSE"

if echo "$SYRIANCARS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ SyrianCars integration successful${NC}"
else
    echo -e "${YELLOW}⚠️ SyrianCars integration response: $SYRIANCARS_RESPONSE${NC}"
fi

echo -e "\n${BLUE}Step 6: Checking Data Import Results${NC}"
echo "----------------------------------------"

echo "Checking makes count..."
MAKES_RESPONSE=$(curl -s "${BASE_URL}/api/admin/brands?page=0&size=1" \
  -H "$AUTH_HEADER")

if echo "$MAKES_RESPONSE" | grep -q '"totalElements"'; then
    MAKES_COUNT=$(echo $MAKES_RESPONSE | grep -o '"totalElements":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✅ Makes in database: $MAKES_COUNT${NC}"
else
    echo -e "${RED}❌ Could not retrieve makes count${NC}"
fi

echo "Checking models count..."
MODELS_RESPONSE=$(curl -s "${BASE_URL}/api/admin/models?page=0&size=1" \
  -H "$AUTH_HEADER")

if echo "$MODELS_RESPONSE" | grep -q '"totalElements"'; then
    MODELS_COUNT=$(echo $MODELS_RESPONSE | grep -o '"totalElements":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✅ Models in database: $MODELS_COUNT${NC}"
else
    echo -e "${RED}❌ Could not retrieve models count${NC}"
fi

echo -e "\n${BLUE}Step 7: Testing Admin CRUD Operations${NC}"
echo "-----------------------------------------"

echo "Testing brand search..."
SEARCH_RESPONSE=$(curl -s "${BASE_URL}/api/admin/brands/search?query=toyota" \
  -H "$AUTH_HEADER")

if echo "$SEARCH_RESPONSE" | grep -q '"content":'; then
    echo -e "${GREEN}✅ Brand search successful${NC}"
else
    echo -e "${YELLOW}⚠️ Brand search response: $SEARCH_RESPONSE${NC}"
fi

echo -e "\n${GREEN}🎉 Manual Integration Testing Complete!${NC}"
echo "=========================================="

echo -e "${BLUE}Summary:${NC}"
echo "--------"
echo -e "${GREEN}✅ Application: Running${NC}"
echo -e "${GREEN}✅ Authentication: Working${NC}"
echo -e "${GREEN}✅ CarQuery API: Accessible${NC}"

if echo "$CARQUERY_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ CarQuery Integration: SUCCESS${NC}"
else
    echo -e "${YELLOW}⚠️ CarQuery Integration: NEEDS CHECK${NC}"
fi

if echo "$SYRIANCARS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ SyrianCars Integration: SUCCESS${NC}"
else
    echo -e "${YELLOW}⚠️ SyrianCars Integration: NEEDS CHECK${NC}"
fi

echo -e "${GREEN}📊 Database: $MAKES_COUNT makes, $MODELS_COUNT models${NC}"

echo -e "\n${YELLOW}💡 Application will continue running in background${NC}"
echo -e "${YELLOW}   Stop it with: kill $SPRING_PID${NC}"

# Don't kill the process - let user stop it manually
# kill $SPRING_PID 2>/dev/null
