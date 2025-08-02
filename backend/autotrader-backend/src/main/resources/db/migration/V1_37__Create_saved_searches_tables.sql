-- Migration: Create saved searches and notification tables
-- Created: 2025-08-02
-- Author: Dev Team

-- Description:
-- Creates tables to support saved searches functionality similar to Blocket
-- Includes saved_searches table for storing user search criteria
-- Includes saved_search_notifications table for tracking sent notifications
--
-- Design Notes:
-- 1. Bilingual Fields: Uses _en/_ar suffix pattern for user-displayable content (name fields)
-- 2. JSON Storage: Uses TEXT fields for technical/functional data (filters, preferences)
--    - This follows existing pattern (see search_parameters in V1__Initial_Schema.sql)
--    - Technical data like {"minPrice": 10000} is inherently language-neutral
--    - Avoids unnecessary duplication of identical technical criteria
-- 3. Database Compatibility: Uses TEXT instead of JSON type for H2/PostgreSQL compatibility

-- Prerequisites:
-- Tables users and car_listings must exist
-- Note: Removed PostgreSQL-specific validation blocks for H2 compatibility

-- Drop tables if they exist (for development purposes)
DROP TABLE IF EXISTS saved_search_notifications;
DROP TABLE IF EXISTS saved_searches;

-- Create saved_searches table
CREATE TABLE saved_searches (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL,
    
    -- Bilingual display names (following project _en/_ar pattern)
    name_en VARCHAR(255) NOT NULL,    -- User-displayable name in English
    name_ar VARCHAR(255),             -- User-displayable name in Arabic
    
    -- Technical/functional data stored as JSON (language-neutral)
    -- Note: These fields contain technical search criteria and system settings,
    -- not user-displayable content, so they don't require bilingual fields.
    -- This follows the existing pattern used in search_parameters field.
    filters TEXT NOT NULL DEFAULT '{}',                           -- Search criteria JSON
    notification_preferences TEXT NOT NULL DEFAULT '{"email": true, "frequency": "immediate"}',  -- System preferences JSON
    
    -- System fields
    last_notified_at TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_saved_searches_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create saved_search_notifications table to track which listings have been notified
CREATE TABLE saved_search_notifications (
    id UUID PRIMARY KEY,
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

-- Indexes for saved_search_notifications
CREATE INDEX idx_notifications_saved_search_id ON saved_search_notifications(saved_search_id);
CREATE INDEX idx_notifications_listing_id ON saved_search_notifications(listing_id);
CREATE INDEX idx_notifications_notified_at ON saved_search_notifications(notified_at);

-- Note: PostgreSQL-specific triggers and functions removed for H2 compatibility
-- In production, these can be added via PostgreSQL-specific migrations

-- Rollback Script
/*
DROP INDEX IF EXISTS idx_notifications_notified_at;
DROP INDEX IF EXISTS idx_notifications_listing_id;
DROP INDEX IF EXISTS idx_notifications_saved_search_id;
DROP INDEX IF EXISTS idx_saved_searches_created_at;
DROP INDEX IF EXISTS idx_saved_searches_last_notified;
DROP INDEX IF EXISTS idx_saved_searches_is_active;
DROP INDEX IF EXISTS idx_saved_searches_user_id;
DROP TABLE IF EXISTS saved_search_notifications;
DROP TABLE IF EXISTS saved_searches;
*/
