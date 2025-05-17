#!/bin/bash

# Test the social login API endpoint directly
API_URL=${1:-"http://localhost:8080"}
ENDPOINT="${API_URL}/api/auth/social-login"

echo "Testing social login API at: $ENDPOINT"
echo ""

# Create a sample Google login request
read -r -d '' PAYLOAD << EOM
{
  "email": "test@example.com",
  "name": "Test User",
  "provider": "google",
  "providerAccountId": "123456789"
}
EOM

echo "Request payload:"
echo "$PAYLOAD"
echo ""

# Send the request
echo "Sending request..."
RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$ENDPOINT")

echo ""
echo "Response:"
echo "$RESPONSE" | python -m json.tool 2>/dev/null || echo "$RESPONSE"

# Check response status
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$ENDPOINT")

echo ""
echo "HTTP Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "✅ Success! The API endpoint is working."
else
  echo "❌ Error! The API endpoint returned a non-success status code."
  
  if [ "$HTTP_CODE" -eq 0 ]; then
    echo "This could mean the backend server is not running or the URL is incorrect."
  elif [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ]; then
    echo "This appears to be an authentication or authorization issue."
  elif [ "$HTTP_CODE" -eq 404 ]; then
    echo "The endpoint was not found. Check that the URL is correct."
  elif [ "$HTTP_CODE" -eq 500 ]; then
    echo "There was a server error. Check the backend logs for details."
  fi
fi

echo ""
echo "For debugging, check the backend logs for more information."
