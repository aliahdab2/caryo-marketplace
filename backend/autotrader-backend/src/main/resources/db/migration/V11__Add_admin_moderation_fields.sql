-- Add admin hide functionality to car_listings table
-- This allows admins to hide listings from public view without deleting them
-- Note: Pause/resume functionality already exists using the existing is_user_active field

ALTER TABLE car_listings 
ADD COLUMN hidden_by_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for better query performance when filtering out hidden listings
CREATE INDEX idx_car_listings_hidden_by_admin ON car_listings(hidden_by_admin);

-- Add composite index for common public query patterns (approved + not hidden)
-- Note: is_user_active filtering is handled by existing specifications in list queries
CREATE INDEX idx_car_listings_public_approved_not_hidden ON car_listings(approved, hidden_by_admin) 
WHERE approved = true AND hidden_by_admin = false;
