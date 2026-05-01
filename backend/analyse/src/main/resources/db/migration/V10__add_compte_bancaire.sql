CREATE TABLE IF NOT EXISTS compte_bancaire (
    id                      BIGSERIAL PRIMARY KEY,
    step_risque_client_id   BIGINT NOT NULL REFERENCES step_risque_client(id) ON DELETE CASCADE,
    banque_imf              VARCHAR(200) NOT NULL,
    type_compte             VARCHAR(100) NOT NULL,
    solde                   NUMERIC(15, 2),
    ordre                   INTEGER
);

CREATE INDEX idx_compte_bancaire_step_id ON compte_bancaire(step_risque_client_id);

-- Section 5.1: free-text analysis field on the master table
ALTER TABLE step_risque_client
    ADD COLUMN IF NOT EXISTS analyse_comptes TEXT;
