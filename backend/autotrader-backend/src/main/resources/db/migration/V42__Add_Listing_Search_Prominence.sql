-- Add search prominence fields to car_listings table
-- These fields improve UX by highlighting recently renewed listings in search results

ALTER TABLE car_listings
ADD COLUMN last_renewed_at TIMESTAMP,
ADD COLUMN search_score_boost DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN recently_renewed BOOLEAN DEFAULT FALSE,
ADD COLUMN recently_renewed_until TIMESTAMP,
ADD COLUMN searchable BOOLEAN DEFAULT TRUE,
ADD COLUMN search_index_updated_at TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN car_listings.last_renewed_at IS 'Timestamp when listing was last renewed for search prominence';
COMMENT ON COLUMN car_listings.search_score_boost IS 'Multiplier for search score (e.g., 1.5 = 50% boost)';
COMMENT ON COLUMN car_listings.recently_renewed IS 'Flag indicating listing was recently renewed';
COMMENT ON COLUMN car_listings.recently_renewed_until IS 'Timestamp until listing should be considered recently renewed';
COMMENT ON COLUMN car_listings.searchable IS 'Whether listing should appear in search results';
COMMENT ON COLUMN car_listings.search_index_updated_at IS 'Timestamp of last search index update';

-- Create indexes for performance
CREATE INDEX idx_car_listings_recently_renewed ON car_listings(recently_renewed);
CREATE INDEX idx_car_listings_last_renewed_at ON car_listings(last_renewed_at);
CREATE INDEX idx_car_listings_search_score_boost ON car_listings(search_score_boost);
CREATE INDEX idx_car_listings_searchable ON car_listings(searchable);
CREATE INDEX idx_car_listings_search_index_updated_at ON car_listings(search_index_updated_at);
