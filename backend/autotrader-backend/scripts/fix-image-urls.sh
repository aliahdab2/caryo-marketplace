#!/bin/bash

# Script to fix image URLs to use localhost instead of Docker internal hostname
# and associate our uploaded images with the car listings

echo "🔧 Fixing image URLs to use localhost..."

# Connect to PostgreSQL and update the media URLs
export PGPASSWORD=postgres
psql -h localhost -U postgres -d autotrader << 'EOF'

-- Update the media URLs to use localhost instead of Docker internal hostname
UPDATE media 
SET url = REPLACE(url, 'http://autotrader-assets.minio:9000', 'http://localhost:9000')
WHERE url LIKE 'http://autotrader-assets.minio:9000%';

-- Update the first 3 listings to use our uploaded images
UPDATE media 
SET 
  url = 'http://localhost:9000/autotrader-assets/listings/1/main.jpg',
  file_key = 'listings/1/main.jpg',
  file_name = 'main.jpg'
WHERE listing_id = 4;

UPDATE media 
SET 
  url = 'http://localhost:9000/autotrader-assets/listings/2/main.jpg',
  file_key = 'listings/2/main.jpg',
  file_name = 'main.jpg'
WHERE listing_id = 5;

UPDATE media 
SET 
  url = 'http://localhost:9000/autotrader-assets/listings/3/main.jpg',
  file_key = 'listings/3/main.jpg',
  file_name = 'main.jpg'
WHERE listing_id = 6;

-- Show the updated media entries
SELECT 
  m.id, 
  m.listing_id, 
  cl.title,
  m.url,
  m.file_key
FROM media m
JOIN car_listing cl ON m.listing_id = cl.id
ORDER BY m.listing_id;

EOF

echo "✅ Image URLs updated successfully!"
echo ""
echo "🔍 Testing image accessibility..."
for i in 1 2 3; do
    echo -n "Testing image $i: "
    if curl -s -I "http://localhost:9000/autotrader-assets/listings/$i/main.jpg" | grep -q "200 OK"; then
        echo "✅ OK"
    else
        echo "❌ Failed"
    fi
done
