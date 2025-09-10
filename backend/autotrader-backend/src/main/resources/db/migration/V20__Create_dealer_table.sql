-- Create sequence for dealer ID
CREATE SEQUENCE IF NOT EXISTS dealer_id_seq START WITH 1 INCREMENT BY 1;

-- Create dealer table to store dealer-specific information
CREATE TABLE dealers (
    id BIGINT PRIMARY KEY DEFAULT nextval('dealer_id_seq'),
    user_id BIGINT NOT NULL,
    business_name VARCHAR(100) NOT NULL,
    vat_number VARCHAR(50),
    trading_address VARCHAR(255),
    business_email VARCHAR(50),
    business_phone VARCHAR(20),
    logo_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),

    -- Foreign key constraint
    CONSTRAINT fk_dealer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    -- Unique constraints (only apply to non-null values)
    CONSTRAINT uk_dealer_user_id UNIQUE (user_id),
    CONSTRAINT uk_dealer_vat_number UNIQUE (vat_number),
    CONSTRAINT uk_dealer_business_email UNIQUE (business_email),

    -- Check constraints
    CONSTRAINT ck_dealer_business_name_length CHECK (char_length(business_name) >= 2),
    CONSTRAINT ck_dealer_business_email_format CHECK (business_email IS NULL OR business_email ~* '^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT ck_dealer_logo_url_format CHECK (logo_url IS NULL OR logo_url ~* '^https?://.*')
);

-- Create indexes for better performance
CREATE INDEX idx_dealer_user_id ON dealers(user_id);
CREATE INDEX idx_dealer_business_name ON dealers(business_name);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_dealer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dealer_updated_at
    BEFORE UPDATE ON dealers
    FOR EACH ROW
    EXECUTE FUNCTION update_dealer_updated_at();

-- Add comments for documentation (PostgreSQL uses COMMENT ON syntax)
COMMENT ON TABLE dealers IS 'Stores dealer-specific business information';
COMMENT ON COLUMN dealers.business_name IS 'Official business name';
COMMENT ON COLUMN dealers.vat_number IS 'VAT registration number';
COMMENT ON COLUMN dealers.trading_address IS 'Business trading address';
COMMENT ON COLUMN dealers.business_email IS 'Business contact email';
COMMENT ON COLUMN dealers.business_phone IS 'Business contact phone';
COMMENT ON COLUMN dealers.logo_url IS 'URL to business logo image';
