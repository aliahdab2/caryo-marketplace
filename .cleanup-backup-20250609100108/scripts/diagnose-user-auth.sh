#!/bin/bash

# Script to diagnose user authentication issues in Spring Boot application
# Usage: ./diagnose-user-auth.sh [baseUrl]

BASE_URL=${1:-"http://localhost:8080"}
echo "=================================================="
echo "User Authentication Diagnostics ($(date))"
echo "=================================================="
echo "Base URL: $BASE_URL"

# Check if server is accessible
echo -e "\n[1] Checking server health..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/actuator/health)
if [ "$HEALTH_STATUS" = "200" ]; then
  echo "✅ Server is healthy ($HEALTH_STATUS)"
  curl -s $BASE_URL/actuator/health | jq
else
  echo "❌ Server health check failed ($HEALTH_STATUS)"
  echo "Detailed health response:"
  curl -s $BASE_URL/actuator/health
fi

# Check both /auth/* and /api/auth/* endpoints
echo -e "\n[2] Checking authentication endpoints..."
echo -e "\n   a) Testing /auth/* endpoints (legacy/incorrect path):"
SIGNUP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/auth/signup)
echo "  - /auth/signup: $SIGNUP_STATUS"
if [ "$SIGNUP_STATUS" = "401" ]; then
  echo "    ❌ Signup endpoint at /auth/signup requires authentication! Should be public."
elif [ "$SIGNUP_STATUS" = "404" ]; then
  echo "    ❌ Signup endpoint at /auth/signup not found (404). This is expected if only /api/auth/* is supported."
else
  echo "    ✅ Signup endpoint at /auth/signup is accessible"
fi

SIGNIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/auth/signin)
echo "  - /auth/signin: $SIGNIN_STATUS"
if [ "$SIGNIN_STATUS" = "401" ]; then
  echo "    ❌ Signin endpoint at /auth/signin requires authentication! Should be public."
elif [ "$SIGNIN_STATUS" = "404" ]; then
  echo "    ❌ Signin endpoint at /auth/signin not found (404). This is expected if only /api/auth/* is supported."
else
  echo "    ✅ Signin endpoint at /auth/signin is accessible"
fi

echo -e "\n   b) Testing /api/auth/* endpoints (correct path per SecurityConfig):"
API_SIGNUP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/auth/signup)
echo "  - /api/auth/signup: $API_SIGNUP_STATUS"
if [ "$API_SIGNUP_STATUS" = "401" ]; then
  echo "    ❌ Signup endpoint at /api/auth/signup requires authentication! Should be public."
elif [ "$API_SIGNUP_STATUS" = "404" ]; then
  echo "    ❌ Signup endpoint at /api/auth/signup not found (404)."
else
  echo "    ✅ Signup endpoint at /api/auth/signup is accessible"
fi

API_SIGNIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/auth/signin)
echo "  - /api/auth/signin: $API_SIGNIN_STATUS"
if [ "$API_SIGNIN_STATUS" = "401" ]; then
  echo "    ❌ Signin endpoint at /api/auth/signin requires authentication! Should be public."
elif [ "$API_SIGNIN_STATUS" = "404" ]; then
  echo "    ❌ Signin endpoint at /api/auth/signin not found (404)."
else
  echo "    ✅ Signin endpoint at /api/auth/signin is accessible"
fi

# Test actual signup endpoint with valid payload - try both paths
echo -e "\n[3] Testing signup with valid payload..."
echo "   a) Testing /auth/signup: "
SIGNUP_RESPONSE=$(curl -s -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"diagtest","email":"diagtest@example.com","password":"password123"}')

echo "Signup response (/auth/signup):"
echo "$SIGNUP_RESPONSE"

echo "   b) Testing /api/auth/signup: "
API_SIGNUP_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"diagtest2","email":"diagtest2@example.com","password":"password123"}')

echo "Signup response (/api/auth/signup):"
echo "$API_SIGNUP_RESPONSE"

# Test signin with test credentials - try both paths
echo -e "\n[4] Testing signin with test credentials..."
echo "   a) Testing /auth/signin: "
SIGNIN_RESPONSE=$(curl -v -s -X POST $BASE_URL/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}' 2>&1)

echo "Signin response for /auth/signin (with verbose output):"
echo "$SIGNIN_RESPONSE"

echo "   b) Testing /api/auth/signin: "
API_SIGNIN_RESPONSE=$(curl -v -s -X POST $BASE_URL/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}' 2>&1)

echo "Signin response for /api/auth/signin (with verbose output):"
echo "$API_SIGNIN_RESPONSE"

# Try to extract token from any successful response
for RESPONSE in "$SIGNIN_RESPONSE" "$API_SIGNIN_RESPONSE"; do
  TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*"' | cut -d':' -f2 | tr -d '"' || echo "")
  if [ ! -z "$TOKEN" ]; then
    echo "✅ Successfully extracted token: ${TOKEN:0:20}..."
    
    # Test a protected endpoint with token
    echo -e "\n[5] Testing protected endpoint with token..."
    AUTH_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/test/user)
    echo "Protected endpoint response:"
    echo "$AUTH_RESPONSE"
    break
  fi
done

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to extract token from signin responses"
fi

# Check security configuration from actuator if available
echo -e "\n[6] Checking security configuration from actuator..."
echo "a) Auth controller mappings:"
curl -s $BASE_URL/actuator/mappings | grep -A 10 -B 2 "/auth/" || echo "No /auth/ mappings found"
echo "----"
echo "b) API Auth controller mappings:"
curl -s $BASE_URL/actuator/mappings | grep -A 10 -B 2 "/api/auth/" || echo "No /api/auth/ mappings found"
echo "----"
echo "c) Security Filter Chain configuration:"
curl -s $BASE_URL/actuator/mappings | grep -A 10 -B 2 "securityFilterChain" || echo "No security filter chain info found"

echo -e "\n[7] Testing OPTIONS request to check CORS..."
curl -v -X OPTIONS $BASE_URL/auth/signup -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: POST"
echo -e "\nAlso testing OPTIONS on /api/auth/signup:"
curl -v -X OPTIONS $BASE_URL/api/auth/signup -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: POST"

echo -e "\nDiagnostics completed."
