-- Migration: Create saved searches and notification tables
-- Created: 2025-08-02
-- Author: Dev Team

-- Description:
-- Creates tables to support saved searches functionality similar to Blocket
-- Includes saved_searches table for storing user search criteria
-- Includes saved_search_notifications table for tracking sent notifications

-- Prerequisites:
-- Tables users and car_listings must exist

-- Validate pre-conditions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'Prerequisite table "users" does not exist';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'car_listings') THEN
        RAISE EXCEPTION 'Prerequisite table "car_listings" does not exist';
    END IF;
END
$$;

-- Create saved_searches table
CREATE TABLE saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    filters JSONB NOT NULL DEFAULT '{}',
    notification_preferences JSONB NOT NULL DEFAULT '{"email": true, "frequency": "immediate"}',
    last_notified_at TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_saved_searches_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create saved_search_notifications table to track which listings have been notified
CREATE TABLE saved_search_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saved_search_id UUID NOT NULL,
    listing_id BIGINT NOT NULL,
    notified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_notifications_saved_search FOREIGN KEY (saved_search_id) REFERENCES saved_searches(id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_listing FOREIGN KEY (listing_id) REFERENCES car_listings(id) ON DELETE CASCADE,
    CONSTRAINT uk_search_listing_notification UNIQUE (saved_search_id, listing_id)
);

-- Create indexes for better performance
CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX idx_saved_searches_is_active ON saved_searches(is_active);
CREATE INDEX idx_saved_searches_last_notified ON saved_searches(last_notified_at);
CREATE INDEX idx_saved_searches_created_at ON saved_searches(created_at);

-- JSONB indexes for filter queries
CREATE INDEX idx_saved_searches_filters_gin ON saved_searches USING GIN (filters);
CREATE INDEX idx_saved_searches_notifications_gin ON saved_searches USING GIN (notification_preferences);

-- Indexes for saved_search_notifications
CREATE INDEX idx_notifications_saved_search_id ON saved_search_notifications(saved_search_id);
CREATE INDEX idx_notifications_listing_id ON saved_search_notifications(listing_id);
CREATE INDEX idx_notifications_notified_at ON saved_search_notifications(notified_at);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_searches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_saved_searches_updated_at
    BEFORE UPDATE ON saved_searches
    FOR EACH ROW
    EXECUTE FUNCTION update_saved_searches_updated_at();

-- Post-migration validation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_searches') THEN
        RAISE EXCEPTION 'Migration failed: "saved_searches" table not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_search_notifications') THEN
        RAISE EXCEPTION 'Migration failed: "saved_search_notifications" table not created';
    END IF;
    
    -- Verify key columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'saved_searches' AND column_name = 'filters' AND data_type = 'jsonb'
    ) THEN
        RAISE EXCEPTION 'Migration failed: "filters" JSONB column not created in saved_searches table';
    END IF;
END
$$;

-- Rollback Script
/*
DROP TRIGGER IF EXISTS trigger_update_saved_searches_updated_at ON saved_searches;
DROP FUNCTION IF EXISTS update_saved_searches_updated_at();
DROP INDEX IF EXISTS idx_notifications_notified_at;
DROP INDEX IF EXISTS idx_notifications_listing_id;
DROP INDEX IF EXISTS idx_notifications_saved_search_id;
DROP INDEX IF EXISTS idx_saved_searches_notifications_gin;
DROP INDEX IF EXISTS idx_saved_searches_filters_gin;
DROP INDEX IF EXISTS idx_saved_searches_created_at;
DROP INDEX IF EXISTS idx_saved_searches_last_notified;
DROP INDEX IF EXISTS idx_saved_searches_is_active;
DROP INDEX IF EXISTS idx_saved_searches_user_id;
DROP TABLE IF EXISTS saved_search_notifications;
DROP TABLE IF EXISTS saved_searches;
*/
