#!/bin/bash

# Test the social login endpoint to verify it works
echo "Testing social login endpoint..."

# Test data that mimics what the frontend would send
curl -X POST http://localhost:8080/api/auth/social-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "provider": "google",
    "providerAccountId": "123456789",
    "image": "https://example.com/avatar.jpg"
  }' \
  -w "\nHTTP Status: %{http_code}\n" | jq '.' 2>/dev/null || cat

echo -e "\nTest complete."
