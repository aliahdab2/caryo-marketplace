-- Migration V17: Fix conversations status index for H2 compatibility
-- Remove partial index with WHERE clause and create standard index

-- Drop the problematic index if it exists
DROP INDEX IF EXISTS idx_conversations_status;

-- Create a standard index without WHERE clause (H2 compatible)
CREATE INDEX idx_conversations_status ON conversations(status);
