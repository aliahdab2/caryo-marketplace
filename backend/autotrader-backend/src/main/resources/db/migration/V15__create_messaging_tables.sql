-- Migration V15: Create messaging system tables
-- This migration adds the core messaging functionality to the marketplace
-- Note: This will replace the existing simple messages table with a conversation-based system

-- Drop existing messages table if it exists (old structure incompatible)
DROP TABLE IF EXISTS messages CASCADE;

-- 1. CONVERSATIONS TABLE
CREATE TABLE conversations (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES car_listings(id) ON DELETE CASCADE,
    buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'BLOCKED')),
    last_message_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0,
    deleted_at TIMESTAMP,
    
    -- Ensure one conversation per buyer-seller-listing combination
    CONSTRAINT uk_conversation_unique UNIQUE(listing_id, buyer_id, seller_id),
    
    -- Prevent self-conversations
    CONSTRAINT ck_buyer_not_seller CHECK (buyer_id != seller_id)
);

-- 2. MESSAGES TABLE
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(trim(content)) > 0),
    message_type VARCHAR(20) DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'IMAGE', 'SYSTEM')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0,
    deleted_at TIMESTAMP,
    edited_at TIMESTAMP,
    is_edited BOOLEAN DEFAULT FALSE,
    
    -- Ensure content is not empty
    CONSTRAINT ck_content_not_empty CHECK (length(trim(content)) > 0),
    
    -- Ensure read_at is set when is_read is true
    CONSTRAINT ck_read_at_set CHECK ((is_read = true AND read_at IS NOT NULL) OR (is_read = false AND read_at IS NULL)),
    
    -- Ensure edited_at is set when is_edited is true
    CONSTRAINT ck_edited_at_set CHECK ((is_edited = true AND edited_at IS NOT NULL) OR (is_edited = false AND edited_at IS NULL))
);

-- 3. MESSAGE ATTACHMENTS TABLE (following existing listing_media pattern)
CREATE TABLE message_attachments (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_key VARCHAR(255) NOT NULL CHECK (length(trim(file_key)) > 0),
    file_name VARCHAR(255) NOT NULL CHECK (length(trim(file_name)) > 0),
    content_type VARCHAR(100) NOT NULL CHECK (length(trim(content_type)) > 0),
    size BIGINT NOT NULL CHECK (size > 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0,
    deleted_at TIMESTAMP,
    upload_status VARCHAR(20) DEFAULT 'COMPLETED' CHECK (upload_status IN ('PENDING', 'COMPLETED', 'FAILED')),
    error_message TEXT,
    
    -- Ensure file size is positive
    CONSTRAINT ck_file_size_positive CHECK (size > 0),
    
    -- Ensure file names are not empty
    CONSTRAINT ck_file_name_not_empty CHECK (length(trim(file_name)) > 0)
);

-- 4. CONVERSATION PARTICIPANTS (for future group chat support)
CREATE TABLE conversation_participants (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'PARTICIPANT' CHECK (role IN ('BUYER', 'SELLER', 'PARTICIPANT')),
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    version BIGINT DEFAULT 0,
    deleted_at TIMESTAMP,
    is_muted BOOLEAN DEFAULT FALSE,
    muted_until TIMESTAMP,
    last_read_message_id BIGINT REFERENCES messages(id) ON DELETE SET NULL,
    last_read_at TIMESTAMP,
    
    CONSTRAINT uk_participant_conversation UNIQUE(conversation_id, user_id),
    
    -- Ensure left_at is after joined_at
    CONSTRAINT ck_left_after_join CHECK (left_at IS NULL OR left_at > joined_at),
    
    -- Ensure muted_until is after joined_at
    CONSTRAINT ck_muted_after_join CHECK (muted_until IS NULL OR muted_until > joined_at)
);

-- Performance indexes (following existing pattern)
CREATE INDEX idx_conversations_buyer_listing ON conversations(buyer_id, listing_id);
CREATE INDEX idx_conversations_seller_listing ON conversations(seller_id, listing_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_deleted ON conversations(deleted_at);
CREATE INDEX idx_conversations_created ON conversations(created_at DESC);

CREATE INDEX idx_messages_conversation_time ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at DESC);
CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read);
CREATE INDEX idx_messages_deleted ON messages(deleted_at);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_type ON messages(message_type);

CREATE INDEX idx_message_attachments_message ON message_attachments(message_id);
CREATE INDEX idx_message_attachments_deleted ON message_attachments(deleted_at);
CREATE INDEX idx_message_attachments_status ON message_attachments(upload_status);
CREATE INDEX idx_message_attachments_type ON message_attachments(content_type);

CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_deleted ON conversation_participants(deleted_at);
CREATE INDEX idx_conversation_participants_active ON conversation_participants(conversation_id, left_at);
CREATE INDEX idx_conversation_participants_role ON conversation_participants(role);

-- Note: Triggers and functions are PostgreSQL-specific and not supported in H2
-- These features will be handled in the application layer for H2 compatibility

-- Note: Initial conversation participants will be handled by the application layer
-- when conversations are created, as this is a fresh H2 database

-- Add comments for documentation
COMMENT ON TABLE conversations IS 'Stores conversations between buyers and sellers about specific car listings';
COMMENT ON TABLE messages IS 'Stores individual messages within conversations';
COMMENT ON TABLE message_attachments IS 'Stores file attachments for messages (images, documents)';
COMMENT ON TABLE conversation_participants IS 'Tracks participants in conversations with their roles';

-- Add column comments
COMMENT ON COLUMN conversations.version IS 'Optimistic locking version for concurrent access control';
COMMENT ON COLUMN conversations.deleted_at IS 'Soft delete timestamp - null means not deleted';
COMMENT ON COLUMN messages.version IS 'Optimistic locking version for concurrent access control';
COMMENT ON COLUMN messages.deleted_at IS 'Soft delete timestamp - null means not deleted';
COMMENT ON COLUMN messages.edited_at IS 'Timestamp when message was last edited';
COMMENT ON COLUMN messages.is_edited IS 'Flag indicating if message has been edited';
COMMENT ON COLUMN message_attachments.upload_status IS 'Current status of file upload process';
COMMENT ON COLUMN message_attachments.error_message IS 'Error message if upload failed';
COMMENT ON COLUMN conversation_participants.is_muted IS 'Whether participant is muted from receiving messages';
COMMENT ON COLUMN conversation_participants.muted_until IS 'Timestamp until which participant is muted';
COMMENT ON COLUMN conversation_participants.last_read_message_id IS 'ID of last message read by participant';
COMMENT ON COLUMN conversation_participants.last_read_at IS 'Timestamp when participant last read messages';
