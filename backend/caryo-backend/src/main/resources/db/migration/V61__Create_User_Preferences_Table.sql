-- ============================================================================
-- V61: Create user_preferences table
--
-- Persists the notification and privacy toggles from the dashboard settings
-- page. Defaults mirror the UI defaults that were previously hardcoded, so
-- users without a row behave exactly as before.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Notification settings
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    push_notifications BOOLEAN NOT NULL DEFAULT FALSE,
    new_messages BOOLEAN NOT NULL DEFAULT TRUE,
    listing_expiry BOOLEAN NOT NULL DEFAULT TRUE,
    price_drops BOOLEAN NOT NULL DEFAULT FALSE,
    newsletter BOOLEAN NOT NULL DEFAULT TRUE,
    marketing BOOLEAN NOT NULL DEFAULT FALSE,

    -- Privacy settings
    show_phone BOOLEAN NOT NULL DEFAULT FALSE,
    show_email BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
