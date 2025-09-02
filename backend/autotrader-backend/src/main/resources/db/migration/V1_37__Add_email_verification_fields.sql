-- Add email verification and account status fields to users table
-- This migration adds security features to prevent unauthorized listing creation

ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN email_verification_token VARCHAR(255),
ADD COLUMN email_verification_sent_at TIMESTAMP,
ADD COLUMN email_verified_at TIMESTAMP,
ADD COLUMN account_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_VERIFICATION';

-- Create index on verification token for faster lookups
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token);

-- Create index on account status for filtering
CREATE INDEX idx_users_account_status ON users(account_status);

-- Create index on email_verified for quick verification checks
CREATE INDEX idx_users_email_verified ON users(email_verified);

-- Update existing users to have VERIFIED status (for backward compatibility)
-- This ensures existing users can continue to create listings
UPDATE users 
SET email_verified = TRUE, 
    account_status = 'VERIFIED',
    email_verified_at = created_at
WHERE email_verified = FALSE;

-- Add comments for documentation
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN users.email_verification_token IS 'Token used for email verification (null after verification)';
COMMENT ON COLUMN users.email_verification_sent_at IS 'When the verification email was last sent';
COMMENT ON COLUMN users.email_verified_at IS 'When the email was verified';
COMMENT ON COLUMN users.account_status IS 'Account status: PENDING_VERIFICATION, VERIFIED, SUSPENDED, BANNED, PENDING_APPROVAL';
