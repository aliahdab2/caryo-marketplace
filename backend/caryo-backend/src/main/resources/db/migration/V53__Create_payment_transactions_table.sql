-- V53: Create payment transactions table for audit trail
-- This migration adds comprehensive payment tracking and audit capabilities

-- Create payment_transactions table
CREATE TABLE payment_transactions (
    id BIGSERIAL PRIMARY KEY,
    
    -- Unique identifiers
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    idempotency_key VARCHAR(100) UNIQUE,
    external_payment_id VARCHAR(100),
    
    -- Dealer reference
    dealer_id BIGINT NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'SYP',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(30) NOT NULL,
    provider_type VARCHAR(30) NOT NULL,
    payment_type VARCHAR(30) NOT NULL DEFAULT 'subscription',
    
    -- Description and metadata
    description VARCHAR(500),
    subscription_tier VARCHAR(30),
    
    -- Error handling
    error_code VARCHAR(50),
    error_message VARCHAR(1000),
    
    -- Receipt and tracking
    receipt_url VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    -- Retry handling
    retry_attempts INTEGER NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE
);

-- Create payment_transaction_metadata table for flexible key-value storage
CREATE TABLE payment_transaction_metadata (
    transaction_id BIGINT NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
    metadata_key VARCHAR(100) NOT NULL,
    metadata_value VARCHAR(1000),
    PRIMARY KEY (transaction_id, metadata_key)
);

-- Create indexes for performance
CREATE INDEX idx_payment_transactions_dealer_id ON payment_transactions(dealer_id);
CREATE INDEX idx_payment_transactions_transaction_id ON payment_transactions(transaction_id);
CREATE INDEX idx_payment_transactions_idempotency_key ON payment_transactions(idempotency_key);
CREATE INDEX idx_payment_transactions_external_payment_id ON payment_transactions(external_payment_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_provider_type ON payment_transactions(provider_type);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX idx_payment_transactions_status_retry ON payment_transactions(status, next_retry_at) WHERE status = 'FAILED';

-- Create index for finding recent transactions (without WHERE clause to avoid IMMUTABLE function issue)
CREATE INDEX idx_payment_transactions_recent ON payment_transactions(created_at DESC);

-- Add constraints
ALTER TABLE payment_transactions ADD CONSTRAINT chk_payment_status 
    CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PENDING_VERIFICATION', 'EXPIRED'));

ALTER TABLE payment_transactions ADD CONSTRAINT chk_payment_method 
    CHECK (payment_method IN ('BANK_TRANSFER', 'CARD', 'DIRECT_DEBIT', 'MOBILE_WALLET', 'CRYPTO', 'CASH', 'PAYMENT_GATEWAY'));

ALTER TABLE payment_transactions ADD CONSTRAINT chk_provider_type 
    CHECK (provider_type IN ('MANUAL_TRANSFER', 'CHAM_BANK', 'BEMO_BANK', 'SIIB', 'CRYPTO_PROCESSOR', 'MOBILE_WALLET'));

ALTER TABLE payment_transactions ADD CONSTRAINT chk_currency 
    CHECK (currency IN ('SYP', 'USD', 'EUR', 'BTC', 'USDT'));

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_transaction_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_transactions_updated_at
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_transaction_updated_at();

-- Add comments for documentation
COMMENT ON TABLE payment_transactions IS 'Complete audit trail for all payment transactions';
COMMENT ON COLUMN payment_transactions.transaction_id IS 'Our internal unique transaction ID (format: TXN_YYYYMMDD_HHMMSS_XXXXX)';
COMMENT ON COLUMN payment_transactions.idempotency_key IS 'Client-provided key to prevent duplicate payments';
COMMENT ON COLUMN payment_transactions.external_payment_id IS 'Payment ID from external provider (gateway, bank, etc.)';
COMMENT ON COLUMN payment_transactions.amount IS 'Payment amount in the specified currency';
COMMENT ON COLUMN payment_transactions.status IS 'Current payment status (PENDING, COMPLETED, FAILED, etc.)';
COMMENT ON COLUMN payment_transactions.payment_method IS 'Method used for payment (BANK_TRANSFER, CARD, etc.)';
COMMENT ON COLUMN payment_transactions.provider_type IS 'Payment provider that processed this transaction';
COMMENT ON COLUMN payment_transactions.payment_type IS 'Type of payment (subscription, one_time, refund, etc.)';
COMMENT ON COLUMN payment_transactions.retry_attempts IS 'Number of retry attempts for failed payments';
COMMENT ON COLUMN payment_transactions.next_retry_at IS 'When to retry this payment if it failed';

COMMENT ON TABLE payment_transaction_metadata IS 'Flexible metadata storage for payment transactions';
COMMENT ON COLUMN payment_transaction_metadata.metadata_key IS 'Metadata key (e.g., cardLast4, bankName, referenceNumber)';
COMMENT ON COLUMN payment_transaction_metadata.metadata_value IS 'Metadata value (stored as string, can be JSON)';
