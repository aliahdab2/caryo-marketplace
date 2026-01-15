-- V56: Add public dealer profile fields
-- Purpose: Enable public dealer profile pages (Phase 1 MVP)
-- Date: January 2026

ALTER TABLE dealers
  ADD COLUMN description TEXT,
  ADD COLUMN description_ar TEXT,
  ADD COLUMN working_hours JSONB,
  ADD COLUMN social_links JSONB,
  ADD COLUMN banner_url VARCHAR(255);

-- Note: Phase 2 fields (slug, verification, gallery, specialties) intentionally omitted
