-- Migration V18: Allow empty message content for image-only messages
-- This migration removes the constraint that prevents empty message content
-- to support image-only messages in the messaging system

-- Remove the check constraint that prevents empty content
ALTER TABLE messages DROP CONSTRAINT IF EXISTS ck_content_not_empty;

-- Allow content to be nullable for image-only messages
ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;

-- Add a new constraint that allows either content OR attachments (but not both empty)
-- This will be enforced at the application level for now
-- Future enhancement: Add a constraint that ensures either content is not empty OR message has attachments

-- Add comment explaining the change
COMMENT ON COLUMN messages.content IS 'Message text content - can be null for image-only messages';



