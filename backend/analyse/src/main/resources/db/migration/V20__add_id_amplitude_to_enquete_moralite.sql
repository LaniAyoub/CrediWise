-- Add idAmplitude column to step_enquete_moralite table
ALTER TABLE IF EXISTS step_enquete_moralite
ADD COLUMN IF NOT EXISTS id_amplitude VARCHAR(100);
