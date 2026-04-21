-- ============================================================
-- Update status constraint for new enum values
-- ============================================================

-- Drop the old constraint
ALTER TABLE analyse_dossier
  DROP CONSTRAINT IF EXISTS analyse_dossier_status_check;

-- Add new constraint with updated enum values
ALTER TABLE analyse_dossier
  ADD CONSTRAINT analyse_dossier_status_check
    CHECK (status IN (
      'DRAFT',
      'SUBMITTED',
      'ANALYSE',
      'CHECK_BEFORE_COMMITTEE',
      'CREDIT_RISK_ANALYSIS',
      'COMMITTEE',
      'WAITING_CLIENT_APPROVAL',
      'READY_TO_DISBURSE',
      'DISBURSE',
      'REJECTED'
    ));

-- Update default value
ALTER TABLE analyse_dossier
  ALTER COLUMN status SET DEFAULT 'DRAFT';

COMMENT ON CONSTRAINT analyse_dossier_status_check ON analyse_dossier IS 'Valid status values for credit analysis dossier lifecycle';
