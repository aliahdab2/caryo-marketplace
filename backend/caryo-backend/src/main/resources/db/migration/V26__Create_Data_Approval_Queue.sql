-- Create data approval queue table for human oversight of imported data
CREATE TABLE data_approval_queue (
    id BIGSERIAL PRIMARY KEY,
    data_type VARCHAR(50) NOT NULL,
    source_data TEXT,
    proposed_data TEXT,
    confidence_score DECIMAL(3,2),
    processing_source VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    priority VARCHAR(10) DEFAULT 'MEDIUM',
    auto_approval_rules VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by VARCHAR(100),
    review_comments TEXT,
    rejection_count INTEGER DEFAULT 0,
    last_rejection_reason VARCHAR(200),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by VARCHAR(100)
);

-- Create indexes for better performance
CREATE INDEX idx_data_approval_queue_status ON data_approval_queue(status);
CREATE INDEX idx_data_approval_queue_data_type ON data_approval_queue(data_type);
CREATE INDEX idx_data_approval_queue_priority ON data_approval_queue(priority);
CREATE INDEX idx_data_approval_queue_created_at ON data_approval_queue(created_at);
CREATE INDEX idx_data_approval_queue_processed_by ON data_approval_queue(processed_by);

-- Add comments for documentation
COMMENT ON TABLE data_approval_queue IS 'Queue for data items requiring human approval before being saved to main tables';
COMMENT ON COLUMN data_approval_queue.data_type IS 'Type of data: BRAND, MODEL, TRANSLATION, etc.';
COMMENT ON COLUMN data_approval_queue.source_data IS 'Original data from external source (JSON format)';
COMMENT ON COLUMN data_approval_queue.proposed_data IS 'Processed/suggested data for approval (JSON format)';
COMMENT ON COLUMN data_approval_queue.confidence_score IS 'AI confidence score (0.0 to 1.0)';
COMMENT ON COLUMN data_approval_queue.processing_source IS 'Source system that processed the data (CarQuery, OpenAI, etc.)';
COMMENT ON COLUMN data_approval_queue.auto_approval_rules IS 'Rules that were applied for auto-approval';
