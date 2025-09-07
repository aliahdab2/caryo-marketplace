-- Manual Email Verification Script
-- Use this script to manually verify emails during development
-- WARNING: This should NEVER be used in production!

-- Replace 'your-email@example.com' with the actual email address
UPDATE users
SET
    email_verified = true,
    account_status = 'VERIFIED',
    email_verified_at = NOW(),
    email_verification_token = NULL,
    updated_at = NOW()
WHERE email = 'your-email@example.com';

-- Check the result
SELECT
    username,
    email,
    email_verified,
    account_status,
    email_verified_at
FROM users
WHERE email = 'your-email@example.com';

-- Alternative: Verify all users (for development testing only)
-- WARNING: NEVER run this in production!
-- UPDATE users SET email_verified = true, account_status = 'VERIFIED', email_verified_at = NOW() WHERE account_status = 'PENDING_VERIFICATION';
