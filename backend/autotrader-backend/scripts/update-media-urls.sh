#!/bin/bash

# Script to update media file keys in the database to point to uploaded sample images

echo "Updating media file keys to use uploaded sample images..."

# First, let's check if the backend is running
if ! curl -s http://localhost:8080/api/listings > /dev/null; then
    echo "Backend is not running. Please start it first."
    exit 1
fi

# Check if our uploaded images exist
echo "Checking uploaded sample images..."
for i in {1..3}; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:9000/autotrader-assets/listings/$i/main.jpg")
    if [ "$status" != "200" ]; then
        echo "Error: Sample image listings/$i/main.jpg not found (HTTP $status)"
        exit 1
    fi
    echo "✓ listings/$i/main.jpg found"
done

echo "All sample images verified. The database needs to be updated manually."
echo "Since H2 console is not accessible remotely, you need to:"
echo "1. Open http://localhost:8080/h2-console in your browser"
echo "2. Use JDBC URL: jdbc:h2:mem:testdb"
echo "3. Username: sa"
echo "4. Password: (leave empty)"
echo "5. Run these SQL commands:"
echo ""
echo "UPDATE MEDIA SET FILE_KEY = 'listings/1/main.jpg' WHERE ID = 4;"
echo "UPDATE MEDIA SET FILE_KEY = 'listings/2/main.jpg' WHERE ID = 5;"
echo "UPDATE MEDIA SET FILE_KEY = 'listings/3/main.jpg' WHERE ID = 6;"
echo ""
echo "Or restart the backend to reload with fresh sample data."
