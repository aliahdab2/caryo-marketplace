-- Migration to add status column to brands and models tables
-- This replaces the is_active boolean with a more flexible status enum

-- Add status column to makes (brands) table
ALTER TABLE makes 
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'INACTIVE';

-- Update existing data: convert is_active to status
UPDATE makes 
SET status = CASE 
    WHEN is_active = true THEN 'ACTIVE'
    ELSE 'INACTIVE'
END;

-- Add status column to models table  
ALTER TABLE models
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'INACTIVE';

-- Update existing data: convert is_active to status
UPDATE models
SET status = CASE
    WHEN is_active = true THEN 'ACTIVE' 
    ELSE 'INACTIVE'
END;

-- Add constraints to ensure valid status values
ALTER TABLE makes
ADD CONSTRAINT chk_makes_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'REJECTED'));

ALTER TABLE models  
ADD CONSTRAINT chk_models_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'REJECTED'));

-- Create indexes for better query performance
CREATE INDEX idx_makes_status ON makes(status);
CREATE INDEX idx_models_status ON models(status);

-- Note: We keep the is_active columns for now to ensure backward compatibility
-- They can be removed in a future migration once all code is updated
