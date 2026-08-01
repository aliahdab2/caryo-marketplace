-- ============================================================================
-- V62: Widen money columns so Syrian Pound amounts fit
--
-- Both car_listings.price and payment_transactions.amount were DECIMAL(10,2),
-- which caps at 99,999,999.99. That is fine for USD (the current default) but
-- overflows immediately in SYP — a mid-range used car is in the hundreds of
-- millions — and both columns are paired with a currency column that already
-- accepts SYP. Any SYP-priced listing or payment would fail on INSERT with a
-- numeric field overflow.
--
-- DECIMAL(18,2) leaves headroom of ~10^16 major units, well clear of any
-- plausible SYP amount including future inflation.
--
-- Safe to run online: widening precision on a NUMERIC column is a metadata-only
-- change in PostgreSQL when the scale is unchanged — no table rewrite, no data
-- loss, and every existing value stays byte-identical.
-- ============================================================================

ALTER TABLE car_listings
    ALTER COLUMN price TYPE DECIMAL(18, 2);

ALTER TABLE payment_transactions
    ALTER COLUMN amount TYPE DECIMAL(18, 2);

COMMENT ON COLUMN car_listings.price IS
    'Listing price in the currency named by car_listings.currency. Wide enough for SYP.';

COMMENT ON COLUMN payment_transactions.amount IS
    'Transaction amount in the currency named by payment_transactions.currency. Wide enough for SYP.';
