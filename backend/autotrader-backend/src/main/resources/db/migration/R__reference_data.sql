-- Migration R: reference_data
-- Created: 2025-05-22

-- Car Conditions
MERGE INTO car_conditions AS t USING (VALUES ('new', 'New', 'جديد', 'new')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO car_conditions AS t USING (VALUES ('like_new', 'Like New', 'شبه جديد', 'like-new')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO car_conditions AS t USING (VALUES ('excellent', 'Excellent', 'ممتاز', 'excellent')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO car_conditions AS t USING (VALUES ('very_good', 'Very Good', 'جيد جداً', 'very-good')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO car_conditions AS t USING (VALUES ('good', 'Good', 'جيد', 'good')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO car_conditions AS t USING (VALUES ('fair', 'Fair', 'مقبول', 'fair')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

-- Drive Types
MERGE INTO drive_types AS t USING (VALUES ('fwd', 'Front-Wheel Drive', 'دفع أمامي', 'fwd')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO drive_types AS t USING (VALUES ('rwd', 'Rear-Wheel Drive', 'دفع خلفي', 'rwd')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO drive_types AS t USING (VALUES ('awd', 'All-Wheel Drive', 'دفع رباعي', 'awd')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO drive_types AS t USING (VALUES ('4wd', 'Four-Wheel Drive', 'دفع رباعي', '4wd')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

-- Body Styles
MERGE INTO body_styles AS t USING (VALUES ('sedan', 'Sedan', 'سيدان', 'sedan')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO body_styles AS t USING (VALUES ('suv', 'SUV', 'إس يو في', 'suv')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO body_styles AS t USING (VALUES ('hatchback', 'Hatchback', 'هاتشباك', 'hatchback')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO body_styles AS t USING (VALUES ('coupe', 'Coupe', 'كوبيه', 'coupe')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO body_styles AS t USING (VALUES ('pickup', 'Pickup Truck', 'بيك أب', 'pickup')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO body_styles AS t USING (VALUES ('convertible', 'Convertible', 'مكشوفة', 'convertible')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO body_styles AS t USING (VALUES ('wagon', 'Wagon', 'ستيشن', 'wagon')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO body_styles AS t USING (VALUES ('van', 'Van', 'فان', 'van')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO body_styles AS t USING (VALUES ('minivan', 'Minivan', 'ميني فان', 'minivan')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO body_styles AS t USING (VALUES ('crossover', 'Crossover', 'كروس أوفر', 'crossover')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

-- Fuel Types
MERGE INTO fuel_types AS t USING (VALUES ('gasoline', 'Gasoline', 'بنزين', 'gasoline')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO fuel_types AS t USING (VALUES ('diesel', 'Diesel', 'ديزل', 'diesel')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO fuel_types AS t USING (VALUES ('hybrid', 'Hybrid', 'هجين', 'hybrid')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO fuel_types AS t USING (VALUES ('electric', 'Electric', 'كهرباء', 'electric')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO fuel_types AS t USING (VALUES ('cng', 'CNG', 'غاز طبيعي', 'cng')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO fuel_types AS t USING (VALUES ('lpg', 'LPG', 'غاز مسال', 'lpg')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

-- Transmissions
MERGE INTO transmissions AS t USING (VALUES ('automatic', 'Automatic', 'أوتوماتيك', 'automatic')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO transmissions AS t USING (VALUES ('manual', 'Manual', 'عادي', 'manual')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO transmissions AS t USING (VALUES ('cvt', 'CVT', 'تعشيق مستمر', 'cvt')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO transmissions AS t USING (VALUES ('semi_auto', 'Semi-Automatic', 'نصف أوتوماتيك', 'semi-auto')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

MERGE INTO transmissions AS t USING (VALUES ('dual_clutch', 'Dual Clutch', 'ثنائي القابض', 'dual-clutch')) AS s(name, display_name_en, display_name_ar, slug) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar, slug = s.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug) VALUES (s.name, s.display_name_en, s.display_name_ar, s.slug);

-- Seller Types
CREATE TABLE IF NOT EXISTS seller_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    display_name_en VARCHAR(50) NOT NULL,
    display_name_ar VARCHAR(50) NOT NULL
);

MERGE INTO seller_types AS t USING (VALUES ('private', 'Private Seller', 'بائع خاص')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO seller_types AS t USING (VALUES ('dealer', 'Dealer', 'معرض سيارات')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO seller_types AS t USING (VALUES ('certified', 'Certified Dealer', 'معرض معتمد')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);
