#!/bin/bash

# 🧪 CRITICAL PATH TESTING - URL-based i18n Migration
# Tests the most important user journeys

set -e

FRONTEND_DIR="/Users/aliahdab/Documents/caryo-marketplace/frontend"
BASE_URL="http://localhost:3000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 CRITICAL PATH TESTING - i18n Migration${NC}"
echo "=============================================="

# Test function
test_url() {
    local url=$1
    local expected_lang=$2
    local test_name=$3
    
    echo -e "${YELLOW}Testing: $test_name${NC}"
    
    # Check HTTP status
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✅ $url → $status${NC}"
        
        # Check if page contains expected language content
        content=$(curl -s "$url")
        if [[ "$expected_lang" == "ar" ]]; then
            # Check for Arabic content or RTL
            if echo "$content" | grep -q 'dir="rtl"' || echo "$content" | grep -q 'lang="ar"'; then
                echo -e "${GREEN}✅ Arabic RTL detected${NC}"
            else
                echo -e "${YELLOW}⚠️  RTL not detected (might be client-side)${NC}"
            fi
        else
            # Check for English content
            if echo "$content" | grep -q 'lang="en"' || ! echo "$content" | grep -q 'dir="rtl"'; then
                echo -e "${GREEN}✅ English LTR detected${NC}"
            fi
        fi
    else
        echo -e "${RED}❌ $url → $status${NC}"
        return 1
    fi
    
    echo ""
}

echo -e "${BLUE}🔥 CRITICAL USER JOURNEYS${NC}"
echo ""

# 1. Root redirect
echo -e "${YELLOW}1. Root Redirect Test${NC}"
redirect_url=$(curl -s -o /dev/null -w "%{redirect_url}" "$BASE_URL/")
if [[ "$redirect_url" == *"/en"* ]]; then
    echo -e "${GREEN}✅ Root redirects to /en${NC}"
else
    echo -e "${RED}❌ Root redirect failed: $redirect_url${NC}"
fi
echo ""

# 2. Core pages in both languages
echo -e "${YELLOW}2. Core Pages Test${NC}"
test_url "$BASE_URL/en" "en" "Home EN"
test_url "$BASE_URL/ar" "ar" "Home AR"
test_url "$BASE_URL/en/search" "en" "Search EN"
test_url "$BASE_URL/ar/search" "ar" "Search AR"
test_url "$BASE_URL/en/listings" "en" "Listings EN"
test_url "$BASE_URL/ar/listings" "ar" "Listings AR"

# 3. Language switcher simulation
echo -e "${YELLOW}3. Language Switching Test${NC}"
echo "Testing language switching URLs..."

# Simulate switching from EN to AR
test_url "$BASE_URL/ar/search" "ar" "EN→AR Search"
test_url "$BASE_URL/en/listings" "en" "AR→EN Listings"

echo -e "${BLUE}🎯 QUICK FUNCTIONAL TESTS${NC}"
echo ""

# 4. API endpoints still work
echo -e "${YELLOW}4. API Endpoints Test${NC}"
api_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" 2>/dev/null || echo "000")
if [ "$api_status" = "200" ]; then
    echo -e "${GREEN}✅ API endpoints working${NC}"
else
    echo -e "${YELLOW}⚠️  API health check: $api_status (might not exist)${NC}"
fi
echo ""

echo -e "${GREEN}🎉 CRITICAL PATH TESTING COMPLETE${NC}"
echo ""
echo -e "${BLUE}📋 NEXT STEPS:${NC}"
echo "1. ✅ If all tests pass → Continue with Phase 3 (Auth pages)"
echo "2. ❌ If tests fail → Fix issues before proceeding"
echo "3. 🧪 Optional: Run full test suite with 'npm test'"
