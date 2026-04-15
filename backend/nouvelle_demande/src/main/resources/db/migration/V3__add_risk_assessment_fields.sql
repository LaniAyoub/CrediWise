-- ============================================================
-- Add Risk Assessment Fields to demandes table
-- ============================================================

ALTER TABLE demandes ADD COLUMN banking_restriction BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE demandes ADD COLUMN legal_issue_or_account_blocked BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- Create index for risk assessment fields
-- ============================================================

CREATE INDEX idx_demandes_banking_restriction ON demandes (banking_restriction);
CREATE INDEX idx_demandes_legal_issue ON demandes (legal_issue_or_account_blocked);
