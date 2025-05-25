-- Seed Makes (Car Brands) with their models
-- Toyota
INSERT INTO makes (name, display_name_en, display_name_ar, slug, country_of_origin, logo_url, is_active, created_at, updated_at)
SELECT 'toyota', 'Toyota', 'تويوتا', 'toyota', 'Japan', NULL, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM makes WHERE name = 'toyota');

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'camry', 'Camry', 'كامري', 'toyota-camry', 2018, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'toyota' AND NOT EXISTS (SELECT 1 FROM models WHERE slug = 'toyota-camry');

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'corolla', 'Corolla', 'كورولا', 'toyota-corolla', 2019, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'toyota' AND NOT EXISTS (SELECT 1 FROM models WHERE slug = 'toyota-corolla');

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'rav4', 'RAV4', 'راف فور', 'toyota-rav4', 2019, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'toyota' AND NOT EXISTS (SELECT 1 FROM models WHERE slug = 'toyota-rav4');

-- Honda
INSERT INTO makes (name, display_name_en, display_name_ar, slug, country_of_origin, logo_url, is_active, created_at, updated_at)
SELECT 'honda', 'Honda', 'هوندا', 'honda', 'Japan', NULL, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM makes WHERE name = 'honda');

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'civic', 'Civic', 'سيفيك', 'honda-civic', 2016, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'honda' AND NOT EXISTS (SELECT 1 FROM models WHERE slug = 'honda-civic');

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'accord', 'Accord', 'أكورد', 'honda-accord', 2018, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'honda' AND NOT EXISTS (SELECT 1 FROM models WHERE slug = 'honda-accord');

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'crv', 'CR-V', 'سي آر في', 'honda-crv', 2017, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'honda' AND NOT EXISTS (SELECT 1 FROM models WHERE slug = 'honda-crv');

-- BMW
INSERT INTO makes (name, display_name_en, display_name_ar, slug, country_of_origin, logo_url, is_active, created_at, updated_at)
SELECT 'bmw', 'BMW', 'بي إم دبليو', 'bmw', 'Germany', NULL, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM makes WHERE name = 'bmw');

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, '3series', '3 Series', 'الفئة الثالثة', 'bmw-3series', 2019, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'bmw' AND NOT EXISTS (SELECT 1 FROM models WHERE slug = 'bmw-3series');

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, '5series', '5 Series', 'الفئة الخامسة', 'bmw-5series', 2017, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'bmw' AND NOT EXISTS (SELECT 1 FROM models WHERE slug = 'bmw-5series');

-- Mercedes-Benz
INSERT INTO makes (name, display_name_en, display_name_ar, slug, country_of_origin, logo_url, is_active, created_at, updated_at)
SELECT 'mercedes-benz', 'Mercedes-Benz', 'مرسيدس بنز', 'mercedes-benz', 'Germany', NULL, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM makes WHERE name = 'mercedes-benz');

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'cclass', 'C-Class', 'الفئة سي', 'mercedes-cclass', 2022, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'mercedes-benz' AND NOT EXISTS (SELECT 1 FROM models WHERE slug = 'mercedes-cclass');

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'eclass', 'E-Class', 'الفئة إي', 'mercedes-eclass', 2021, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'mercedes-benz' AND NOT EXISTS (SELECT 1 FROM models WHERE slug = 'mercedes-eclass');

-- Hyundai
INSERT INTO makes (name, display_name_en, display_name_ar, slug, country_of_origin, logo_url, is_active, created_at, updated_at)
SELECT 'hyundai', 'Hyundai', 'هيونداي', 'hyundai', 'South Korea', NULL, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM makes WHERE name = 'hyundai');

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'elantra', 'Elantra', 'إلنترا', 'hyundai-elantra', 2021, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'hyundai' AND NOT EXISTS (SELECT 1 FROM models WHERE slug = 'hyundai-elantra');

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'sonata', 'Sonata', 'سوناتا', 'hyundai-sonata', 2020, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'hyundai' AND NOT EXISTS (SELECT 1 FROM models WHERE slug = 'hyundai-sonata');

-- Kia
INSERT INTO makes (name, display_name_en, display_name_ar, slug, country_of_origin, logo_url, is_active, created_at, updated_at)
SELECT 'kia', 'Kia', 'كيا', 'kia', 'South Korea', NULL, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM makes WHERE name = 'kia');

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'k5', 'K5', 'كي 5', 'kia-k5', 2021, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'kia' AND NOT EXISTS (SELECT 1 FROM models WHERE slug = 'kia-k5');

INSERT INTO models (make_id, name, display_name_en, display_name_ar, slug, year_start, year_end, is_active, created_at, updated_at)
SELECT m.id, 'sportage', 'Sportage', 'سبورتاج', 'kia-sportage', 2023, NULL, TRUE, NOW(), NOW()
FROM makes m WHERE m.name = 'kia' AND NOT EXISTS (SELECT 1 FROM models WHERE slug = 'kia-sportage');
