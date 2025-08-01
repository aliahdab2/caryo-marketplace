-- Migration R: reference_data (H2 Compatible)
-- Created: 2025-08-01 - H2 compatible version for tests
-- Uses simple DELETE/INSERT approach for H2 compatibility

-- Clear existing data first, then insert fresh data
DELETE FROM car_conditions;
DELETE FROM drive_types;
DELETE FROM body_styles;
DELETE FROM fuel_types;
DELETE FROM transmissions;
DELETE FROM seller_types;

-- Car Conditions
INSERT INTO car_conditions (name, display_name_en, display_name_ar, slug) VALUES 
    ('new', 'New', 'جديد', 'new'),
    ('like_new', 'Like New', 'شبه جديد', 'like-new'),
    ('excellent', 'Excellent', 'ممتاز', 'excellent'),
    ('very_good', 'Very Good', 'جيد جداً', 'very-good'),
    ('good', 'Good', 'جيد', 'good'),
    ('fair', 'Fair', 'مقبول', 'fair'),
    ('salvage', 'Salvage', 'للقطع', 'salvage');

-- Drive Types
INSERT INTO drive_types (name, display_name_en, display_name_ar, slug) VALUES 
    ('fwd', 'Front-Wheel Drive', 'دفع أمامي', 'fwd'),
    ('rwd', 'Rear-Wheel Drive', 'دفع خلفي', 'rwd'),
    ('awd', 'All-Wheel Drive', 'دفع رباعي', 'awd'),
    ('4wd', 'Four-Wheel Drive', 'دفع رباعي', '4wd');

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
    ('truck', 'Truck', 'شاحنة', 'truck');

-- Fuel Types
INSERT INTO fuel_types (name, display_name_en, display_name_ar, slug) VALUES 
    ('gasoline', 'Gasoline', 'بنزين', 'gasoline'),
    ('diesel', 'Diesel', 'ديزل', 'diesel'),
    ('electric', 'Electric', 'كهربائي', 'electric'),
    ('hybrid', 'Hybrid', 'هجين', 'hybrid'),
    ('plugin_hybrid', 'Plug-in Hybrid', 'هجين قابل للشحن', 'plugin-hybrid'),
    ('cng', 'CNG', 'غاز طبيعي مضغوط', 'cng'),
    ('lpg', 'LPG', 'غاز البترول المسال', 'lpg');

-- Transmissions
INSERT INTO transmissions (name, display_name_en, display_name_ar, slug) VALUES 
    ('manual', 'Manual', 'يدوي', 'manual'),
    ('automatic', 'Automatic', 'أوتوماتيك', 'automatic'),
    ('cvt', 'CVT', 'سي في تي', 'cvt'),
    ('semi_automatic', 'Semi-Automatic', 'شبه أوتوماتيك', 'semi-automatic');

-- Seller Types
INSERT INTO seller_types (name, display_name_en, display_name_ar, slug) VALUES 
    ('individual', 'Individual', 'فرد', 'individual'),
    ('dealer', 'Dealer', 'وكيل', 'dealer'),
    ('company', 'Company', 'شركة', 'company');