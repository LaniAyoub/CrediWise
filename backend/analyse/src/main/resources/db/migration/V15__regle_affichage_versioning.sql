-- V15: Rule versioning + dossier applied-rule tracking
--
-- Strategy: soft-delete. When a rule is "edited", the old row is deactivated
-- (is_active = false) and a new row is created (version = old.version + 1).
-- Dossiers record which rule version was active when they were first analysed.
-- This lets us show an "old rule" indicator when the rule has since been superseded.

ALTER TABLE regle_affichage
    ADD COLUMN IF NOT EXISTS is_active  BOOLEAN   NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS version    INTEGER   NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP          DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- Allow fast lookups of all active rules (common hot path)
CREATE INDEX IF NOT EXISTS idx_regle_active ON regle_affichage (is_active);

ALTER TABLE analyse_dossier
    ADD COLUMN IF NOT EXISTS applied_rule_id      BIGINT REFERENCES regle_affichage(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS applied_rule_version INTEGER;

CREATE INDEX IF NOT EXISTS idx_dossier_applied_rule ON analyse_dossier (applied_rule_id);
