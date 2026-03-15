-- Migration R: reference_data (H2 Compatible)
-- Created: 2025-08-01 - H2 compatible version for tests
-- Uses H2's atomic MERGE syntax for safe, idempotent operations

-- Car Conditions
MERGE INTO car_conditions
USING (VALUES
    ('new', 'New', 'جديد', 'new'),
    ('like_new', 'Like New', 'شبه جديد', 'like-new'),
    ('excellent', 'Excellent', 'ممتاز', 'excellent'),
    ('very_good', 'Very Good', 'جيد جداً', 'very-good'),
    ('good', 'Good', 'جيد', 'good'),
    ('fair', 'Fair', 'مقبول', 'fair'),
    ('salvage', 'Salvage', 'للقطع', 'salvage')
) I (name, display_name_en, display_name_ar, slug)
ON (car_conditions.name = I.name)
WHEN MATCHED THEN UPDATE SET
    display_name_en = I.display_name_en,
    display_name_ar = I.display_name_ar,
    slug = I.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug)
    VALUES (I.name, I.display_name_en, I.display_name_ar, I.slug);

-- Drive Types
MERGE INTO drive_types
USING (VALUES
    ('fwd', 'Front-Wheel Drive', 'دفع أمامي', 'fwd'),
    ('rwd', 'Rear-Wheel Drive', 'دفع خلفي', 'rwd'),
    ('awd', 'All-Wheel Drive', 'دفع رباعي', 'awd'),
    ('4wd', 'Four-Wheel Drive', 'دفع رباعي', '4wd')
) I (name, display_name_en, display_name_ar, slug)
ON (drive_types.name = I.name)
WHEN MATCHED THEN UPDATE SET
    display_name_en = I.display_name_en,
    display_name_ar = I.display_name_ar,
    slug = I.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug)
    VALUES (I.name, I.display_name_en, I.display_name_ar, I.slug);

-- Body Styles
MERGE INTO body_styles
USING (VALUES
    ('sedan', 'Sedan', 'سيدان', 'sedan'),
    ('suv', 'SUV', 'إس يو في', 'suv'),
    ('hatchback', 'Hatchback', 'هاتشباك', 'hatchback'),
    ('coupe', 'Coupe', 'كوبيه', 'coupe'),
    ('convertible', 'Convertible', 'قابل للتحويل', 'convertible'),
    ('wagon', 'Wagon', 'عربة', 'wagon'),
    ('pickup', 'Pickup Truck', 'شاحنة صغيرة', 'pickup'),
    ('van', 'Van', 'فان', 'van'),
    ('truck', 'Truck', 'شاحنة', 'truck')
) I (name, display_name_en, display_name_ar, slug)
ON (body_styles.name = I.name)
WHEN MATCHED THEN UPDATE SET
    display_name_en = I.display_name_en,
    display_name_ar = I.display_name_ar,
    slug = I.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug)
    VALUES (I.name, I.display_name_en, I.display_name_ar, I.slug);

-- Fuel Types
MERGE INTO fuel_types
USING (VALUES
    ('gasoline', 'Gasoline', 'بنزين', 'gasoline'),
    ('diesel', 'Diesel', 'ديزل', 'diesel'),
    ('electric', 'Electric', 'كهربائي', 'electric'),
    ('hybrid', 'Hybrid', 'هجين', 'hybrid'),
    ('plugin_hybrid', 'Plug-in Hybrid', 'هجين قابل للشحن', 'plugin-hybrid'),
    ('cng', 'CNG', 'غاز طبيعي مضغوط', 'cng'),
    ('lpg', 'LPG', 'غاز البترول المسال', 'lpg')
) I (name, display_name_en, display_name_ar, slug)
ON (fuel_types.name = I.name)
WHEN MATCHED THEN UPDATE SET
    display_name_en = I.display_name_en,
    display_name_ar = I.display_name_ar,
    slug = I.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug)
    VALUES (I.name, I.display_name_en, I.display_name_ar, I.slug);

-- Transmissions
MERGE INTO transmissions
USING (VALUES
    ('manual', 'Manual', 'يدوي', 'manual'),
    ('automatic', 'Automatic', 'أوتوماتيك', 'automatic'),
    ('cvt', 'CVT', 'سي في تي', 'cvt'),
    ('semi_automatic', 'Semi-Automatic', 'شبه أوتوماتيك', 'semi-automatic')
) I (name, display_name_en, display_name_ar, slug)
ON (transmissions.name = I.name)
WHEN MATCHED THEN UPDATE SET
    display_name_en = I.display_name_en,
    display_name_ar = I.display_name_ar,
    slug = I.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug)
    VALUES (I.name, I.display_name_en, I.display_name_ar, I.slug);

-- Seller Types
MERGE INTO seller_types
USING (VALUES
    ('individual', 'Individual', 'فرد', 'individual'),
    ('dealer', 'Dealer', 'وكيل', 'dealer'),
    ('company', 'Company', 'شركة', 'company')
) I (name, display_name_en, display_name_ar, slug)
ON (seller_types.name = I.name)
WHEN MATCHED THEN UPDATE SET
    display_name_en = I.display_name_en,
    display_name_ar = I.display_name_ar,
    slug = I.slug
WHEN NOT MATCHED THEN INSERT (name, display_name_en, display_name_ar, slug)
    VALUES (I.name, I.display_name_en, I.display_name_ar, I.slug);