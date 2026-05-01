-- Table d'audit des résultats de scoring
-- Stocke chaque calcul de score pour traçabilité et historique.
CREATE TABLE IF NOT EXISTS scoring_results (
    id                  BIGSERIAL    PRIMARY KEY,

    -- Référence à la demande (clé logique — service externe)
    demande_id          BIGINT       NOT NULL,
    client_id           UUID,

    -- I. Décision Règles de Gestion (DRG)
    drg_age             VARCHAR(20),
    drg_anciennete      VARCHAR(20),
    drg_budget          VARCHAR(20),
    drg_fichage         VARCHAR(20),
    drg_offre           VARCHAR(20),
    drg_decision        VARCHAR(20)  NOT NULL,

    -- II. Score Statistique (DSS)
    score_brut          NUMERIC(12, 5),
    score_ajuste        NUMERIC(8,  3),
    dss_decision        VARCHAR(20),

    -- III. Décision Système
    decision_systeme    VARCHAR(20)  NOT NULL,

    -- Audit
    scored_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by          UUID,

    CONSTRAINT uq_scoring_demande UNIQUE (demande_id)
);

CREATE INDEX IF NOT EXISTS idx_scoring_demande   ON scoring_results (demande_id);
CREATE INDEX IF NOT EXISTS idx_scoring_client    ON scoring_results (client_id);
CREATE INDEX IF NOT EXISTS idx_scoring_decision  ON scoring_results (decision_systeme);