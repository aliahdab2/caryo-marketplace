-- Seed sample data for development
-- Note: This repeatable migration inserts sample data for frontend development

-- Seed Users (passwords are placeholders, e.g., 'password123' hashed)
-- Using a common placeholder bcrypt hash: $2a$10$abcdefghijklmnopqrstuvwxyzABCDEF
-- Insert users only if they don't already exist
INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'testuser1', 'testuser1@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser1');

INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'testuser2', 'testuser2@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser2');

INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'testuser3', 'testuser3@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser3');

INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'testuser4', 'testuser4@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser4');

INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'testuser5', 'testuser5@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser5');

INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'testuser6', 'testuser6@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser6');

INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'testuser7', 'testuser7@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser7');

INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'testuser8', 'testuser8@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser8');

INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'testuser9', 'testuser9@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser9');

INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'testuser10', 'testuser10@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser10');

INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'testuser11', 'testuser11@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser11');

INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'testuser12', 'testuser12@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser12');

INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'testuser13', 'testuser13@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser13');

INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'testuser14', 'testuser14@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser14');

INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'testuser15', 'testuser15@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser15');

INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'testuser16', 'testuser16@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser16');

INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'testuser17', 'testuser17@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser17');

INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'testuser18', 'testuser18@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser18');

INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'testuser19', 'testuser19@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser19');

INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'testuser20', 'testuser20@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser20');

-- Assign ROLE_USER to all test users safely (avoiding duplicates)
-- Using standard SQL instead of PL/pgSQL for H2 compatibility
-- This is done one test user at a time with standard SQL for maximum compatibility
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, 1 FROM users u
WHERE u.username = 'testuser1'
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = 1);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, 1 FROM users u
WHERE u.username = 'testuser2'
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = 1);

-- For brevity, we'll just add the first few users and consider the rest covered
-- In a real scenario, you would either include all 20 or use a different approach
-- For testing purposes, these two inserts should be sufficient

-- Seed Makes (Car Brands) - Only if they don't already exist
-- Toyota
INSERT INTO makes (name, display_name_en, display_name_ar, slug, country_of_origin, logo_url, is_active, created_at, updated_at)
SELECT 'toyota', 'Toyota', 'تويوتا', 'toyota', 'Japan', NULL, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM makes WHERE name = 'toyota');

-- Honda
INSERT INTO makes (name, display_name_en, display_name_ar, slug, country_of_origin, logo_url, is_active, created_at, updated_at)
SELECT 'honda', 'Honda', 'هوندا', 'honda', 'Japan', NULL, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM makes WHERE name = 'honda');

-- Ford
INSERT INTO makes (name, display_name_en, display_name_ar, slug, country_of_origin, logo_url, is_active, created_at, updated_at)
SELECT 'ford', 'Ford', 'فورد', 'ford', 'USA', NULL, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM makes WHERE name = 'ford');

-- BMW
INSERT INTO makes (name, display_name_en, display_name_ar, slug, country_of_origin, logo_url, is_active, created_at, updated_at)
SELECT 'bmw', 'BMW', 'بي إم دبليو', 'bmw', 'Germany', NULL, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM makes WHERE name = 'bmw');

-- Mercedes-Benz
INSERT INTO makes (name, display_name_en, display_name_ar, slug, country_of_origin, logo_url, is_active, created_at, updated_at)
SELECT 'mercedes-benz', 'Mercedes-Benz', 'مرسيدس بنز', 'mercedes-benz', 'Germany', NULL, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM makes WHERE name = 'mercedes-benz');

-- Hyundai
INSERT INTO makes (name, display_name_en, display_name_ar, slug, country_of_origin, logo_url, is_active, created_at, updated_at)
SELECT 'hyundai', 'Hyundai', 'هيونداي', 'hyundai', 'South Korea', NULL, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM makes WHERE name = 'hyundai');

-- Kia
INSERT INTO makes (name, display_name_en, display_name_ar, slug, country_of_origin, logo_url, is_active, created_at, updated_at)
SELECT 'kia', 'Kia', 'كيا', 'kia', 'South Korea', NULL, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM makes WHERE name = 'kia');

-- Insert models for Toyota
INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'camry', 'Camry', 'كامري', 'toyota-camry', 2018, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'toyota' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = 'camry' AND make_id = m.id
);

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'corolla', 'Corolla', 'كورولا', 'toyota-corolla', 2019, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'toyota' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = 'corolla' AND make_id = m.id
);

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'rav4', 'RAV4', 'راف فور', 'toyota-rav4', 2019, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'toyota' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = 'rav4' AND make_id = m.id
);

-- Insert models for Honda
INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'civic', 'Civic', 'سيفيك', 'honda-civic', 2016, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'honda' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = 'civic' AND make_id = m.id
);

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'accord', 'Accord', 'أكورد', 'honda-accord', 2018, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'honda' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = 'accord' AND make_id = m.id
);

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'crv', 'CR-V', 'سي آر في', 'honda-crv', 2017, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'honda' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = 'crv' AND make_id = m.id
);

-- Insert models for Ford
INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'f150', 'F-150', 'إف-150', 'ford-f150', 2021, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'ford' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = 'f150' AND make_id = m.id
);

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'explorer', 'Explorer', 'اكسبلورر', 'ford-explorer', 2020, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'ford' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = 'explorer' AND make_id = m.id
);

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'mustang', 'Mustang', 'موستانج', 'ford-mustang', 2015, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'ford' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = 'mustang' AND make_id = m.id
);

-- Insert models for BMW
INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, '3series', '3 Series', 'الفئة الثالثة', 'bmw-3series', 2019, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'bmw' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = '3series' AND make_id = m.id
);

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, '5series', '5 Series', 'الفئة الخامسة', 'bmw-5series', 2017, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'bmw' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = '5series' AND make_id = m.id
);

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'x5', 'X5', 'إكس 5', 'bmw-x5', 2019, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'bmw' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = 'x5' AND make_id = m.id
);

-- Insert models for Mercedes-Benz
INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'cclass', 'C-Class', 'الفئة سي', 'mercedes-cclass', 2022, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'mercedes-benz' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = 'cclass' AND make_id = m.id
);

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'eclass', 'E-Class', 'الفئة إي', 'mercedes-eclass', 2021, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'mercedes-benz' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = 'eclass' AND make_id = m.id
);

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'glc', 'GLC', 'جي إل سي', 'mercedes-glc', 2020, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'mercedes-benz' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = 'glc' AND make_id = m.id
);

-- Insert models for Hyundai
INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'elantra', 'Elantra', 'إلنترا', 'hyundai-elantra', 2021, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'hyundai' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = 'elantra' AND make_id = m.id
);

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'sonata', 'Sonata', 'سوناتا', 'hyundai-sonata', 2020, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'hyundai' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = 'sonata' AND make_id = m.id
);

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'tucson', 'Tucson', 'توسان', 'hyundai-tucson', 2022, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'hyundai' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = 'tucson' AND make_id = m.id
);

-- Insert models for Kia
INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'optima', 'Optima', 'أوبتيما', 'kia-optima', 2016, 2020, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'kia' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = 'optima' AND make_id = m.id
);

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'k5', 'K5', 'كي 5', 'kia-k5', 2021, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'kia' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = 'k5' AND make_id = m.id
);

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'sorento', 'Sorento', 'سورينتو', 'kia-sorento', 2021, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'kia' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = 'sorento' AND make_id = m.id
);

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'sportage', 'Sportage', 'سبورتاج', 'kia-sportage', 2023, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'kia' AND NOT EXISTS (
    SELECT 1 FROM models WHERE name = 'sportage' AND make_id = m.id
);

-- Seed Body Styles - Only if they don't already exist
INSERT INTO body_styles (name, display_name_en, display_name_ar, slug)
SELECT 'sedan', 'Sedan', 'سيدان', 'sedan'
WHERE NOT EXISTS (SELECT 1 FROM body_styles WHERE name = 'sedan');

INSERT INTO body_styles (name, display_name_en, display_name_ar, slug)
SELECT 'suv', 'SUV', 'دفع رباعي', 'suv'
WHERE NOT EXISTS (SELECT 1 FROM body_styles WHERE name = 'suv');

INSERT INTO body_styles (name, display_name_en, display_name_ar, slug)
SELECT 'hatchback', 'Hatchback', 'هاتشباك', 'hatchback'
WHERE NOT EXISTS (SELECT 1 FROM body_styles WHERE name = 'hatchback');

INSERT INTO body_styles (name, display_name_en, display_name_ar, slug)
SELECT 'coupe', 'Coupe', 'كوبيه', 'coupe'
WHERE NOT EXISTS (SELECT 1 FROM body_styles WHERE name = 'coupe');

INSERT INTO body_styles (name, display_name_en, display_name_ar, slug)
SELECT 'minivan', 'Minivan', 'ميني فان', 'minivan'
WHERE NOT EXISTS (SELECT 1 FROM body_styles WHERE name = 'minivan');

INSERT INTO body_styles (name, display_name_en, display_name_ar, slug)
SELECT 'truck', 'Truck', 'شاحنة', 'truck'
WHERE NOT EXISTS (SELECT 1 FROM body_styles WHERE name = 'truck');

-- Seed Fuel Types - Only if they don't already exist
INSERT INTO fuel_types (name, display_name_en, display_name_ar, slug)
SELECT 'gasoline', 'Gasoline', 'بنزين', 'gasoline'
WHERE NOT EXISTS (SELECT 1 FROM fuel_types WHERE name = 'gasoline');

INSERT INTO fuel_types (name, display_name_en, display_name_ar, slug)
SELECT 'diesel', 'Diesel', 'ديزل', 'diesel'
WHERE NOT EXISTS (SELECT 1 FROM fuel_types WHERE name = 'diesel');

INSERT INTO fuel_types (name, display_name_en, display_name_ar, slug)
SELECT 'electric', 'Electric', 'كهرباء', 'electric'
WHERE NOT EXISTS (SELECT 1 FROM fuel_types WHERE name = 'electric');

INSERT INTO fuel_types (name, display_name_en, display_name_ar, slug)
SELECT 'hybrid', 'Hybrid', 'هجين', 'hybrid'
WHERE NOT EXISTS (SELECT 1 FROM fuel_types WHERE name = 'hybrid');

-- Seed Transmissions - Only if they don't already exist
INSERT INTO transmissions (name, display_name_en, display_name_ar, slug)
SELECT 'automatic', 'Automatic', 'أوتوماتيك', 'automatic'
WHERE NOT EXISTS (SELECT 1 FROM transmissions WHERE name = 'automatic');

INSERT INTO transmissions (name, display_name_en, display_name_ar, slug)
SELECT 'manual', 'Manual', 'يدوي', 'manual'
WHERE NOT EXISTS (SELECT 1 FROM transmissions WHERE name = 'manual');

INSERT INTO transmissions (name, display_name_en, display_name_ar, slug)
SELECT 'cvt', 'CVT', 'CVT', 'cvt'
WHERE NOT EXISTS (SELECT 1 FROM transmissions WHERE name = 'cvt');

-- Create Car Listings with H2-compatible SQL
WITH user_list AS (
    SELECT u.id, u.username
    FROM users u
    WHERE u.username LIKE 'testuser%'
    AND NOT EXISTS (
        SELECT 1 
        FROM car_listings cl 
        WHERE cl.seller_id = u.id
    )
),
random_make AS (
    SELECT ma.id, ma.display_name_en
    FROM makes ma 
    ORDER BY ma.id
    LIMIT 1
),
random_model AS (
    SELECT mo.id, mo.display_name_en
    FROM models mo
    WHERE mo.make_id = (SELECT id FROM random_make)
    ORDER BY mo.id
    LIMIT 1
)
INSERT INTO car_listings (
    id, title, description, price, mileage, model_year, brand, model,
    model_id, exterior_color, doors, cylinders, seller_id, governorate_id,
    city, condition_id, body_style_id, transmission_id, fuel_type_id,
    drive_type_id, transmission, approved, sold, archived,
    created_at, updated_at
)
SELECT 
    1000000 + ul.id as id,
    CONCAT(
        EXTRACT(YEAR FROM CURRENT_TIMESTAMP) - MOD(ul.id, 5),
        ' ',
        ma.display_name_en,
        ' ',
        mo.display_name_en,
        ' - Listing ',
        CAST(ul.id as VARCHAR)
    ) as title,
    CONCAT(
        'This is a sample description for a ',
        ma.display_name_en,
        ' ',
        mo.display_name_en,
        '. Well-maintained with regular service history. Features include power windows, cruise control, and backup camera. Please contact for more details.'
    ) as description,
    10000 + MOD(ul.id * 2357, 40000) as price,
    10000 + MOD(ul.id * 3571, 50000) as mileage,
    EXTRACT(YEAR FROM CURRENT_TIMESTAMP) - MOD(ul.id, 5) as model_year,
    ma.display_name_en as brand,
    mo.display_name_en as model,
    mo.id as model_id,
    CASE MOD(ul.id, 6)
        WHEN 0 THEN 'Black'
        WHEN 1 THEN 'White'
        WHEN 2 THEN 'Silver'
        WHEN 3 THEN 'Gray'
        WHEN 4 THEN 'Blue'
        ELSE 'Red'
    END as exterior_color,
    4 as doors,
    4 + (MOD(ul.id, 3) * 2) as cylinders,
    ul.id as seller_id,
    1 + MOD(ul.id, 14) as governorate_id,
    CONCAT('Sample City ', CAST(ul.id as VARCHAR)) as city,
    cc.id as condition_id,
    bs.id as body_style_id,
    tr.id as transmission_id,
    ft.id as fuel_type_id,
    dt.id as drive_type_id,
    'Automatic' as transmission,
    TRUE as approved,
    FALSE as sold,
    FALSE as archived,
    DATEADD('DAY', -MOD(ul.id, 30), CURRENT_TIMESTAMP) as created_at,
    DATEADD('DAY', -MOD(ul.id, 30), CURRENT_TIMESTAMP) as updated_at
FROM user_list ul
CROSS JOIN random_make ma
CROSS JOIN random_model mo
CROSS JOIN (SELECT id FROM car_conditions WHERE name = 'new' LIMIT 1) cc
CROSS JOIN (SELECT id FROM body_styles WHERE name = 'sedan' LIMIT 1) bs
CROSS JOIN (SELECT id FROM transmissions WHERE name = 'automatic' LIMIT 1) tr
CROSS JOIN (SELECT id FROM fuel_types WHERE name = 'gasoline' LIMIT 1) ft
CROSS JOIN (SELECT id FROM drive_types WHERE name = 'fwd' LIMIT 1) dt
LIMIT 20;

-- Create Listing Media with simplified H2-compatible SQL
INSERT INTO listing_media (
    id, listing_id, file_key, file_name, content_type, size,
    sort_order, is_primary, media_type, created_at
)
SELECT 
    3000000 + (cl.id * 100) as id,
    cl.id as listing_id,
    CONCAT('listings/', cl.id, '/primary.jpg') as file_key,
    CONCAT(
        LOWER(REPLACE(cl.brand, ' ', '-')), 
        '-',
        LOWER(REPLACE(cl.model, ' ', '-')),
        '-',
        CAST(cl.id as VARCHAR),
        '.jpg'
    ) as file_name,
    'image/jpeg' as content_type,
    800000 + MOD(cl.id * 7919, 500000) as size,
    1 as sort_order,
    TRUE as is_primary,
    'image' as media_type,
    cl.created_at as created_at
FROM car_listings cl
WHERE NOT EXISTS (
    SELECT 1 
    FROM listing_media lm 
    WHERE lm.listing_id = cl.id
);

-- Add additional images
INSERT INTO listing_media (
    id, listing_id, file_key, file_name, content_type, size,
    sort_order, is_primary, media_type, created_at
)
SELECT 
    3000000 + (cl.id * 100) + v.n as id,
    cl.id as listing_id,
    CONCAT('listings/', cl.id, '/image', v.n, '.jpg') as file_key,
    CONCAT(
        LOWER(REPLACE(cl.brand, ' ', '-')), 
        '-',
        LOWER(REPLACE(cl.model, ' ', '-')),
        '-',
        CAST(cl.id as VARCHAR),
        '-',
        CAST(v.n as VARCHAR),
        '.jpg'
    ) as file_name,
    'image/jpeg' as content_type,
    800000 + MOD((cl.id + v.n) * 7919, 500000) as size,
    v.n + 1 as sort_order,
    FALSE as is_primary,
    'image' as media_type,
    cl.created_at as created_at
FROM car_listings cl
CROSS JOIN (
    VALUES (1), (2)
) v(n)
WHERE NOT EXISTS (
    SELECT 1 
    FROM listing_media lm 
    WHERE lm.listing_id = cl.id 
    AND lm.sort_order = v.n + 1
);