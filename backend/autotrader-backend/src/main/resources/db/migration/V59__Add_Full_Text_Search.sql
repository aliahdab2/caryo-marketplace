-- ============================================================================
-- V59: Add PostgreSQL full-text search to car_listings
--
-- Replaces LIKE-based text search with tsvector/tsquery for:
--   - Proper tokenization (word boundaries, not substring matching)
--   - Weighted ranking (brand/model > title > description > location)
--   - GIN index for sub-millisecond search on large datasets
--   - Bilingual support (Arabic + English via 'simple' configuration)
--
-- The 'simple' text search configuration is used because:
--   - PostgreSQL has no built-in Arabic stemmer
--   - 'simple' tokenizes by whitespace and lowercases — works for any language
--   - It avoids stemming errors on Arabic morphology
-- ============================================================================

-- 1. Add the tsvector column (nullable, managed by trigger)
ALTER TABLE car_listings ADD COLUMN search_vector tsvector;

-- 2. Create trigger function to auto-update search_vector on INSERT/UPDATE
--    Weights: A = brand/model (most important), B = title, C = description, D = location
CREATE OR REPLACE FUNCTION car_listings_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', coalesce(NEW.brand_name_en, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(NEW.brand_name_ar, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(NEW.model_name_en, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(NEW.model_name_ar, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'B') ||
        setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'C') ||
        setweight(to_tsvector('simple', coalesce(NEW.governorate_name_en, '')), 'D') ||
        setweight(to_tsvector('simple', coalesce(NEW.governorate_name_ar, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger (fires on insert or update of searchable columns)
CREATE TRIGGER car_listings_search_vector_trigger
    BEFORE INSERT OR UPDATE OF title, description, brand_name_en, brand_name_ar,
                                model_name_en, model_name_ar, governorate_name_en, governorate_name_ar
    ON car_listings
    FOR EACH ROW
    EXECUTE FUNCTION car_listings_search_vector_update();

-- 4. Backfill existing rows
UPDATE car_listings SET search_vector =
    setweight(to_tsvector('simple', coalesce(brand_name_en, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(brand_name_ar, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(model_name_en, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(model_name_ar, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(title, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(governorate_name_en, '')), 'D') ||
    setweight(to_tsvector('simple', coalesce(governorate_name_ar, '')), 'D');

-- 5. Create GIN index for fast full-text search lookups
CREATE INDEX idx_car_listings_search_vector ON car_listings USING GIN (search_vector);
