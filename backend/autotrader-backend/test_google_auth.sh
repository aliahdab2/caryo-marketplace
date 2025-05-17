#!/bin/bash

# Google OAuth Authentication Test Script
# This script tests the Google OAuth integration in your application

# Color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Google OAuth Authentication Test ===${NC}"

# Variables
BASE_URL="http://localhost:8080"
API_PATH="/api/auth/social-login"
FULL_URL="${BASE_URL}${API_PATH}"

# Test data
TEST_EMAIL="test_google_user@example.com"
TEST_NAME="Test Google User"
TEST_PROVIDER="google"
TEST_PROVIDER_ID="123456789"

echo -e "${YELLOW}Testing Google OAuth integration...${NC}"
echo "URL: ${FULL_URL}"
echo "Making a direct request to the social login API endpoint..."

# Test the social login endpoint directly
RESPONSE=$(curl -s -X POST "${FULL_URL}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"name\":\"${TEST_NAME}\",\"provider\":\"${TEST_PROVIDER}\",\"providerAccountId\":\"${TEST_PROVIDER_ID}\"}")

echo -e "\n${YELLOW}Response from server:${NC}"
echo $RESPONSE

# Check if we got a token in the response
if echo $RESPONSE | grep -q "token"; then
  echo -e "\n${GREEN}✓ Success! The server returned a token.${NC}"
  
  # Extract token
  TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')
  echo -e "${GREEN}Token: ${TOKEN}${NC}"
  
  # Extract user info
  USERNAME=$(echo $RESPONSE | grep -o '"username":"[^"]*' | sed 's/"username":"//')
  echo -e "${GREEN}Username: ${USERNAME}${NC}"
  
  EMAIL=$(echo $RESPONSE | grep -o '"email":"[^"]*' | sed 's/"email":"//')
  echo -e "${GREEN}Email: ${EMAIL}${NC}"
else
  echo -e "\n${RED}✗ Failed to get a token from the server.${NC}"
  echo -e "${RED}Possible issues:${NC}"
  echo "1. Backend server not running"
  echo "2. API endpoint is incorrect"
  echo "3. Request validation failed"
  echo "4. Server error occurred"
fi

echo -e "\n${YELLOW}Testing for common issues:${NC}"

# Test for CORS issues
echo -e "\n${BLUE}Testing CORS configuration...${NC}"
CORS_TEST=$(curl -s -I -X OPTIONS "${FULL_URL}" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")

if echo "$CORS_TEST" | grep -q "Access-Control-Allow-Origin"; then
  echo -e "${GREEN}✓ CORS headers found in response${NC}"
else
  echo -e "${RED}✗ CORS headers missing - this may cause browser requests to fail${NC}"
  echo "  - Make sure CORS is properly configured in your backend"
fi

# Test for proper error handling
echo -e "\n${BLUE}Testing error handling...${NC}"
ERROR_TEST=$(curl -s -X POST "${FULL_URL}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"invalid\"}")

if echo "$ERROR_TEST" | grep -q "error\|message"; then
  echo -e "${GREEN}✓ Server returns proper error responses${NC}"
  echo -e "Error message: $(echo $ERROR_TEST | grep -o '"message":"[^"]*' | sed 's/"message":"//')"
else
  echo -e "${RED}✗ Server error handling might be insufficient${NC}"
  echo "  - Make sure validation errors are properly returned"
fi

echo -e "\n${BLUE}=== Test Complete ===${NC}"
echo "If all tests passed but you're still having authentication issues:"
echo "1. Check your Google Cloud Console settings"
echo "2. Verify the frontend is properly sending the Google token"
echo "3. Look for errors in browser console and server logs"
echo "4. Check that the frontend URL matches authorized redirect URIs in Google Console"
