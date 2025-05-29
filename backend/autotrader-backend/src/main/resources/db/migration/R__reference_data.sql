-- Migration R: reference_data
-- Created: 2025-05-22
-- Updated: 2025-05-29 - Using PostgreSQL 16 MERGE syntax

-- Car Conditions
MERGE INTO car_conditions target
USING (VALUES 
    ('new', 'New', 'جديد', 'new'),
    ('like_new', 'Like New', 'شبه جديد', 'like-new'),
    ('excellent', 'Excellent', 'ممتاز', 'excellent'),
    ('very_good', 'Very Good', 'جيد جداً', 'very-good'),
    ('good', 'Good', 'جيد', 'good'),
    ('fair', 'Fair', 'مقبول', 'fair'),
    ('salvage', 'Salvage', 'للقطع', 'salvage')
) AS source (name, display_name_en, display_name_ar, slug)
ON target.name = source.name
WHEN MATCHED THEN
    UPDATE SET 
        display_name_en = source.display_name_en,
        display_name_ar = source.display_name_ar,
        slug = source.slug
WHEN NOT MATCHED THEN
    INSERT (name, display_name_en, display_name_ar, slug)
    VALUES (source.name, source.display_name_en, source.display_name_ar, source.slug);

-- Drive Types
MERGE INTO drive_types target
USING (VALUES 
    ('fwd', 'Front-Wheel Drive', 'دفع أمامي', 'fwd'),
    ('rwd', 'Rear-Wheel Drive', 'دفع خلفي', 'rwd'),
    ('awd', 'All-Wheel Drive', 'دفع رباعي', 'awd'),
    ('4wd', 'Four-Wheel Drive', 'دفع رباعي', '4wd')
) AS source (name, display_name_en, display_name_ar, slug)
ON target.name = source.name
WHEN MATCHED THEN
    UPDATE SET 
        display_name_en = source.display_name_en,
        display_name_ar = source.display_name_ar,
        slug = source.slug
WHEN NOT MATCHED THEN
    INSERT (name, display_name_en, display_name_ar, slug)
    VALUES (source.name, source.display_name_en, source.display_name_ar, source.slug);

-- Body Styles
MERGE INTO body_styles target
USING (VALUES 
    ('sedan', 'Sedan', 'سيدان', 'sedan'),
    ('suv', 'SUV', 'إس يو في', 'suv'),
    ('hatchback', 'Hatchback', 'هاتشباك', 'hatchback'),
    ('coupe', 'Coupe', 'كوبيه', 'coupe'),
    ('pickup', 'Pickup Truck', 'بيك أب', 'pickup'),
    ('convertible', 'Convertible', 'مكشوفة', 'convertible'),
    ('wagon', 'Wagon', 'ستيشن', 'wagon'),
    ('van', 'Van', 'فان', 'van'),
    ('minivan', 'Minivan', 'ميني فان', 'minivan'),
    ('crossover', 'Crossover', 'كروس أوفر', 'crossover')
) AS source (name, display_name_en, display_name_ar, slug)
ON target.name = source.name
WHEN MATCHED THEN
    UPDATE SET 
        display_name_en = source.display_name_en,
        display_name_ar = source.display_name_ar,
        slug = source.slug
WHEN NOT MATCHED THEN
    INSERT (name, display_name_en, display_name_ar, slug)
    VALUES (source.name, source.display_name_en, source.display_name_ar, source.slug);

-- Fuel Types
MERGE INTO fuel_types target
USING (VALUES 
    ('gasoline', 'Gasoline', 'بنزين', 'gasoline'),
    ('diesel', 'Diesel', 'ديزل', 'diesel'),
    ('hybrid', 'Hybrid', 'هجين', 'hybrid'),
    ('electric', 'Electric', 'كهرباء', 'electric'),
    ('cng', 'CNG', 'غاز طبيعي', 'cng'),
    ('lpg', 'LPG', 'غاز مسال', 'lpg')
) AS source (name, display_name_en, display_name_ar, slug)
ON target.name = source.name
WHEN MATCHED THEN
    UPDATE SET 
        display_name_en = source.display_name_en,
        display_name_ar = source.display_name_ar,
        slug = source.slug
WHEN NOT MATCHED THEN
    INSERT (name, display_name_en, display_name_ar, slug)
    VALUES (source.name, source.display_name_en, source.display_name_ar, source.slug);

-- Transmissions
MERGE INTO transmissions target
USING (VALUES 
    ('automatic', 'Automatic', 'أوتوماتيك', 'automatic'),
    ('manual', 'Manual', 'عادي', 'manual'),
    ('cvt', 'CVT', 'تعشيق مستمر', 'cvt'),
    ('semi_auto', 'Semi-Automatic', 'نصف أوتوماتيك', 'semi-auto'),
    ('dual_clutch', 'Dual Clutch', 'ثنائي القابض', 'dual-clutch')
) AS source (name, display_name_en, display_name_ar, slug)
ON target.name = source.name
WHEN MATCHED THEN
    UPDATE SET 
        display_name_en = source.display_name_en,
        display_name_ar = source.display_name_ar,
        slug = source.slug
WHEN NOT MATCHED THEN
    INSERT (name, display_name_en, display_name_ar, slug)
    VALUES (source.name, source.display_name_en, source.display_name_ar, source.slug);

-- Seller Types
CREATE TABLE IF NOT EXISTS seller_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    display_name_en VARCHAR(50) NOT NULL,
    display_name_ar VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL
);

MERGE INTO seller_types target
USING (VALUES 
    ('private', 'Private Seller', 'بائع خاص', 'private'),
    ('dealer', 'Dealer', 'معرض سيارات', 'dealer'),
    ('certified', 'Certified Dealer', 'معرض معتمد', 'certified')
) AS source (name, display_name_en, display_name_ar, slug)
ON target.name = source.name
WHEN MATCHED THEN
    UPDATE SET 
        display_name_en = source.display_name_en,
        display_name_ar = source.display_name_ar,
        slug = source.slug
WHEN NOT MATCHED THEN
    INSERT (name, display_name_en, display_name_ar, slug)
    VALUES (source.name, source.display_name_en, source.display_name_ar, source.slug);
