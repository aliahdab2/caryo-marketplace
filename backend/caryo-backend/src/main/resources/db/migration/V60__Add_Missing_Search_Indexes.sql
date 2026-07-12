-- ============================================================================
-- V60: Add missing indexes for hot search filter/sort columns
--
-- CarListingSpecification range-filters on price and mileage, and the UI
-- sorts by price/created_at, but none of these columns were indexed.
-- PostgreSQL does not auto-index foreign keys, so the FK columns used by
-- search filters (model, governorate, transmission, fuel type, body style)
-- also need explicit indexes to avoid sequential scans on joins.
-- ============================================================================

-- Range filters and sorting
CREATE INDEX IF NOT EXISTS idx_car_listings_price ON car_listings(price);
CREATE INDEX IF NOT EXISTS idx_car_listings_mileage ON car_listings(mileage);
CREATE INDEX IF NOT EXISTS idx_car_listings_created_at ON car_listings(created_at);

-- Foreign keys used in search filter joins
CREATE INDEX IF NOT EXISTS idx_car_listings_model ON car_listings(model_id);
CREATE INDEX IF NOT EXISTS idx_car_listings_governorate ON car_listings(governorate_id);
CREATE INDEX IF NOT EXISTS idx_car_listings_transmission ON car_listings(transmission_id);
CREATE INDEX IF NOT EXISTS idx_car_listings_fuel_type ON car_listings(fuel_type_id);
CREATE INDEX IF NOT EXISTS idx_car_listings_body_style ON car_listings(body_style_id);
