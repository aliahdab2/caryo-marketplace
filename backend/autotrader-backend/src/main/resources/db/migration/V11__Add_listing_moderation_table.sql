-- Create listing moderation actions table for admin moderation tracking
-- This approach keeps the CarListing table lean while providing complete audit trail
-- Following industry best practices for large table optimization

CREATE TABLE listing_moderation_actions (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES car_listings(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    reason TEXT,
    performed_by BIGINT NOT NULL REFERENCES users(id),
    performed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata TEXT,
    
    -- Constraints
    CONSTRAINT chk_action_type CHECK (action_type IN (
        'HIDE', 'UNHIDE', 'APPROVE', 'REJECT', 'REQUEST_CHANGES',
        'MARK_SOLD', 'UNMARK_SOLD', 'ARCHIVE', 'UNARCHIVE', 'EXPIRE'
    ))
);

-- Indexes for optimal query performance
CREATE INDEX idx_moderation_listing_id ON listing_moderation_actions(listing_id);
CREATE INDEX idx_moderation_active ON listing_moderation_actions(listing_id, is_active);
CREATE INDEX idx_moderation_action_type ON listing_moderation_actions(action_type);
CREATE INDEX idx_moderation_performed_at ON listing_moderation_actions(performed_at);

-- Composite index for the most common query pattern (checking if listing is hidden)
CREATE INDEX idx_moderation_listing_type_active ON listing_moderation_actions(listing_id, action_type, is_active);

-- Remove redundant boolean fields from car_listings table
-- These are now handled by the moderation actions table
-- Note: Using H2-compatible syntax (no PostgreSQL DO blocks)

-- Remove hidden_by_admin if it exists (from previous approach)
-- H2 will ignore DROP COLUMN if column doesn't exist, so we can safely attempt to drop
ALTER TABLE car_listings DROP COLUMN IF EXISTS hidden_by_admin;
DROP INDEX IF EXISTS idx_car_listings_hidden_by_admin;
DROP INDEX IF EXISTS idx_car_listings_public_approved_not_hidden;

-- HYBRID APPROACH: Remove only non-performance-critical fields
-- KEEP: approved (used in 90% of queries), isUserActive (owner pause/resume)
-- REMOVE: sold, archived, expired (computed from moderation actions or expiration_date)

ALTER TABLE car_listings DROP COLUMN IF EXISTS sold;
ALTER TABLE car_listings DROP COLUMN IF EXISTS archived;
ALTER TABLE car_listings DROP COLUMN IF EXISTS expired;
