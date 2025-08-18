-- Add performance indexes for listing moderation queries
-- These indexes optimize the latest-action-wins queries and admin dashboard performance
-- Note: H2-compatible syntax (no DESC, no WHERE clauses, no COMMENT ON INDEX)

-- Index for finding latest actions by type for a specific listing
-- Supports queries like: WHERE listing_id = ? AND action_type = ? AND is_active = true ORDER BY performed_at DESC
CREATE INDEX IF NOT EXISTS idx_listing_moderation_actions_listing_type_active_time 
ON listing_moderation_actions (listing_id, action_type, is_active, performed_at);

-- Index for finding all actions for a specific listing ordered by time
-- Supports queries like: WHERE listing_id = ? ORDER BY performed_at DESC
CREATE INDEX IF NOT EXISTS idx_listing_moderation_actions_listing_time 
ON listing_moderation_actions (listing_id, performed_at);

-- Index for admin queries to find actions by admin user
-- Supports queries like: WHERE performed_by = ? ORDER BY performed_at DESC
CREATE INDEX IF NOT EXISTS idx_listing_moderation_actions_admin_time 
ON listing_moderation_actions (performed_by, performed_at);

-- Index for finding all active actions of a specific type (for bulk operations)
-- Supports queries like: WHERE action_type = ? AND is_active = true
CREATE INDEX IF NOT EXISTS idx_listing_moderation_actions_type_active 
ON listing_moderation_actions (action_type, is_active);

-- Note: H2 doesn't support partial indexes with WHERE clauses
-- In production PostgreSQL, we would use:
-- CREATE UNIQUE INDEX idx_listing_moderation_actions_unique_active 
-- ON listing_moderation_actions (listing_id, action_type) WHERE is_active = true;
-- For H2, we'll rely on application-level constraints instead
