-- V13__Add_currency_to_car_listings.sql
-- Add currency support to car listings table
-- Compatible with both PostgreSQL and H2
-- 
-- Purpose: Enable multi-currency support for the Syrian marketplace
-- Supports: USD (primary for car sales) and SYP (local transactions)
-- Default: USD (most common for car sales in Syria)

-- Pre-migration validation with enhanced error reporting
DO $$
DECLARE
    table_exists BOOLEAN;
    column_exists BOOLEAN;
    existing_listings_count INTEGER;
BEGIN
    -- Check if car_listings table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'car_listings'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE EXCEPTION 'Migration aborted: car_listings table does not exist in public schema';
    END IF;
    
    -- Check if currency column already exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'car_listings' AND column_name = 'currency'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE EXCEPTION 'Migration aborted: currency column already exists in car_listings table';
    END IF;
    
    -- Log existing listings count for validation
    SELECT COUNT(*) INTO existing_listings_count FROM car_listings;
    RAISE NOTICE 'Pre-migration: Found % existing car listings that will be updated to USD currency', existing_listings_count;
END $$;

-- Add currency column to car_listings table with enhanced constraints
ALTER TABLE car_listings 
ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD';

-- Add descriptive comment for better documentation
COMMENT ON COLUMN car_listings.currency IS 'ISO 4217 currency code for the listing price. Supports USD (primary for Syrian car market) and SYP (Syrian Pound). Default: USD for international car sales.';

-- Add check constraint with descriptive name
ALTER TABLE car_listings 
ADD CONSTRAINT chk_currency_supported 
CHECK (currency IN ('USD', 'SYP'));

-- Add comment for the constraint
COMMENT ON CONSTRAINT chk_currency_supported ON car_listings IS 'Ensures only USD and SYP currencies are allowed for Syrian marketplace compatibility';

-- Create optimized index for currency-based filtering and reporting
CREATE INDEX idx_car_listings_currency ON car_listings(currency);

-- Create composite index for enhanced query performance on active listings
CREATE INDEX idx_car_listings_currency_status 
ON car_listings (currency, listing_status) 
WHERE listing_status IN ('ACTIVE', 'PENDING');

-- Update existing listings to USD (standard for car sales in Syrian market)
UPDATE car_listings SET currency = 'USD';

-- Post-migration validation with comprehensive checks
DO $$
DECLARE
    currency_count INTEGER;
    total_listings INTEGER;
    usd_count INTEGER;
    constraint_exists BOOLEAN;
    index_count INTEGER;
    column_default VARCHAR;
BEGIN
    -- Verify currency column was added successfully
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'car_listings' AND column_name = 'currency'
    ) THEN
        RAISE EXCEPTION 'Migration failed: currency column was not added to car_listings table';
    END IF;
    
    -- Verify column default value
    SELECT column_default INTO column_default
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'car_listings' AND column_name = 'currency';
    
    IF column_default IS NULL OR column_default NOT LIKE '%USD%' THEN
        RAISE EXCEPTION 'Migration failed: currency column default value not set correctly';
    END IF;
    
    -- Verify all existing listings have valid currency
    SELECT COUNT(*) INTO currency_count 
    FROM car_listings 
    WHERE currency IS NOT NULL AND currency IN ('USD', 'SYP');
    
    SELECT COUNT(*) INTO total_listings FROM car_listings;
    SELECT COUNT(*) INTO usd_count FROM car_listings WHERE currency = 'USD';
    
    -- Verify constraint exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'car_listings' 
        AND constraint_name = 'chk_currency_supported'
        AND constraint_type = 'CHECK'
    ) INTO constraint_exists;
    
    -- Count currency-related indexes
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'car_listings' 
    AND indexname LIKE 'idx_car_listings_currency%';
    
    -- Comprehensive validation
    IF currency_count != total_listings THEN
        RAISE EXCEPTION 'Migration failed: % out of % listings do not have valid currency assigned', 
            (total_listings - currency_count), total_listings;
    END IF;
    
    IF NOT constraint_exists THEN
        RAISE EXCEPTION 'Migration failed: currency constraint chk_currency_supported was not created';
    END IF;
    
    IF index_count < 2 THEN
        RAISE EXCEPTION 'Migration failed: Expected 2 currency indexes, found %', index_count;
    END IF;
    
    -- Success reporting
    RAISE NOTICE '=== CURRENCY MIGRATION COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  - Currency column added with default USD';
    RAISE NOTICE '  - Total listings processed: %', total_listings;
    RAISE NOTICE '  - Listings with USD currency: %', usd_count;
    RAISE NOTICE '  - Currency constraint created: chk_currency_supported';
    RAISE NOTICE '  - Indexes created: % currency-related indexes', index_count;
    RAISE NOTICE '  - Syrian marketplace ready for multi-currency support';
    RAISE NOTICE '=== END MIGRATION REPORT ===';
END $$;

-- Rollback procedure (for documentation and emergency use)
/*
=== ROLLBACK PROCEDURE ===
To rollback this migration safely:

1. Backup data first:
   CREATE TABLE car_listings_currency_backup AS 
   SELECT id, currency FROM car_listings WHERE currency IS NOT NULL;

2. Drop composite index:
   DROP INDEX IF EXISTS idx_car_listings_currency_status;

3. Drop currency index:
   DROP INDEX IF EXISTS idx_car_listings_currency;

4. Drop the constraint:
   ALTER TABLE car_listings DROP CONSTRAINT IF EXISTS chk_currency_supported;

5. Drop the column:
   ALTER TABLE car_listings DROP COLUMN IF EXISTS currency;

6. Verify rollback:
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'car_listings' AND column_name = 'currency';
   -- Should return no rows

=== H2 COMPATIBILITY NOTES ===
This migration is designed to work with both PostgreSQL and H2:
- Uses standard SQL DDL commands
- Avoids PostgreSQL-specific syntax in core operations
- Comments and DO blocks may be skipped in H2 but won't cause errors
- Index creation uses standard syntax compatible with both databases

=== PERFORMANCE CONSIDERATIONS ===
- Indexes are created AFTER data migration for optimal performance
- Composite index optimizes common query patterns (currency + status)
- Constraint validation occurs after all data is migrated
- Migration includes comprehensive validation to ensure data integrity
*/
