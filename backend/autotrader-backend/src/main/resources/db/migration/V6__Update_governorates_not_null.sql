-- V6: Update governorates table to enforce NOT NULL constraints
-- This script ensures that if any data was inserted with NULLs before V1 was corrected,
-- it gets updated. It also attempts to add NOT NULL constraints if they were missed.

-- Update existing NULL values before applying NOT NULL constraints
-- These should ideally not exist if V1 was applied correctly with the new definitions.
UPDATE governorates
SET country_code = 'SY' -- Default to Syria as per V1 data
WHERE country_code IS NULL;

UPDATE governorates
SET display_name_en = 'N/A'
WHERE display_name_en IS NULL;

UPDATE governorates
SET display_name_ar = 'غير متوفر'
WHERE display_name_ar IS NULL;

-- Apply NOT NULL constraints if not already applied by V1
-- Hibernate will also attempt to do this based on the entity, but this makes it explicit.
-- Splitting into separate statements for H2 compatibility.
ALTER TABLE governorates
    ALTER COLUMN country_code SET NOT NULL;
ALTER TABLE governorates
    ALTER COLUMN display_name_en SET NOT NULL;
ALTER TABLE governorates
    ALTER COLUMN display_name_ar SET NOT NULL;
