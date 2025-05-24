-- Add one sample media item for each car listing (dev only)
INSERT INTO listing_media (
    listing_id, file_key, file_name, content_type, size, sort_order, is_primary, media_type, created_at
)
SELECT
    id,
    'listings/' || id || '/main.jpg',
    'main.jpg',
    'image/jpeg',
    123456, -- replace with actual file size if known
    0,
    TRUE,
    'image',
    NOW()
FROM car_listings
ON CONFLICT DO NOTHING;
-- Basic sample data for testing
-- Sample Users

-- Insert enough users to satisfy all seller_id references in car_listings
INSERT INTO users (id, username, email, password) 
VALUES 
  (1, 'john_test', 'john@test.example.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG'), -- password: password123
  (2, 'alice_test', 'alice@test.example.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG'), -- password: password123
  (3, 'bob_test', 'bob@test.example.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG') -- password: password123
ON CONFLICT (id) DO NOTHING;

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
    location_id, seller_id, condition_id, body_style_id, transmission_id,
    fuel_type_id, drive_type_id, approved, sold, archived
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
    d.id,
    true,
    false,
    false
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

INSERT INTO car_listings (
  id, title, description, price, mileage, model_year,
  brand, model, vin, stock_number, exterior_color,
  doors, cylinders, seller_id, location_id, approved, sold,
  archived, expiration_date, created_at, updated_at
) VALUES
(1, '2022 بي إم دبليو الفئة الثالثة للبيع', 'فرصة ممتازة، السعر قابل للتفاوض.', 23326.48, 95213, 2020, 'بي إم دبليو', 'الفئة الثالثة', 'B29FB546-F491-43C', 'STK1001', 'أحمر', 2, 4, 2, 1, TRUE, FALSE, FALSE, '2025-06-20 22:28:23', '2025-05-21 22:28:23', '2025-05-21 22:28:23'),
(2, '2019 نيسان باترول للبيع', 'صيانة دورية منتظمة لدى الوكالة.', 19364.14, 44206, 2022, 'نيسان', 'باترول', '0F8CDD8A-1808-447', 'STK1002', 'بيج', 4, 4, 3, 2, TRUE, FALSE, FALSE, '2025-06-20 22:28:23', '2025-05-21 22:28:23', '2025-05-21 22:28:23'),
(3, '2022 تويوتا كورولا للبيع', 'فرصة ممتازة، السعر قابل للتفاوض.', 23115.47, 96881, 2020, 'تويوتا', 'كورولا', '7FD470E9-F53C-461', 'STK1003', 'بيج', 4, 6, 1, 2, TRUE, FALSE, FALSE, '2025-06-20 22:28:23', '2025-05-21 22:28:23', '2025-05-21 22:28:23'),
(4, '2021 كيا سيراتو للبيع', 'فرصة ممتازة، السعر قابل للتفاوض.', 23809.14, 72300, 2019, 'كيا', 'سيراتو', '46A0B32F-F82A-475', 'STK1004', 'بيج', 2, 6, 3, 2, TRUE, FALSE, FALSE, '2025-06-20 22:28:23', '2025-05-21 22:28:23', '2025-05-21 22:28:23'),
(5, '2020 تويوتا كامري للبيع', 'مالك أول، السيارة نظيفة جداً.', 23291.01, 88811, 2019, 'تويوتا', 'كامري', '8DD8B55D-A01B-432', 'STK1005', 'أحمر', 4, 4, 2, 1, TRUE, FALSE, FALSE, '2025-06-20 22:28:23', '2025-05-21 22:28:23', '2025-05-21 22:28:23'),
(6, '2019 بي إم دبليو X5 للبيع', 'اقتصادية ومريحة جداً للمدينة.', 15452.85, 34722, 2024, 'بي إم دبليو', 'X5', '746C9D23-FF9E-405', 'STK1006', 'أحمر', 4, 6, 3, 1, TRUE, FALSE, FALSE, '2025-06-20 22:28:23', '2025-05-21 22:28:23', '2025-05-21 22:28:23'),
(7, '2021 مرسيدس GLA للبيع', 'كامل المواصفات، فتحة سقف، شاشة.', 25506.16, 15458, 2019, 'مرسيدس', 'GLA', '9275D4D3-433C-4B2', 'STK1007', 'أحمر', 4, 4, 2, 1, TRUE, FALSE, FALSE, '2025-06-20 22:28:23', '2025-05-21 22:28:23', '2025-05-21 22:28:23'),
(8, '2021 مرسيدس GLA للبيع', 'مواصفات خليجية، استخدام خفيف.', 28194.69, 88624, 2022, 'مرسيدس', 'GLA', '92B71384-A188-456', 'STK1008', 'بيج', 2, 6, 1, 1, TRUE, FALSE, FALSE, '2025-06-20 22:28:23', '2025-05-21 22:28:23', '2025-05-21 22:28:23'),
(9, '2021 كيا سيراتو للبيع', 'مواصفات خليجية، استخدام خفيف.', 18551.07, 52293, 2019, 'كيا', 'سيراتو', 'C866A241-A4E9-45F', 'STK1009', 'أزرق', 4, 4, 1, 1, TRUE, FALSE, FALSE, '2025-06-20 22:28:23', '2025-05-21 22:28:23', '2025-05-21 22:28:23'),
(10, '2020 كيا سبورتاج للبيع', 'مواصفات خليجية، استخدام خفيف.', 22115.02, 89251, 2019, 'كيا', 'سبورتاج', '483A9E4F-C3E6-49B', 'STK1010', 'فضي', 2, 4, 3, 1, TRUE, FALSE, FALSE, '2025-06-20 22:28:23', '2025-05-21 22:28:23', '2025-05-21 22:28:23'),
(11, '2022 تويوتا كامري للبيع', 'كامل المواصفات، فتحة سقف، شاشة.', 20966.25, 92744, 2024, 'تويوتا', 'كامري', 'C857D7D9-BB89-490', 'STK1011', 'أسود', 2, 6, 3, 2, TRUE, FALSE, FALSE, '2025-06-20 22:28:23', '2025-05-21 22:28:23', '2025-05-21 22:28:23'),
(12, '2022 هوندا CR-V للبيع', 'اقتصادية ومريحة جداً للمدينة.', 15782.07, 82903, 2023, 'هوندا', 'CR-V', '73D9EC94-A5C6-4CF', 'STK1012', 'أزرق', 2, 4, 3, 2, TRUE, FALSE, FALSE, '2025-06-20 22:28:23', '2025-05-21 22:28:23', '2025-05-21 22:28:23'),
(13, '2024 نيسان التيما للبيع', 'مالك أول، السيارة نظيفة جداً.', 17597.14, 85621, 2022, 'نيسان', 'التيما', '1072BD67-E5D4-4A1', 'STK1013', 'بيج', 2, 4, 3, 1, TRUE, FALSE, FALSE, '2025-06-20 22:28:23', '2025-05-21 22:28:23', '2025-05-21 22:28:23'),
(14, '2021 نيسان التيما للبيع', 'السيارة بحالة ممتازة بدون حوادث.', 26699.74, 91543, 2020, 'نيسان', 'التيما', 'B7085F37-494B-450', 'STK1014', 'أزرق', 2, 6, 2, 2, TRUE, FALSE, FALSE, '2025-06-20 22:28:23', '2025-05-21 22:28:23', '2025-05-21 22:28:23'),
(15, '2020 بي إم دبليو الفئة الخامسة للبيع', 'كامل المواصفات، فتحة سقف، شاشة.', 17368.03, 62377, 2023, 'بي إم دبليو', 'الفئة الخامسة', 'CAD61264-EACB-478', 'STK1015', 'أزرق', 4, 6, 1, 1, TRUE, FALSE, FALSE, '2025-06-20 22:28:23', '2025-05-21 22:28:23', '2025-05-21 22:28:23'),
(16, '2024 نيسان التيما للبيع', 'صيانة دورية منتظمة لدى الوكالة.', 29939.52, 24756, 2021, 'نيسان', 'التيما', '9F11999A-00B7-48E', 'STK1016', 'أزرق', 4, 6, 3, 1, TRUE, FALSE, FALSE, '2025-06-20 22:28:23', '2025-05-21 22:28:23', '2025-05-21 22:28:23'),
(17, '2021 بي إم دبليو الفئة الثالثة للبيع', 'مالك أول، السيارة نظيفة جداً.', 21608.6, 35654, 2019, 'بي إم دبليو', 'الفئة الثالثة', '93651013-39B5-45A', 'STK1017', 'أسود', 2, 4, 2, 1, TRUE, FALSE, FALSE, '2025-06-20 22:28:23', '2025-05-21 22:28:23', '2025-05-21 22:28:23'),
(18, '2019 مرسيدس GLA للبيع', 'صيانة دورية منتظمة لدى الوكالة.', 20600.57, 75489, 2021, 'مرسيدس', 'GLA', 'FCFE6EC0-6EA0-443', 'STK1018', 'بيج', 4, 4, 3, 2, TRUE, FALSE, FALSE, '2025-06-20 22:28:23', '2025-05-21 22:28:23', '2025-05-21 22:28:23'),
(19, '2021 هوندا CR-V للبيع', 'اقتصادية ومريحة جداً للمدينة.', 20916.82, 57334, 2021, 'هوندا', 'CR-V', '8E37AF40-9F00-4AC', 'STK1019', 'أبيض', 4, 4, 1, 1, TRUE, FALSE, FALSE, '2025-06-20 22:28:23', '2025-05-21 22:28:23', '2025-05-21 22:28:23'),
(20, '2023 هيونداي توسان للبيع', 'مالك أول، السيارة نظيفة جداً.', 27327.18, 11195, 2019, 'هيونداي', 'توسان', 'F2876ADE-9680-4E3', 'STK1020', 'بيج', 4, 6, 3, 1, TRUE, FALSE, FALSE, '2025-06-20 22:28:23', '2025-05-21 22:28:23', '2025-05-21 22:28:23')
ON CONFLICT (id) DO NOTHING;
