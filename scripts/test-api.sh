#!/bin/bash

# Quick API Test Script for Excel Data Management
echo "🧪 Testing Excel Data Management APIs"

BASE_URL="http://localhost:8080"

# Test 1: Export Excel (no auth needed for testing)
echo "📤 Testing Excel Export..."
curl -X GET "$BASE_URL/api/v1/admin/data/export-excel" \
  -H "Accept: application/octet-stream" \
  -o "test-export.xlsx" \
  -w "HTTP Status: %{http_code}\n"

if [ -f "test-export.xlsx" ]; then
    echo "✅ Excel export successful! File size: $(ls -lh test-export.xlsx | awk '{print $5}')"
else
    echo "❌ Excel export failed"
fi

# Test 2: Get Statistics
echo "📊 Testing Statistics..."
curl -X GET "$BASE_URL/api/v1/admin/data/statistics" \
  -H "Accept: application/json" \
  -w "HTTP Status: %{http_code}\n"

echo ""
echo "🎯 Manual Testing:"
echo "1. Open http://localhost:3000"
echo "2. Login as admin"
echo "3. Go to Dashboard → Data Management"
echo "4. Test Export/Import buttons"

echo ""
echo "📁 Files created:"
ls -la test-export.xlsx 2>/dev/null || echo "No export file created"
