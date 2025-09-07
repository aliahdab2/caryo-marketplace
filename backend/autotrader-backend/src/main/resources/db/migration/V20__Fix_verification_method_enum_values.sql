-- Fix verification method enum values
-- Update any lowercase "manual" values to uppercase "MANUAL" to match the enum

UPDATE users
SET verification_method = 'MANUAL'
WHERE LOWER(verification_method) = 'manual';

-- Also handle any other case variations that might exist
UPDATE users
SET verification_method = 'OAUTH'
WHERE LOWER(verification_method) = 'oauth';

-- Ensure all records have a valid verification method
UPDATE users
SET verification_method = 'MANUAL'
WHERE verification_method IS NULL OR verification_method = '';

-- Add a comment for documentation
COMMENT ON COLUMN users.verification_method IS 'Verification method: MANUAL for email verification, OAUTH for OAuth providers';
