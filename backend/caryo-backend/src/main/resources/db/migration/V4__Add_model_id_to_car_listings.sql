-- V4__Add_model_id_to_car_listings.sql
-- Adds the missing model_id column to the car_listings table and its foreign key constraint,
-- and ensures it is NOT NULL as per the CarListing entity requirements.

-- Add the model_id column. Initially allows NULLs in case of existing data,
-- though for this project, R__sample_car_listings.sql should be the populator.
ALTER TABLE car_listings
ADD COLUMN model_id BIGINT;

-- Add the foreign key constraint.
-- This links car_listings.model_id to the id column in the models table.
ALTER TABLE car_listings
ADD CONSTRAINT fk_car_listings_model
FOREIGN KEY (model_id) REFERENCES models(id);

-- Update existing rows to have a default model_id if they are NULL.
-- This step is crucial before setting the column to NOT NULL if there's a possibility of
-- existing rows with NULL model_id. We'll pick a random model.
-- This is a fallback; R__sample_car_listings.sql should correctly populate this.
-- The DO $$...END $$; block was removed as it's not compatible with H2.
-- If models table is empty, this block would not have worked anyway.
-- R__sample_car_listings.sql is expected to populate model_id correctly.

-- Set the model_id column to NOT NULL.
-- This enforces the requirement from the CarListing entity.
-- This will fail if any rows still have a NULL model_id after the update step.
ALTER TABLE car_listings
ALTER COLUMN model_id SET NOT NULL;

