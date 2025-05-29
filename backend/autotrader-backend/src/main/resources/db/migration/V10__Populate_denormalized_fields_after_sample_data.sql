-- Populate the denormalized brand and model fields for existing car listings
-- This migration runs after the sample data has been loaded via repeatable migrations

-- Update all car listings with denormalized brand and model names
-- These updates are based on the current sample data structure

-- Update Toyota Camry (id: 6)
UPDATE car_listings 
SET brand_name_en = 'Toyota', 
    brand_name_ar = 'تويوتا',
    model_name_en = 'Camry',
    model_name_ar = 'كامري'
WHERE id = 6 AND brand = 'Toyota' AND model = 'Camry';

-- Update Toyota Corolla (id: 7)
UPDATE car_listings 
SET brand_name_en = 'Toyota', 
    brand_name_ar = 'تويوتا',
    model_name_en = 'Corolla',
    model_name_ar = 'كورولا'
WHERE id = 7 AND brand = 'Toyota' AND model = 'Corolla';

-- Update Honda Civic (id: 8)
UPDATE car_listings 
SET brand_name_en = 'Honda', 
    brand_name_ar = 'هوندا',
    model_name_en = 'Civic',
    model_name_ar = 'سيفيك'
WHERE id = 8 AND brand = 'Honda' AND model = 'Civic';

-- Update Nissan Altima (id: 9)
UPDATE car_listings 
SET brand_name_en = 'Nissan', 
    brand_name_ar = 'نيسان',
    model_name_en = 'Altima',
    model_name_ar = 'التيما'
WHERE id = 9 AND brand = 'Nissan' AND model = 'Altima';

-- Update Hyundai Elantra (id: 10)
UPDATE car_listings 
SET brand_name_en = 'Hyundai', 
    brand_name_ar = 'هيونداي',
    model_name_en = 'Elantra',
    model_name_ar = 'إلانترا'
WHERE id = 10 AND brand = 'Hyundai' AND model = 'Elantra';

-- Generic update for any future car listings that may be added via sample data
-- This will populate denormalized fields based on existing brand/model values for common brands
UPDATE car_listings 
SET 
    brand_name_en = CASE 
        WHEN LOWER(brand) = 'toyota' THEN 'Toyota'
        WHEN LOWER(brand) = 'honda' THEN 'Honda'
        WHEN LOWER(brand) = 'nissan' THEN 'Nissan'
        WHEN LOWER(brand) = 'hyundai' THEN 'Hyundai'
        WHEN LOWER(brand) = 'ford' THEN 'Ford'
        WHEN LOWER(brand) = 'chevrolet' THEN 'Chevrolet'
        WHEN LOWER(brand) = 'bmw' THEN 'BMW'
        WHEN LOWER(brand) = 'mercedes' THEN 'Mercedes-Benz'
        WHEN LOWER(brand) = 'audi' THEN 'Audi'
        WHEN LOWER(brand) = 'volkswagen' THEN 'Volkswagen'
        ELSE brand  -- fallback to original brand value
    END,
    brand_name_ar = CASE 
        WHEN LOWER(brand) = 'toyota' THEN 'تويوتا'
        WHEN LOWER(brand) = 'honda' THEN 'هوندا'
        WHEN LOWER(brand) = 'nissan' THEN 'نيسان'
        WHEN LOWER(brand) = 'hyundai' THEN 'هيونداي'
        WHEN LOWER(brand) = 'ford' THEN 'فورد'
        WHEN LOWER(brand) = 'chevrolet' THEN 'شيفروليه'
        WHEN LOWER(brand) = 'bmw' THEN 'بي إم دبليو'
        WHEN LOWER(brand) = 'mercedes' THEN 'مرسيدس بنز'
        WHEN LOWER(brand) = 'audi' THEN 'أودي'
        WHEN LOWER(brand) = 'volkswagen' THEN 'فولكس فاجن'
        ELSE brand  -- fallback to original brand value
    END,
    model_name_en = model,  -- Copy model to model_name_en
    model_name_ar = CASE 
        WHEN LOWER(brand) = 'toyota' AND LOWER(model) = 'camry' THEN 'كامري'
        WHEN LOWER(brand) = 'toyota' AND LOWER(model) = 'corolla' THEN 'كورولا'
        WHEN LOWER(brand) = 'honda' AND LOWER(model) = 'civic' THEN 'سيفيك'
        WHEN LOWER(brand) = 'nissan' AND LOWER(model) = 'altima' THEN 'التيما'
        WHEN LOWER(brand) = 'hyundai' AND LOWER(model) = 'elantra' THEN 'إلانترا'
        ELSE model  -- fallback to original model value
    END
WHERE brand_name_en IS NULL OR brand_name_en = '';
