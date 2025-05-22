-- Basic sample data for testing
-- Sample Users
INSERT INTO users (username, email, password) 
VALUES 
('john_test', 'john@test.example.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG'), -- password: password123
('alice_test', 'alice@test.example.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG') -- password: password123
ON CONFLICT (username) DO NOTHING;

-- Assign roles to users
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'john_test' AND r.name = 'ROLE_USER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'alice_test' AND r.name = 'ROLE_ADMIN'
ON CONFLICT DO NOTHING;

-- Sample Locations
INSERT INTO locations (display_name_en, display_name_ar, slug, country_code, region, latitude, longitude) 
VALUES 
('Test Location 1', 'موقع اختبار 1', 'test-location-1', 'AE', 'Test', 25.0000, 55.0000),
('Test Location 2', 'موقع اختبار 2', 'test-location-2', 'AE', 'Test', 25.1000, 55.1000)
ON CONFLICT (slug) DO NOTHING;

-- Basic test car listing
INSERT INTO car_listings (
    title, description, price, mileage, model_year, brand, model,
    location_id, user_id, condition_id, body_style_id, transmission_id,
    fuel_type_id, drive_type_id
) 
SELECT 
    'Test Car 2023',
    'Basic test car listing',
    100000,
    10000,
    2023,
    'Test Brand',
    'Test Model',
    l.id,
    u.id,
    c.id,
    b.id,
    t.id,
    f.id,
    d.id
FROM 
    locations l,
    users u,
    car_conditions c,
    body_styles b,
    transmissions t,
    fuel_types f,
    drive_types d
WHERE 
    l.slug = 'test-location-1'
    AND u.username = 'john_test'
    AND c.name = 'excellent'
    AND b.name = 'sedan'
    AND t.name = 'automatic'
    AND f.name = 'gasoline'
    AND d.name = 'fwd'
LIMIT 1;
