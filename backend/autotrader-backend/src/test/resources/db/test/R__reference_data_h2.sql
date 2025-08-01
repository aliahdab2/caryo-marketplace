-- Migration R: reference_data (H2 Compatible)
-- Created: 2025-08-01 - H2 compatible version for tests
-- Uses INSERT ... ON CONFLICT syntax supported by both PostgreSQL and H2

-- Car Conditions
INSERT INTO car_conditions (name, display_name_en, display_name_ar, slug) VALUES 
    ('new', 'New', 'جديد', 'new'),
    ('like_new', 'Like New', 'شبه جديد', 'like-new'),
    ('excellent', 'Excellent', 'ممتاز', 'excellent'),
    ('very_good', 'Very Good', 'جيد جداً', 'very-good'),
    ('good', 'Good', 'جيد', 'good'),
    ('fair', 'Fair', 'مقبول', 'fair'),
    ('salvage', 'Salvage', 'للقطع', 'salvage')
ON CONFLICT (name) DO UPDATE SET 
    display_name_en = EXCLUDED.display_name_en,
    display_name_ar = EXCLUDED.display_name_ar,
    slug = EXCLUDED.slug;

-- Drive Types
INSERT INTO drive_types (name, display_name_en, display_name_ar, slug) VALUES 
    ('fwd', 'Front-Wheel Drive', 'دفع أمامي', 'fwd'),
    ('rwd', 'Rear-Wheel Drive', 'دفع خلفي', 'rwd'),
    ('awd', 'All-Wheel Drive', 'دفع رباعي', 'awd'),
    ('4wd', 'Four-Wheel Drive', 'دفع رباعي', '4wd')
ON CONFLICT (name) DO UPDATE SET 
    display_name_en = EXCLUDED.display_name_en,
    display_name_ar = EXCLUDED.display_name_ar,
    slug = EXCLUDED.slug;

-- Body Styles
INSERT INTO body_styles (name, display_name_en, display_name_ar, slug) VALUES 
    ('sedan', 'Sedan', 'سيدان', 'sedan'),
    ('suv', 'SUV', 'إس يو في', 'suv'),
    ('hatchback', 'Hatchback', 'هاتشباك', 'hatchback'),
    ('coupe', 'Coupe', 'كوبيه', 'coupe'),
    ('convertible', 'Convertible', 'قابل للتحويل', 'convertible'),
    ('wagon', 'Wagon', 'عربة', 'wagon'),
    ('pickup', 'Pickup Truck', 'شاحنة صغيرة', 'pickup'),
    ('van', 'Van', 'فان', 'van'),
    ('truck', 'Truck', 'شاحنة', 'truck')
ON CONFLICT (name) DO UPDATE SET 
    display_name_en = EXCLUDED.display_name_en,
    display_name_ar = EXCLUDED.display_name_ar,
    slug = EXCLUDED.slug;

-- Fuel Types
INSERT INTO fuel_types (name, display_name_en, display_name_ar, slug) VALUES 
    ('gasoline', 'Gasoline', 'بنزين', 'gasoline'),
    ('diesel', 'Diesel', 'ديزل', 'diesel'),
    ('electric', 'Electric', 'كهربائي', 'electric'),
    ('hybrid', 'Hybrid', 'هجين', 'hybrid'),
    ('plugin_hybrid', 'Plug-in Hybrid', 'هجين قابل للشحن', 'plugin-hybrid'),
    ('cng', 'CNG', 'غاز طبيعي مضغوط', 'cng'),
    ('lpg', 'LPG', 'غاز البترول المسال', 'lpg')
ON CONFLICT (name) DO UPDATE SET 
    display_name_en = EXCLUDED.display_name_en,
    display_name_ar = EXCLUDED.display_name_ar,
    slug = EXCLUDED.slug;

-- Transmissions
INSERT INTO transmissions (name, display_name_en, display_name_ar, slug) VALUES 
    ('manual', 'Manual', 'يدوي', 'manual'),
    ('automatic', 'Automatic', 'أوتوماتيك', 'automatic'),
    ('cvt', 'CVT', 'سي في تي', 'cvt'),
    ('semi_automatic', 'Semi-Automatic', 'شبه أوتوماتيك', 'semi-automatic')
ON CONFLICT (name) DO UPDATE SET 
    display_name_en = EXCLUDED.display_name_en,
    display_name_ar = EXCLUDED.display_name_ar,
    slug = EXCLUDED.slug;

-- Seller Types
INSERT INTO seller_types (name, display_name_en, display_name_ar, slug) VALUES 
    ('individual', 'Individual', 'فرد', 'individual'),
    ('dealer', 'Dealer', 'وكيل', 'dealer'),
    ('company', 'Company', 'شركة', 'company')
ON CONFLICT (name) DO UPDATE SET 
    display_name_en = EXCLUDED.display_name_en,
    display_name_ar = EXCLUDED.display_name_ar,
    slug = EXCLUDED.slug;