-- Add denormalized columns to car_listings table for faster queries and API responses
-- These columns will store the display names from related tables to avoid joins

ALTER TABLE car_listings ADD COLUMN brand_name_en VARCHAR(100);
ALTER TABLE car_listings ADD COLUMN brand_name_ar VARCHAR(100);
ALTER TABLE car_listings ADD COLUMN model_name_en VARCHAR(100);
ALTER TABLE car_listings ADD COLUMN model_name_ar VARCHAR(100);
ALTER TABLE car_listings ADD COLUMN governorate_name_en VARCHAR(100);
ALTER TABLE car_listings ADD COLUMN governorate_name_ar VARCHAR(100);

-- Create indexes for better search performance
CREATE INDEX idx_car_listings_brand_name_en ON car_listings(brand_name_en);
CREATE INDEX idx_car_listings_brand_name_ar ON car_listings(brand_name_ar);
CREATE INDEX idx_car_listings_model_name_en ON car_listings(model_name_en);
CREATE INDEX idx_car_listings_model_name_ar ON car_listings(model_name_ar);
CREATE INDEX idx_car_listings_governorate_name_en ON car_listings(governorate_name_en);
CREATE INDEX idx_car_listings_governorate_name_ar ON car_listings(governorate_name_ar);
