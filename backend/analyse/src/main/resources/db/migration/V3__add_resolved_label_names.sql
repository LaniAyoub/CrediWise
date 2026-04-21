-- ============================================================
-- Add resolved label name columns for client references
-- These store human-readable names instead of just IDs
-- ============================================================

ALTER TABLE step_client ADD COLUMN IF NOT EXISTS segment_name VARCHAR(200);
ALTER TABLE step_client ADD COLUMN IF NOT EXISTS account_type_name VARCHAR(200);
ALTER TABLE step_client ADD COLUMN IF NOT EXISTS business_sector_name VARCHAR(200);
ALTER TABLE step_client ADD COLUMN IF NOT EXISTS business_activity_name VARCHAR(200);

-- Comments
COMMENT ON COLUMN step_client.segment_name IS 'Display name of segment (resolved from segment ID)';
COMMENT ON COLUMN step_client.account_type_name IS 'Display name of account type (resolved from account type ID)';
COMMENT ON COLUMN step_client.business_sector_name IS 'Display name of business sector/activité (resolved from secteur_activite ID)';
COMMENT ON COLUMN step_client.business_activity_name IS 'Display name of business activity/sous-activité (resolved from sous_activite ID)';
