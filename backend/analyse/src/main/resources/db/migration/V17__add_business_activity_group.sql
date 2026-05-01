-- Add business_activity_group_name to step_client for the activite intermediate level
ALTER TABLE step_client ADD COLUMN IF NOT EXISTS business_activity_group_name VARCHAR(200);
