-- Migration R: reference_data
-- Created: 2025-05-22

-- Car Conditions
MERGE INTO car_conditions AS t USING (VALUES ('new', 'New', 'جديد')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO car_conditions AS t USING (VALUES ('like_new', 'Like New', 'شبه جديد')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO car_conditions AS t USING (VALUES ('excellent', 'Excellent', 'ممتاز')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO car_conditions AS t USING (VALUES ('very_good', 'Very Good', 'جيد جداً')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO car_conditions AS t USING (VALUES ('good', 'Good', 'جيد')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO car_conditions AS t USING (VALUES ('fair', 'Fair', 'مقبول')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

-- Drive Types
MERGE INTO drive_types AS t USING (VALUES ('fwd', 'Front-Wheel Drive', 'دفع أمامي')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO drive_types AS t USING (VALUES ('rwd', 'Rear-Wheel Drive', 'دفع خلفي')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO drive_types AS t USING (VALUES ('awd', 'All-Wheel Drive', 'دفع رباعي')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO drive_types AS t USING (VALUES ('4wd', 'Four-Wheel Drive', 'دفع رباعي')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

-- Body Styles
MERGE INTO body_styles AS t USING (VALUES ('sedan', 'Sedan', 'سيدان')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO body_styles AS t USING (VALUES ('suv', 'SUV', 'إس يو في')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO body_styles AS t USING (VALUES ('hatchback', 'Hatchback', 'هاتشباك')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO body_styles AS t USING (VALUES ('coupe', 'Coupe', 'كوبيه')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO body_styles AS t USING (VALUES ('pickup', 'Pickup Truck', 'بيك أب')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO body_styles AS t USING (VALUES ('convertible', 'Convertible', 'مكشوفة')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO body_styles AS t USING (VALUES ('wagon', 'Wagon', 'ستيشن')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO body_styles AS t USING (VALUES ('van', 'Van', 'فان')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO body_styles AS t USING (VALUES ('minivan', 'Minivan', 'ميني فان')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO body_styles AS t USING (VALUES ('crossover', 'Crossover', 'كروس أوفر')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

-- Fuel Types
MERGE INTO fuel_types AS t USING (VALUES ('gasoline', 'Gasoline', 'بنزين')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO fuel_types AS t USING (VALUES ('diesel', 'Diesel', 'ديزل')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO fuel_types AS t USING (VALUES ('hybrid', 'Hybrid', 'هجين')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO fuel_types AS t USING (VALUES ('electric', 'Electric', 'كهرباء')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO fuel_types AS t USING (VALUES ('cng', 'CNG', 'غاز طبيعي')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO fuel_types AS t USING (VALUES ('lpg', 'LPG', 'غاز مسال')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

-- Transmissions
MERGE INTO transmissions AS t USING (VALUES ('automatic', 'Automatic', 'أوتوماتيك')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO transmissions AS t USING (VALUES ('manual', 'Manual', 'عادي')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO transmissions AS t USING (VALUES ('cvt', 'CVT', 'تعشيق مستمر')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO transmissions AS t USING (VALUES ('semi_auto', 'Semi-Automatic', 'نصف أوتوماتيك')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

MERGE INTO transmissions AS t USING (VALUES ('dual_clutch', 'Dual Clutch', 'ثنائي القابض')) AS s(name, display_name_en, display_name_ar) ON t.name = s.name
WHEN MATCHED THEN UPDATE SET display_name_en = s.display_name_en, display_name_ar = s.display_name_ar
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar) VALUES (s.name, s.display_name_en, s.display_name_ar);

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
