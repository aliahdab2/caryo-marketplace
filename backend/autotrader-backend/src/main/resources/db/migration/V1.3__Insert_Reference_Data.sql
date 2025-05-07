-- Insert initial car conditions
DELETE FROM car_conditions WHERE name IN ('new', 'like_new', 'excellent', 'very_good', 'good', 'fair');
INSERT INTO car_conditions (name, display_name_en, display_name_ar) VALUES
('new', 'New', 'جديد'),
('like_new', 'Like New', 'شبه جديد'),
('excellent', 'Excellent', 'ممتاز'),
('very_good', 'Very Good', 'جيد جداً'),
('good', 'Good', 'جيد'),
('fair', 'Fair', 'مقبول');

-- Insert initial drive types
DELETE FROM drive_types WHERE name IN ('fwd', 'rwd', 'awd', '4wd');
INSERT INTO drive_types (name, display_name_en, display_name_ar) VALUES
('fwd', 'Front-Wheel Drive', 'دفع أمامي'),
('rwd', 'Rear-Wheel Drive', 'دفع خلفي'),
('awd', 'All-Wheel Drive', 'دفع رباعي'),
('4wd', 'Four-Wheel Drive', 'دفع رباعي');

-- Insert initial body styles
DELETE FROM body_styles WHERE name IN ('sedan', 'suv', 'hatchback', 'coupe', 'pickup', 'convertible', 'wagon', 'van', 'minivan', 'crossover');
INSERT INTO body_styles (name, display_name_en, display_name_ar) VALUES
('sedan', 'Sedan', 'سيدان'),
('suv', 'SUV', 'إس يو في'),
('hatchback', 'Hatchback', 'هاتشباك'),
('coupe', 'Coupe', 'كوبيه'),
('pickup', 'Pickup Truck', 'بيك أب'),
('convertible', 'Convertible', 'مكشوفة'),
('wagon', 'Wagon', 'ستيشن'),
('van', 'Van', 'فان'),
('minivan', 'Minivan', 'ميني فان'),
('crossover', 'Crossover', 'كروس أوفر');

-- Insert initial fuel types
DELETE FROM fuel_types WHERE name IN ('gasoline', 'diesel', 'hybrid', 'electric', 'cng', 'lpg');
INSERT INTO fuel_types (name, display_name_en, display_name_ar) VALUES
('gasoline', 'Gasoline', 'بنزين'),
('diesel', 'Diesel', 'ديزل'),
('hybrid', 'Hybrid', 'هجين'),
('electric', 'Electric', 'كهرباء'),
('cng', 'CNG', 'غاز طبيعي'),
('lpg', 'LPG', 'غاز مسال');

-- Insert initial transmissions
DELETE FROM transmissions WHERE name IN ('automatic', 'manual', 'cvt', 'semi_auto', 'dual_clutch');
INSERT INTO transmissions (name, display_name_en, display_name_ar) VALUES
('automatic', 'Automatic', 'أوتوماتيك'),
('manual', 'Manual', 'عادي'),
('cvt', 'CVT', 'تعشيق مستمر'),
('semi_auto', 'Semi-Automatic', 'نصف أوتوماتيك'),
('dual_clutch', 'Dual Clutch', 'ثنائي القابض');

-- Insert initial seller types
DELETE FROM seller_types WHERE name IN ('private', 'dealer', 'certified');
INSERT INTO seller_types (name, display_name_en, display_name_ar) VALUES
('private', 'Private Seller', 'بائع خاص'),
('dealer', 'Dealer', 'معرض سيارات'),
('certified', 'Certified Dealer', 'معرض معتمد');
