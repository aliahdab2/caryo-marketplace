-- V11__Fix_brand_column_constraint.sql
-- Remove NOT NULL constraints from brand and model columns since we're using denormalized fields
-- This migration fixes the issue where new listings fail due to brand/model columns being null

-- First, update any existing NULL brand values to use the brand name from the denormalized field
UPDATE car_listings 
SET brand = brand_name_en 
WHERE brand IS NULL AND brand_name_en IS NOT NULL;

-- Update any existing NULL model values to use the model name from the denormalized field
UPDATE car_listings 
SET model = model_name_en 
WHERE model IS NULL AND model_name_en IS NOT NULL;

-- For any remaining NULL values, set defaults
UPDATE car_listings 
SET brand = 'Unknown' 
WHERE brand IS NULL;

UPDATE car_listings 
SET model = 'Unknown' 
WHERE model IS NULL;

-- Remove the NOT NULL constraints from the brand and model columns
ALTER TABLE car_listings ALTER COLUMN brand DROP NOT NULL;
ALTER TABLE car_listings ALTER COLUMN model DROP NOT NULL;

-- Add comments to indicate these columns are deprecated
COMMENT ON COLUMN car_listings.brand IS 'Deprecated - use brand_name_en/brand_name_ar instead';
COMMENT ON COLUMN car_listings.model IS 'Deprecated - use model_name_en/model_name_ar instead';
