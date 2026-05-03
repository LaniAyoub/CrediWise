-- Add assetType column to step_objet_credit table
ALTER TABLE IF EXISTS step_objet_credit
ADD COLUMN IF NOT EXISTS asset_type VARCHAR(100);
