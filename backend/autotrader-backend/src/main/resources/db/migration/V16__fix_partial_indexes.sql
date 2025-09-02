-- Migration V16: Fix partial indexes for H2 compatibility
-- Remove partial indexes that use WHERE clauses (not supported in H2)

-- Drop and recreate indexes without WHERE clauses
DROP INDEX IF EXISTS idx_conversations_status;
CREATE INDEX idx_conversations_status ON conversations(status);

-- Ensure all other indexes are H2 compatible
-- (This migration ensures we don't have any partial indexes with WHERE clauses)
