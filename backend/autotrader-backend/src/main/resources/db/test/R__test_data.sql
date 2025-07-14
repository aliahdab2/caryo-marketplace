-- Test Users

-- Test Users (H2-compatible) - Use existing user from sample data
-- The sample car listings already create a user with id=1, username='testuser', email='test@example.com'
-- We'll just reference that user instead of creating a new one

-- Test User Role for existing user
MERGE INTO user_roles (user_id, role_id)
KEY(user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'testuser' AND r.name = 'ROLE_USER';

-- Test Location
MERGE INTO locations (display_name_en, display_name_ar, slug, region, latitude, longitude)
KEY(slug)
VALUES ('Test Location', 'موقع اختبار', 'test-location', 'Test Region', 25.0, 55.0);

-- Single Test Car Listing
MERGE INTO car_listings (
    title, description, price, mileage, model_year,
    brand, model, location_id, seller_id, condition_id,
    body_style_id, transmission_id, fuel_type_id, drive_type_id
)
KEY(title)
SELECT 
    'Test Car',
    'Test car description',
    50000,
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
    l.slug = 'test-location'
    AND u.username = 'testuser'
    AND c.name = 'excellent'
    AND b.name = 'sedan'
    AND t.name = 'automatic'
    AND f.name = 'gasoline'
    AND d.name = 'fwd';

-- Test Car Image
MERGE INTO car_images (car_listing_id, image_url, sort_order, is_primary)
KEY(car_listing_id, image_url)
SELECT 
    cl.id,
    'https://test-bucket.s3.amazonaws.com/cars/test-car.jpg',
    1,
    true
FROM car_listings cl
WHERE cl.title = 'Test Car';
