-- Migration V19: Remove the content check constraint to allow empty message content
-- This migration removes the constraint that prevents empty message content
-- to support image-only messages in the messaging system

-- Remove the check constraint that prevents empty content
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_content_check;

-- Add comment explaining the change
COMMENT ON COLUMN messages.content IS 'Message text content - can be null or empty for image-only messages';



