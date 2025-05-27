-- Sample Car Listings Migration (H2 and PostgreSQL Compatible)
-- This is a simplified version that works with both H2 and PostgreSQL databases

-- Delete existing sample data first
DELETE FROM listing_media WHERE listing_id IN (SELECT id FROM car_listings WHERE title LIKE '%Test Listing%' OR title LIKE '%Sample%');
DELETE FROM car_listings WHERE title LIKE '%Test Listing%' OR title LIKE '%Sample%';

-- Delete existing sample data first
DELETE FROM car_listings WHERE title LIKE '% - Test Listing %';

-- Create a test user first if it doesn't exist
INSERT INTO users (id, username, email, password, created_at, updated_at)
SELECT 1, 'testuser', 'test@example.com', '$2a$10$dummy.hash.for.test.purposes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 1);

-- Insert simple sample car listings with proper model_id references
INSERT INTO car_listings (
    title, description, price, mileage, model_year,
    brand, model, model_id, exterior_color, doors, cylinders,
    seller_id, transmission, approved, sold, archived,
    created_at, updated_at
) 
SELECT 
    'Toyota Camry 2020 - Test Listing 1',
    'This is a sample description for a Toyota Camry. Well-maintained with regular service history.',
    28000, 45000, 2020,
    mb.name, m.name, m.id,
    'White', 4, 4,
    1, 'Automatic', true, false, false,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM models m
JOIN makes mb ON m.make_id = mb.id
WHERE m.slug = 'toyota-camry'
AND NOT EXISTS (SELECT 1 FROM car_listings WHERE title = 'Toyota Camry 2020 - Test Listing 1')

UNION ALL

SELECT 
    'Toyota Corolla 2019 - Test Listing 2',
    'This is a sample description for a Toyota Corolla. Excellent condition with low mileage.',
    22000, 35000, 2019,
    mb.name, m.name, m.id,
    'Black', 4, 4,
    1, 'Automatic', true, false, false,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM models m
JOIN makes mb ON m.make_id = mb.id
WHERE m.slug = 'toyota-corolla'
AND NOT EXISTS (SELECT 1 FROM car_listings WHERE title = 'Toyota Corolla 2019 - Test Listing 2')

UNION ALL

SELECT 
    'Honda Civic 2021 - Test Listing 3',
    'This is a sample description for a Honda Civic. Almost new with warranty.',
    25000, 15000, 2021,
    mb.name, m.name, m.id,
    'Silver', 4, 4,
    1, 'Automatic', true, false, false,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM models m
JOIN makes mb ON m.make_id = mb.id
WHERE m.slug = 'honda-civic'
AND NOT EXISTS (SELECT 1 FROM car_listings WHERE title = 'Honda Civic 2021 - Test Listing 3');

-- Insert sample media for the listings (simplified)
INSERT INTO listing_media (
    listing_id, file_key, file_name, content_type, size,
    sort_order, is_primary, media_type, created_at
)
SELECT 
    cl.id,
    'sample/car-' || cl.id || '-1.jpg',
    'car-' || cl.id || '-1.jpg',
    'image/jpeg',
    102400,
    1,
    true,
    'IMAGE',
    CURRENT_TIMESTAMP
FROM car_listings cl 
WHERE cl.title LIKE '%Test Listing%'
LIMIT 5;
