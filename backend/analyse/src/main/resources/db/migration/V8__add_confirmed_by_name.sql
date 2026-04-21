-- Add confirmed_by_name column to step_client table
ALTER TABLE step_client ADD COLUMN IF NOT EXISTS confirmed_by_name VARCHAR(200);

-- Add confirmed_by_name column to step_objet_credit table
ALTER TABLE step_objet_credit ADD COLUMN IF NOT EXISTS confirmed_by_name VARCHAR(200);
