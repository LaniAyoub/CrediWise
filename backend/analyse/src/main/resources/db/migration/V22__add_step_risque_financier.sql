-- Step 5: Risque Financier table
CREATE SEQUENCE IF NOT EXISTS step_risque_financier_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE IF NOT EXISTS step_risque_financier (
    id                  BIGINT DEFAULT nextval('step_risque_financier_seq') PRIMARY KEY,
    dossier_id          BIGINT NOT NULL UNIQUE REFERENCES analyse_dossier(id) ON DELETE CASCADE,
    notes               TEXT,
    is_complete         BOOLEAN NOT NULL DEFAULT FALSE,
    confirmed_by        UUID,
    confirmed_by_name   VARCHAR(255),
    confirmed_at        TIMESTAMP,
    last_edited_by      UUID,
    last_edited_by_name VARCHAR(255),
    last_edited_at      TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_step_risque_financier_dossier
    ON step_risque_financier(dossier_id);
