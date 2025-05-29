-- Migration R: reference_data (PostgreSQL version)
-- Created: 2025-05-29
-- PostgreSQL 16 version of reference data - Using MERGE syntax

-- Car Conditions
MERGE INTO car_conditions target
USING (VALUES 
    ('new', 'New', 'جديد', 'new')
) AS source (name, display_name_en, display_name_ar, slug)
ON target.name = source.name
WHEN MATCHED THEN
    UPDATE SET 
        display_name_en = source.display_name_en,
        display_name_ar = source.display_name_ar,
    slug = EXCLUDED.slug;
