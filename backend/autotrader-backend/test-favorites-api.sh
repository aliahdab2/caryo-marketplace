#!/bin/bash

# Test script to verify favorites API endpoint structure
echo "Testing favorites API endpoint..."

# First, let's test with an authenticated user
# Create a simple test user session (if needed)

echo "Testing /api/favorites endpoint..."
curl -v http://localhost:8080/api/favorites 2>&1 | grep -E "(HTTP|Content-Type|{|message)"

echo -e "\n\nTesting with basic auth header (for testing purposes)..."
# This will still return 401 but should show the endpoint is accessible
curl -H "Authorization: Bearer test-token" http://localhost:8080/api/favorites 2>/dev/null | head -5

echo -e "\n\nEndpoint test complete."
