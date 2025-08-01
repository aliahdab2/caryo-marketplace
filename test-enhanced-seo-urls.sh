#!/bin/bash

# URL Test Script for Enhanced SEO URLs
# This script demonstrates the new URL patterns and their redirects

echo "🚗 Enhanced SEO URL System Test"
echo "================================"

BASE_URL="http://localhost:3000"

echo ""
echo "Testing Enhanced URL Patterns..."
echo "(These URLs will redirect to /search with appropriate parameters)"
echo ""

# Array of test URLs with descriptions
declare -a test_urls=(
    "/cars/toyota-camry/damascus:Basic pattern (existing)"
    "/cars/2024/toyota-camry/damascus:Year filtering"
    "/cars/new/toyota-camry/damascus:Condition filtering"
    "/cars/2024/new/toyota-camry/damascus:Year + Condition"
    "/cars/toyota-camry/under-50k/damascus:Price filtering"
    "/cars/2024/used/toyota-camry/under-80k/damascus:Full pattern"
    "/cars/toyota-camry/honda-civic/damascus:Multiple models"
    "/cars/toyota-camry/damascus-aleppo:Multiple locations"
)

# Test each URL
for url_info in "${test_urls[@]}"; do
    IFS=":" read -r url description <<< "$url_info"
    echo "✅ $description"
    echo "   URL: $BASE_URL$url"
    echo "   Test: curl -s -o /dev/null -w '%{redirect_url}' $BASE_URL$url"
    echo ""
done

echo "📝 Manual Testing Instructions:"
echo "1. Open your browser and visit any of the URLs above"
echo "2. You should be redirected to /search with the appropriate filters"
echo "3. Check the browser's Network tab to see the redirect process"
echo "4. Verify that the search parameters match the URL structure"
echo ""

echo "🔍 Example Test:"
echo "Visit: $BASE_URL/cars/2024/new/toyota-camry/under-80k/damascus"
echo "Expected: Redirect to /search?years=2024&condition=new&brand=toyota&model=toyota-camry&maxPrice=80000&locations=damascus"
echo ""

echo "✨ All URL patterns are now live and ready for testing!"
