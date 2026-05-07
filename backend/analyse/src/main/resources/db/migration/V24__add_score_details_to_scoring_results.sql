-- Add scoreDetails column to store variable contributions breakdown
-- Stores JSON map of variable contributions for historical/audit purposes
ALTER TABLE scoring_results
ADD COLUMN IF NOT EXISTS score_details JSONB;

-- Create index on the new column for potential future queries
CREATE INDEX IF NOT EXISTS idx_scoring_score_details ON scoring_results USING GIN(score_details);
