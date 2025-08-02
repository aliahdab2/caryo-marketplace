-- Migration: Create newsletter_subscriptions table
-- Version: V1_36__Create_newsletter_subscriptions_table.sql
-- Description: Add newsletter subscription functionality with email confirmation

-- Pre-migration validation
DO $$
BEGIN
    -- Check if table already exists
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'newsletter_subscriptions') THEN
        RAISE EXCEPTION 'Table newsletter_subscriptions already exists';
    END IF;
    
    RAISE NOTICE 'Creating newsletter_subscriptions table...';
END $$;

-- Create newsletter_subscriptions table
CREATE TABLE newsletter_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    preferred_language VARCHAR(2) DEFAULT 'en',
    subscription_source VARCHAR(50) DEFAULT 'homepage',
    confirmation_token VARCHAR(255),
    confirmed_at TIMESTAMP,
    unsubscribe_token VARCHAR(255),
    unsubscribed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX idx_newsletter_active ON newsletter_subscriptions(active);
CREATE INDEX idx_newsletter_confirmed ON newsletter_subscriptions(confirmed_at);
CREATE INDEX idx_newsletter_confirmation_token ON newsletter_subscriptions(confirmation_token);
CREATE INDEX idx_newsletter_unsubscribe_token ON newsletter_subscriptions(unsubscribe_token);
CREATE INDEX idx_newsletter_language ON newsletter_subscriptions(preferred_language);
CREATE INDEX idx_newsletter_created_at ON newsletter_subscriptions(created_at);

-- Create composite index for active subscriptions query
CREATE INDEX idx_newsletter_active_subscriptions 
ON newsletter_subscriptions(active, confirmed_at, unsubscribed_at)
WHERE active = TRUE AND confirmed_at IS NOT NULL AND unsubscribed_at IS NULL;

-- Add constraints
ALTER TABLE newsletter_subscriptions 
ADD CONSTRAINT chk_newsletter_email_format 
CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE newsletter_subscriptions 
ADD CONSTRAINT chk_newsletter_language 
CHECK (preferred_language IN ('en', 'ar'));

-- Add comments for documentation
COMMENT ON TABLE newsletter_subscriptions IS 'Newsletter subscription management with email confirmation';
COMMENT ON COLUMN newsletter_subscriptions.email IS 'Subscriber email address (unique)';
COMMENT ON COLUMN newsletter_subscriptions.active IS 'Whether subscription is active';
COMMENT ON COLUMN newsletter_subscriptions.preferred_language IS 'Preferred language for newsletter (en/ar)';
COMMENT ON COLUMN newsletter_subscriptions.subscription_source IS 'Source of subscription (homepage, etc)';
COMMENT ON COLUMN newsletter_subscriptions.confirmation_token IS 'Token for email confirmation';
COMMENT ON COLUMN newsletter_subscriptions.confirmed_at IS 'When subscription was confirmed';
COMMENT ON COLUMN newsletter_subscriptions.unsubscribe_token IS 'Token for unsubscribing';
COMMENT ON COLUMN newsletter_subscriptions.unsubscribed_at IS 'When user unsubscribed';

-- Post-migration validation
DO $$
BEGIN
    -- Verify table was created
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'newsletter_subscriptions') THEN
        RAISE EXCEPTION 'Failed to create newsletter_subscriptions table';
    END IF;
    
    -- Verify columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'newsletter_subscriptions' 
                   AND column_name = 'email') THEN
        RAISE EXCEPTION 'Failed to create email column';
    END IF;
    
    -- Verify indexes exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'newsletter_subscriptions' 
                   AND indexname = 'idx_newsletter_email') THEN
        RAISE EXCEPTION 'Failed to create email index';
    END IF;
    
    RAISE NOTICE 'Newsletter subscriptions table created successfully';
    RAISE NOTICE 'Ready to accept newsletter subscriptions with email confirmation';
END $$;
