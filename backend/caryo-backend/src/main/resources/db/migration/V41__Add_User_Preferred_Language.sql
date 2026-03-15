-- Add preferred_language column to users table
-- This supports enhanced language detection for better UX in password reset and other communications

ALTER TABLE users
ADD COLUMN preferred_language VARCHAR(10);

-- Add comment to document the column purpose
COMMENT ON COLUMN users.preferred_language IS 'User preferred language for emails and communications (e.g., en, ar)';

-- Create index for potential future queries on user language preferences
CREATE INDEX idx_users_preferred_language ON users(preferred_language);
