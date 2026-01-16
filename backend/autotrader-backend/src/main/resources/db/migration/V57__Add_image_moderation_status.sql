-- V57: Add moderation status to listing_media table
-- Implements manual image approval workflow (Phase 1 of content moderation)

-- Add moderation status enum type
DO $$ BEGIN
    CREATE TYPE moderation_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add moderation columns to listing_media
ALTER TABLE listing_media
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'PENDING' NOT NULL;

ALTER TABLE listing_media
ADD COLUMN IF NOT EXISTS moderated_by BIGINT REFERENCES users(id);

ALTER TABLE listing_media
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP;

ALTER TABLE listing_media
ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- Create index for admin moderation queue (pending images)
CREATE INDEX IF NOT EXISTS idx_listing_media_moderation_status 
ON listing_media(moderation_status);

-- Create index for filtering by moderation status and creation date (for queue sorting)
CREATE INDEX IF NOT EXISTS idx_listing_media_pending_queue 
ON listing_media(moderation_status, created_at) 
WHERE moderation_status = 'PENDING';

-- Auto-approve existing images (they were uploaded before moderation existed)
UPDATE listing_media 
SET moderation_status = 'APPROVED', 
    moderated_at = NOW() 
WHERE moderation_status = 'PENDING';

COMMENT ON COLUMN listing_media.moderation_status IS 'Image moderation status: PENDING (awaiting review), APPROVED (visible), REJECTED (hidden)';
COMMENT ON COLUMN listing_media.moderated_by IS 'ID of the admin who moderated this image';
COMMENT ON COLUMN listing_media.moderated_at IS 'Timestamp when the image was moderated';
COMMENT ON COLUMN listing_media.moderation_notes IS 'Optional notes from moderator (e.g., rejection reason)';
