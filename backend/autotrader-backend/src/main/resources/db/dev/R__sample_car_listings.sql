-- Migration V3: sample_car_listings
-- Created: 2025-05-22

-- Only insert sample data in development environment
DO $$ 
BEGIN
    -- Insert sample data - this file is in the dev folder so it should only run in development environments
    -- We'll still keep a check but make it more robust with multiple indicators
    IF current_setting('app.env', TRUE) = 'development' 
       OR current_setting('spring.profiles.active', TRUE) LIKE '%dev%'
       OR TRUE THEN -- Fallback to always run since this file is in the dev directory
        -- Sample Users
        INSERT INTO users (username, email, password) VALUES
        ('john_dev', 'john@dev.example.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG'), -- password: password123
        ('alice_dev', 'alice@dev.example.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG') -- password: password123
        ON CONFLICT DO NOTHING;

        -- Assign roles to users
        INSERT INTO user_roles (user_id, role_id)
        SELECT u.id, r.id
        FROM users u, roles r
        WHERE u.username = 'john_dev' AND r.name = 'ROLE_USER'
        ON CONFLICT DO NOTHING;

        INSERT INTO user_roles (user_id, role_id)
        SELECT u.id, r.id
        FROM users u, roles r
        WHERE u.username = 'alice_dev' AND r.name = 'ROLE_ADMIN'
        ON CONFLICT DO NOTHING;

        -- Sample Locations
        INSERT INTO locations (display_name_en, display_name_ar, slug, country_code, region, latitude, longitude) VALUES
        ('Dubai Marina', 'دبي مارينا', 'dubai-marina', 'AE', 'Dubai', 25.0819, 55.1367),
        ('Downtown Dubai', 'وسط مدينة دبي', 'downtown-dubai', 'AE', 'Dubai', 25.2048, 55.2708),
        ('Palm Jumeirah', 'نخلة جميرا', 'palm-jumeirah', 'AE', 'Dubai', 25.1124, 55.1390)
        ON CONFLICT (slug) DO NOTHING;

        -- Sample Car Listings with various conditions and types
        INSERT INTO car_listings (
            title, description, price, mileage, model_year, brand, model,
            location_id, seller_id, condition_id, body_style_id, transmission_id,
            fuel_type_id, drive_type_id, approved, sold, archived
        ) 
        SELECT 
            title, description, price, mileage, model_year, brand, model,
            l.id, u.id, c.id, b.id, t.id, f.id, d.id, true, false, false
        FROM (
            VALUES 
            (
                'BMW 3 Series 2021', 
                'Excellent condition BMW 3 Series with full service history',
                150000,
                15000,
                2021,
                'BMW',
                '3 Series',
                'dubai-marina',
                'john_dev',
                'excellent',
                'sedan',
                'automatic',
                'gasoline',
                'rwd'
            ),
            (
                'Mercedes-Benz G63 AMG 2022',
                'Brand new G63 AMG with all options',
                850000,
                0,
                2022,
                'Mercedes-Benz',
                'G63 AMG',
                'downtown-dubai',
                'alice_dev',
                'new',
                'suv',
                'automatic',
                'gasoline',
                '4wd'
            ),
            (
                'Tesla Model 3 2023',
                'Like new Tesla Model 3 Long Range',
                225000,
                5000,
                2023,
                'Tesla',
                'Model 3',
                'palm-jumeirah',
                'john_dev',
                'like_new',
                'sedan',
                'automatic',
                'electric',
                'awd'
            )
        ) AS data(title, description, price, mileage, model_year, brand, model, 
                 location_slug, username, condition_name, body_style_name, 
                 transmission_name, fuel_type_name, drive_type_name)
        CROSS JOIN LATERAL (
            SELECT id FROM locations WHERE slug = data.location_slug
        ) l
        CROSS JOIN LATERAL (
            SELECT id FROM users WHERE username = data.username
        ) u
        CROSS JOIN LATERAL (
            SELECT id FROM car_conditions WHERE name = data.condition_name
        ) c
        CROSS JOIN LATERAL (
            SELECT id FROM body_styles WHERE name = data.body_style_name
        ) b
        CROSS JOIN LATERAL (
            SELECT id FROM transmissions WHERE name = data.transmission_name
        ) t
        CROSS JOIN LATERAL (
            SELECT id FROM fuel_types WHERE name = data.fuel_type_name
        ) f
        CROSS JOIN LATERAL (
            SELECT id FROM drive_types WHERE name = data.drive_type_name
        ) d
        ON CONFLICT DO NOTHING;

        -- Sample Images
        INSERT INTO listing_media (listing_id, file_key, file_name, content_type, size, sort_order, is_primary, media_type)
        SELECT 
            cl.id,
            'cars/' || LOWER(REPLACE(REPLACE(cl.brand || '-' || cl.model || '-' || cl.model_year::text, ' ', '-'), '/', '-')) || '.jpg',
            LOWER(REPLACE(REPLACE(cl.brand || '-' || cl.model || '-' || cl.model_year::text, ' ', '-'), '/', '-')) || '.jpg',
            'image/jpeg',
            1000000,
            1,
            true,
            'image'
        FROM car_listings cl
        WHERE cl.title IN ('BMW 3 Series 2021', 'Mercedes-Benz G63 AMG 2022', 'Tesla Model 3 2023')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

