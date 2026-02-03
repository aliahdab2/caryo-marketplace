-- Add token_version column to users table for JWT revocation support.
-- When token_version is incremented, all existing JWTs for this user become invalid.
-- Used on logout, password change, and password reset.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
