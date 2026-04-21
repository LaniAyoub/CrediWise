-- ============================================================
-- Add assigned manager information columns
-- ============================================================

ALTER TABLE step_client ADD COLUMN IF NOT EXISTS assigned_manager_name VARCHAR(200);
ALTER TABLE step_client ADD COLUMN IF NOT EXISTS assigned_manager_email VARCHAR(150);
ALTER TABLE step_client ADD COLUMN IF NOT EXISTS assigned_manager_role VARCHAR(50);

-- Comments
COMMENT ON COLUMN step_client.assigned_manager_name IS 'Full name of the assigned manager (firstName + lastName)';
COMMENT ON COLUMN step_client.assigned_manager_email IS 'Email address of the assigned manager';
COMMENT ON COLUMN step_client.assigned_manager_role IS 'Role of the assigned manager';
