-- Migration: Add seller_type_id to users table
-- Created: 2024-12-19
-- Author: GitHub Copilot

-- Description:
-- Adds a seller_type_id foreign key column to the users table to support
-- filtering car listings by seller type (e.g., dealer vs private seller).

-- Prerequisites:
-- - seller_types table must exist (created in V2__reference_data.sql)
-- - users table must exist (created in V1__Initial_Schema.sql)

-- Notes:
-- - Using nullable foreign key to avoid breaking existing users
-- - Compatible with both H2 and PostgreSQL databases
-- - No validation blocks to maintain H2 compatibility

-- Add seller_type_id column to users table
ALTER TABLE users 
ADD COLUMN seller_type_id BIGINT;

-- Add foreign key constraint
ALTER TABLE users 
ADD CONSTRAINT fk_users_seller_type 
FOREIGN KEY (seller_type_id) REFERENCES seller_types(id);

-- Add index for better query performance
CREATE INDEX idx_users_seller_type_id ON users(seller_type_id);

