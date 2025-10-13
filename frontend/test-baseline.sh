#!/bin/bash

# 🧪 BASELINE TESTING SCRIPT
# Tests all current pages before i18n migration

echo "🎯 CARYO MARKETPLACE - BASELINE TESTING"
echo "========================================"
echo "Testing current system before i18n migration..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test a URL
test_url() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Testing $description... "
    
    # Make request and get status code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} ($status_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAIL${NC} ($status_code, expected $expected_status)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Base URL
BASE_URL="http://localhost:3000"

echo "🏠 TESTING PUBLIC PAGES"
echo "------------------------"
test_url "$BASE_URL/" "Home page"
test_url "$BASE_URL/search" "Search page"
test_url "$BASE_URL/listings" "Listings page"
test_url "$BASE_URL/contact" "Contact page"
test_url "$BASE_URL/cars" "Cars SEO page" 302  # Expects redirect
echo ""

echo "🔐 TESTING AUTH PAGES"
echo "----------------------"
test_url "$BASE_URL/auth/signin" "Sign in page"
test_url "$BASE_URL/auth/signup" "Sign up page"
test_url "$BASE_URL/auth/forgot-password" "Forgot password page"
test_url "$BASE_URL/auth/reset-password" "Reset password page"
test_url "$BASE_URL/auth/check-email" "Check email page"
test_url "$BASE_URL/auth/verify-email" "Verify email page"
echo ""

echo "🛡️ TESTING PROTECTED PAGES (Should redirect to signin)"
echo "-------------------------------------------------------"
test_url "$BASE_URL/dashboard" "Dashboard" 302
test_url "$BASE_URL/dashboard/listings" "My listings" 302
test_url "$BASE_URL/dashboard/profile" "User profile" 302
test_url "$BASE_URL/favorites" "Favorites" 302
echo ""

echo "🧪 TESTING TEST PAGES"
echo "----------------------"
test_url "$BASE_URL/test" "Test hub"
test_url "$BASE_URL/test/gallery" "Gallery test"
echo ""

echo "⚙️ TESTING API ROUTES"
echo "----------------------"
test_url "$BASE_URL/api/auth/session" "Session API"
test_url "$BASE_URL/api/test-backend" "Backend test API"
echo ""

# Summary
echo "📊 TEST RESULTS SUMMARY"
echo "========================"
echo -e "Total tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! System is ready for migration.${NC}"
    echo "✅ Current system baseline established"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Fix issues before migration.${NC}"
    echo "❌ Current system has issues that need attention"
    exit 1
fi
