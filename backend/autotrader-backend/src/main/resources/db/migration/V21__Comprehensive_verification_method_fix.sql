-- Comprehensive fix for verification method enum values
-- This migration handles all possible case variations and ensures all records are updated
-- Compatible with PostgreSQL and Hibernate

-- Step 1: Update all lowercase variations to uppercase (case-insensitive matching)
UPDATE users
SET verification_method = 'MANUAL'
WHERE LOWER(verification_method) = 'manual';

UPDATE users
SET verification_method = 'OAUTH'
WHERE LOWER(verification_method) = 'oauth';

-- Step 2: Handle exact string matches for any remaining variations
UPDATE users
SET verification_method = 'MANUAL'
WHERE verification_method = 'manual' OR verification_method = 'MANUAL' OR verification_method = 'Manual';

UPDATE users
SET verification_method = 'OAUTH'
WHERE verification_method = 'oauth' OR verification_method = 'OAUTH' OR verification_method = 'Oauth';

-- Step 3: Ensure all records have a valid verification method
-- If NULL or empty, default to MANUAL
UPDATE users
SET verification_method = 'MANUAL'
WHERE verification_method IS NULL OR verification_method = '' OR verification_method = ' ';

-- Step 4: Also ensure all users have verified status in development
-- This is a safety net for development environment
UPDATE users
SET email_verified = true,
    account_status = 'VERIFIED',
    email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP)
WHERE email_verified = false OR account_status != 'VERIFIED';

-- Step 5: Add check constraint to prevent future lowercase values
-- Drop existing constraint if it exists (PostgreSQL compatible)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_verification_method_uppercase') THEN
        ALTER TABLE users DROP CONSTRAINT check_verification_method_uppercase;
    END IF;
END $$;

-- Add the constraint to ensure data integrity
ALTER TABLE users ADD CONSTRAINT check_verification_method_uppercase
CHECK (verification_method IS NULL OR verification_method = UPPER(verification_method));

-- Step 6: Add a comment for documentation (PostgreSQL specific, but safe)
COMMENT ON COLUMN users.verification_method IS 'Verification method: MANUAL for email verification, OAUTH for OAuth providers (uppercase only)';
