-- Add pertinence_projet column to step_objet_credit table
ALTER TABLE step_objet_credit
ADD COLUMN IF NOT EXISTS pertinence_projet TEXT;
