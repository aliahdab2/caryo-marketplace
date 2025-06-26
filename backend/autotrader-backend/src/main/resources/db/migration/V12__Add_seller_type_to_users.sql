-- Migration: Add seller_type_id to users table
-- Created: 2024-12-19
-- Author: GitHub Copilot

-- Description:
-- Adds a seller_type_id foreign key column to the users table to support
-- filtering car listings by seller type (e.g., dealer vs private seller).

-- Prerequisites:
-- - seller_types table must exist (created in V2__reference_data.sql)
-- - users table must exist (created in V1__Initial_Schema.sql)

-- PostgreSQL Notes:
-- Using nullable foreign key to avoid breaking existing users

-- H2 Notes:
-- Using nullable foreign key to avoid breaking existing users

-- Validate pre-conditions
-- Check that seller_types table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seller_types') THEN
        RAISE EXCEPTION 'seller_types table does not exist. This migration requires the seller_types table.';
    END IF;
END $$;

-- Check that users table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'users table does not exist. This migration requires the users table.';
    END IF;
END $$;

-- Migration Script
-- Add seller_type_id column to users table
ALTER TABLE users 
ADD COLUMN seller_type_id BIGINT;

-- Add foreign key constraint
ALTER TABLE users 
ADD CONSTRAINT fk_users_seller_type 
FOREIGN KEY (seller_type_id) REFERENCES seller_types(id);

-- Add index for better query performance
CREATE INDEX idx_users_seller_type_id ON users(seller_type_id);

-- Post-migration validation
-- Verify the column was added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'seller_type_id'
    ) THEN
        RAISE EXCEPTION 'seller_type_id column was not added to users table';
    END IF;
END $$;

-- Verify the foreign key constraint was added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND constraint_name = 'fk_users_seller_type'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE EXCEPTION 'Foreign key constraint fk_users_seller_type was not added';
    END IF;
END $$;

-- Verify the index was created
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' 
        AND indexname = 'idx_users_seller_type_id'
    ) THEN
        RAISE EXCEPTION 'Index idx_users_seller_type_id was not created';
    END IF;
END $$;

-- Rollback Script (if needed)
/*
-- To rollback this migration:
-- DROP INDEX IF EXISTS idx_users_seller_type_id;
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_seller_type;
-- ALTER TABLE users DROP COLUMN IF EXISTS seller_type_id;
*/
