-- Add confirmed_by_name column to step_client table
ALTER TABLE step_client ADD COLUMN IF NOT EXISTS confirmed_by_name VARCHAR(200);
