-- Migration V14: Add video support following AutoTrader patterns
-- Adds support for external video URLs (YouTube, Vimeo) and video uploads

-- Add new columns to listing_media table for video support
-- Using IF NOT EXISTS for H2 compatibility
ALTER TABLE listing_media ADD COLUMN IF NOT EXISTS external_url VARCHAR(500);
ALTER TABLE listing_media ADD COLUMN IF NOT EXISTS video_source VARCHAR(20);
ALTER TABLE listing_media ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
