-- Populate the denormalized brand and model fields for existing car listings
-- Based on the API response, we know these are the existing listings:
-- Toyota Camry 2020 (id: 6)
-- Toyota Corolla 2019 (id: 7) 
-- Honda Civic 2021 (id: 8)
-- Nissan Altima 2018 (id: 9)
-- Hyundai Elantra 2020 (id: 10)

-- Update Toyota Camry
UPDATE car_listings 
SET brand_name_en = 'Toyota', 
    brand_name_ar = 'تويوتا',
    model_name_en = 'Camry',
    model_name_ar = 'كامري'
WHERE id = 6;

-- Update Toyota Corolla
UPDATE car_listings 
SET brand_name_en = 'Toyota', 
    brand_name_ar = 'تويوتا',
    model_name_en = 'Corolla',
    model_name_ar = 'كورولا'
WHERE id = 7;

-- Update Honda Civic
UPDATE car_listings 
SET brand_name_en = 'Honda', 
    brand_name_ar = 'هوندا',
    model_name_en = 'Civic',
    model_name_ar = 'سيفيك'
WHERE id = 8;

-- Update Nissan Altima
UPDATE car_listings 
SET brand_name_en = 'Nissan', 
    brand_name_ar = 'نيسان',
    model_name_en = 'Altima',
    model_name_ar = 'التيما'
WHERE id = 9;

-- Update Hyundai Elantra
UPDATE car_listings 
SET brand_name_en = 'Hyundai', 
    brand_name_ar = 'هيونداي',
    model_name_en = 'Elantra',
    model_name_ar = 'إلانترا'
WHERE id = 10;
