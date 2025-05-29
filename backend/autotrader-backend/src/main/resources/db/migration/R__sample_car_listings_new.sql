-- Sample Car Listings Migration (H2 and PostgreSQL Compatible)
-- This is a simplified version that works with both H2 and PostgreSQL databases

-- Delete existing sample data first
DELETE FROM listing_media WHERE listing_id IN (SELECT id FROM car_listings WHERE title LIKE '%Test Listing%' OR title LIKE '%Sample%');
DELETE FROM car_listings WHERE title LIKE '%Test Listing%' OR title LIKE '%Sample%';

-- Insert sample car listings with simple VALUES approach including denormalized fields
INSERT INTO car_listings (
    title, description, price, mileage, model_year, brand, model, model_id,
    exterior_color, doors, cylinders, seller_id, governorate_id, city,
    condition_id, body_style_id, transmission_id, fuel_type_id, drive_type_id,
    transmission, approved, sold, archived, created_at, updated_at,
    brand_name_en, brand_name_ar, model_name_en, model_name_ar
) VALUES 
-- Sample listing 1
('Toyota Camry 2020 - Test Listing 1',
 'This is a sample description for a Toyota Camry. Well-maintained with regular service history. Features include power windows, cruise control, and backup camera.',
 28000, 45000, 2020, 'Toyota', 'Camry',
 (SELECT id FROM models WHERE name = 'camry' LIMIT 1),
 'White', 4, 4, 1, 1, 'Damascus',
 (SELECT id FROM car_conditions WHERE name = 'used' LIMIT 1),
 (SELECT id FROM body_styles WHERE name = 'sedan' LIMIT 1),
 (SELECT id FROM transmissions WHERE name = 'automatic' LIMIT 1),
 (SELECT id FROM fuel_types WHERE name = 'gasoline' LIMIT 1),
 (SELECT id FROM drive_types WHERE name = 'fwd' LIMIT 1),
 'Automatic', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
 'Toyota', 'تويوتا', 'Camry', 'كامري'),

-- Sample listing 2
('Toyota Corolla 2019 - Test Listing 2',
 'This is a sample description for a Toyota Corolla. Excellent condition with low mileage. Perfect for city driving.',
 22000, 35000, 2019, 'Toyota', 'Corolla',
 (SELECT id FROM models WHERE name = 'corolla' LIMIT 1),
 'Black', 4, 4, 1, 1, 'Damascus',
 (SELECT id FROM car_conditions WHERE name = 'used' LIMIT 1),
 (SELECT id FROM body_styles WHERE name = 'sedan' LIMIT 1),
 (SELECT id FROM transmissions WHERE name = 'automatic' LIMIT 1),
 (SELECT id FROM fuel_types WHERE name = 'gasoline' LIMIT 1),
 (SELECT id FROM drive_types WHERE name = 'fwd' LIMIT 1),
 'Automatic', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
 'Toyota', 'تويوتا', 'Corolla', 'كورولا'),

-- Sample listing 3
('Honda Civic 2021 - Test Listing 3',
 'This is a sample description for a Honda Civic. Almost new with warranty. Great fuel economy.',
 25000, 15000, 2021, 'Honda', 'Civic',
 (SELECT id FROM models WHERE name = 'civic' LIMIT 1),
 'Silver', 4, 4, 1, 2, 'Aleppo',
 (SELECT id FROM car_conditions WHERE name = 'used' LIMIT 1),
 (SELECT id FROM body_styles WHERE name = 'sedan' LIMIT 1),
 (SELECT id FROM transmissions WHERE name = 'automatic' LIMIT 1),
 (SELECT id FROM fuel_types WHERE name = 'gasoline' LIMIT 1),
 (SELECT id FROM drive_types WHERE name = 'fwd' LIMIT 1),
 'Automatic', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
 'Honda', 'هوندا', 'Civic', 'سيفيك'),

-- Sample listing 4
('Nissan Altima 2018 - Test Listing 4',
 'This is a sample description for a Nissan Altima. Reliable and comfortable with all maintenance records.',
 20000, 60000, 2018, 'Nissan', 'Altima',
 (SELECT id FROM models WHERE name = 'altima' LIMIT 1),
 'Blue', 4, 4, 1, 1, 'Damascus',
 (SELECT id FROM car_conditions WHERE name = 'used' LIMIT 1),
 (SELECT id FROM body_styles WHERE name = 'sedan' LIMIT 1),
 (SELECT id FROM transmissions WHERE name = 'automatic' LIMIT 1),
 (SELECT id FROM fuel_types WHERE name = 'gasoline' LIMIT 1),
 (SELECT id FROM drive_types WHERE name = 'fwd' LIMIT 1),
 'Automatic', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
 'Nissan', 'نيسان', 'Altima', 'التيما'),

-- Sample listing 5
('Hyundai Elantra 2020 - Test Listing 5',
 'This is a sample description for a Hyundai Elantra. Great value with modern features and excellent condition.',
 18000, 40000, 2020, 'Hyundai', 'Elantra',
 (SELECT id FROM models WHERE name = 'elantra' LIMIT 1),
 'Red', 4, 4, 1, 3, 'Homs',
 (SELECT id FROM car_conditions WHERE name = 'used' LIMIT 1),
 (SELECT id FROM body_styles WHERE name = 'sedan' LIMIT 1),
 (SELECT id FROM transmissions WHERE name = 'automatic' LIMIT 1),
 (SELECT id FROM fuel_types WHERE name = 'gasoline' LIMIT 1),
 (SELECT id FROM drive_types WHERE name = 'fwd' LIMIT 1),
 'Automatic', true, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
 'Hyundai', 'هيونداي', 'Elantra', 'إلانترا');

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
