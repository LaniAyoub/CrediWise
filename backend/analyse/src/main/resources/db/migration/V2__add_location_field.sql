-- Add location field to step_client for user input
ALTER TABLE step_client
ADD COLUMN IF NOT EXISTS location VARCHAR(500);

COMMENT ON COLUMN step_client.location IS 'Location/address input by user during analysis';

-- Add demande_created_at to analyse_dossier for date tracking
ALTER TABLE analyse_dossier
ADD COLUMN IF NOT EXISTS demande_created_at TIMESTAMP;

COMMENT ON COLUMN analyse_dossier.demande_created_at IS 'Date when the demande was created';
