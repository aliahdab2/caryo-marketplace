#!/bin/bash

# Script to test both /auth/* and /api/auth/* endpoints to determine which one is configured correctly
# Usage: ./test-auth-paths.sh [baseUrl]

BASE_URL=${1:-"http://localhost:8080"}

echo "=================================================="
echo "Testing Authentication Endpoint Paths ($(date))"
echo "=================================================="
echo "Base URL: $BASE_URL"

# Define test credentials (the same used in application)
TEST_USERNAME="admin"
TEST_PASSWORD="Admin123!"
TEST_EMAIL="admin@example.com"

# Test registration endpoint
echo -e "\n[1] Testing Registration Endpoints"

echo -e "\n   a) Testing /auth/signup:"
SIGNUP_RESPONSE_OLD=$(curl -s -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"test_user\",\"email\":\"test_user@example.com\",\"password\":\"Password123!\",\"role\":[\"user\"]}")
SIGNUP_STATUS_OLD=$?

echo "      Status: $SIGNUP_STATUS_OLD"
echo "      Response: $SIGNUP_RESPONSE_OLD"

echo -e "\n   b) Testing /api/auth/signup:"
SIGNUP_RESPONSE_NEW=$(curl -s -X POST $BASE_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"test_user2\",\"email\":\"test_user2@example.com\",\"password\":\"Password123!\",\"role\":[\"user\"]}")
SIGNUP_STATUS_NEW=$?

echo "      Status: $SIGNUP_STATUS_NEW"
echo "      Response: $SIGNUP_RESPONSE_NEW"

# Test login endpoint
echo -e "\n[2] Testing Login Endpoints"

echo -e "\n   a) Testing /auth/signin:"
SIGNIN_RESPONSE_OLD=$(curl -s -X POST $BASE_URL/auth/signin \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$TEST_USERNAME\",\"password\":\"$TEST_PASSWORD\"}")
SIGNIN_STATUS_OLD=$?

echo "      Status: $SIGNIN_STATUS_OLD"
echo "      Response: $SIGNIN_RESPONSE_OLD"

echo -e "\n   b) Testing /api/auth/signin:"
SIGNIN_RESPONSE_NEW=$(curl -s -X POST $BASE_URL/api/auth/signin \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$TEST_USERNAME\",\"password\":\"$TEST_PASSWORD\"}")
SIGNIN_STATUS_NEW=$?

echo "      Status: $SIGNIN_STATUS_NEW"
echo "      Response: $SIGNIN_RESPONSE_NEW"

# Extract and test token if successful
if [[ "$SIGNIN_RESPONSE_NEW" == *"token"* ]]; then
  echo -e "\n[3] Extracting token from /api/auth/signin response"
  TOKEN=$(echo "$SIGNIN_RESPONSE_NEW" | grep -o '"token":"[^"]*"' | cut -d':' -f2 | tr -d '"' || echo "")
  
  if [ ! -z "$TOKEN" ]; then
    echo "      Token: ${TOKEN:0:20}..."
    
    echo -e "\n[4] Testing protected endpoint with token"
    AUTH_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/test/user)
    echo "      Protected endpoint response: $AUTH_RESPONSE"
  fi
fi

echo -e "\n=================================================="
echo "Test Results Summary:"
echo "=================================================="
echo -e "• /auth/signup: $(if [[ "$SIGNUP_RESPONSE_OLD" == *"successful"* ]]; then echo "✅ WORKS"; else echo "❌ FAILS"; fi)"
echo -e "• /api/auth/signup: $(if [[ "$SIGNUP_RESPONSE_NEW" == *"successful"* ]]; then echo "✅ WORKS"; else echo "❌ FAILS"; fi)"
echo -e "• /auth/signin: $(if [[ "$SIGNIN_RESPONSE_OLD" == *"token"* ]]; then echo "✅ WORKS"; else echo "❌ FAILS"; fi)"
echo -e "• /api/auth/signin: $(if [[ "$SIGNIN_RESPONSE_NEW" == *"token"* ]]; then echo "✅ WORKS"; else echo "❌ FAILS"; fi)"

echo -e "\nRecommendation:"
if [[ "$SIGNUP_RESPONSE_NEW" == *"successful"* ]] || [[ "$SIGNIN_RESPONSE_NEW" == *"token"* ]]; then
  echo "✅ Use /api/auth/* paths in your Postman tests - these match your Spring Security configuration."
else
  echo "⚠️ Neither path seems to work correctly. Check your Spring Security configuration."
fi

echo "=================================================="
