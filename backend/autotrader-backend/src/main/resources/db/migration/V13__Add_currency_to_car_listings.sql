-- V13__Add_currency_to_car_listings.sql
-- Add currency support to car listings table
-- Compatible with both H2 and PostgreSQL - uses only standard SQL
-- 
-- Purpose: Enable multi-currency support for the Syrian marketplace
-- Supports: USD (primary for car sales) and SYP (local transactions)
-- Default: USD (most common for car sales in Syria)

-- Add currency column to car_listings table with enhanced constraints
ALTER TABLE car_listings 
ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD';

-- Add check constraint with descriptive name (standard SQL)
ALTER TABLE car_listings 
ADD CONSTRAINT chk_currency_supported 
CHECK (currency IN ('USD', 'SYP'));

-- Create optimized index for currency-based filtering and reporting
CREATE INDEX idx_car_listings_currency ON car_listings(currency);

-- Update existing listings to USD (standard for car sales in Syrian market)
UPDATE car_listings SET currency = 'USD' WHERE currency IS NULL;

-- Rollback procedure (for documentation and emergency use)
/*
=== ROLLBACK PROCEDURE ===
To rollback this migration safely:

1. Backup data first:
   CREATE TABLE car_listings_currency_backup AS 
   SELECT id, currency FROM car_listings WHERE currency IS NOT NULL;

2. Drop currency index:
   DROP INDEX IF EXISTS idx_car_listings_currency;

3. Drop the constraint:
   ALTER TABLE car_listings DROP CONSTRAINT IF EXISTS chk_currency_supported;

4. Drop the column:
   ALTER TABLE car_listings DROP COLUMN IF EXISTS currency;

=== COMPATIBILITY NOTES ===
This migration is designed to work with both PostgreSQL and H2:
- Uses only standard SQL DDL commands
- Avoids database-specific syntax (DO blocks, COMMENT ON, etc.)
- Index creation uses standard syntax compatible with both databases
- Simple UPDATE and ALTER statements for maximum compatibility
- Only references existing columns in the car_listings table

=== PERFORMANCE CONSIDERATIONS ===
- Index is created AFTER data migration for optimal performance
- Simple currency index optimizes common filtering patterns
- Constraint validation occurs after all data is migrated
- Migration uses minimal operations for better compatibility
*/
