#!/bin/bash

# Variables
BASE_URL="http://localhost:8080"
USERNAME="testuser"
EMAIL="test@example.com"
PASSWORD="password123"

# Register a new user
echo "Registering a new user..."
REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${USERNAME}\",\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

echo "Registration Response: $REGISTER_RESPONSE"

# Login with the registered user
echo -e "\nLogging in..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}")

echo "Login Response: $LOGIN_RESPONSE"

# Extract JWT token from login response
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -n "$TOKEN" ]; then
  echo -e "\nToken successfully extracted: $TOKEN"

  # Test public endpoint (should work without token)
  echo -e "\nTesting public endpoint..."
  PUBLIC_RESPONSE=$(curl -s "${BASE_URL}/api/test/public")
  echo "Public Response: $PUBLIC_RESPONSE"

  # Test protected user endpoint (should require token)
  echo -e "\nTesting protected user endpoint..."
  USER_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/test/user" \
    -H "Authorization: Bearer $TOKEN")
  echo "User Response: $USER_RESPONSE"
else
  echo -e "\nFailed to extract token. Login might have failed."
fi
