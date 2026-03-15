-- Add search query hash column for easier duplicate detection
-- This replaces complex JSON comparison with simple string comparison

ALTER TABLE saved_searches
ADD COLUMN search_query_hash VARCHAR(500);

-- Create index for fast duplicate checking
CREATE INDEX idx_saved_searches_query_hash ON saved_searches(user_id, search_query_hash);

-- Optional: Populate existing searches with query hash (can be done later via service)
-- UPDATE saved_searches SET search_query_hash = 'legacy' WHERE search_query_hash IS NULL;