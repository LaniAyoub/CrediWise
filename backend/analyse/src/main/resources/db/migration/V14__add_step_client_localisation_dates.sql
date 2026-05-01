-- Add location domicile, visit date and finalisation date to step_client
ALTER TABLE step_client ADD COLUMN IF NOT EXISTS location_domicile VARCHAR(500);
ALTER TABLE step_client ADD COLUMN IF NOT EXISTS date_visite DATE;
ALTER TABLE step_client ADD COLUMN IF NOT EXISTS date_finalisation DATE;
