-- Step 4: Risque Commercial
-- V13__add_step_risque_commercial.sql

CREATE SEQUENCE IF NOT EXISTS step_risque_commercial_seq START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS point_de_vente_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE IF NOT EXISTS step_risque_commercial (
    id                            BIGINT DEFAULT nextval('step_risque_commercial_seq') PRIMARY KEY,
    dossier_id                    BIGINT NOT NULL UNIQUE REFERENCES analyse_dossier(id) ON DELETE CASCADE,

    -- Section 1: Information Activités
    nb_annees_experience_employe  INTEGER,
    nb_annees_experience_manager  INTEGER,
    autres_activites              BOOLEAN,
    vente_a_credit                BOOLEAN,

    -- Section 2: Description
    description_activite_analyse  TEXT,

    -- Audit
    is_complete                   BOOLEAN NOT NULL DEFAULT FALSE,
    confirmed_by                  UUID,
    confirmed_by_name             VARCHAR(255),
    confirmed_at                  TIMESTAMP,
    last_edited_by                UUID,
    last_edited_by_name           VARCHAR(255),
    last_edited_at                TIMESTAMP,
    created_at                    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                    TIMESTAMP
);

CREATE TABLE IF NOT EXISTS point_de_vente (
    id                            BIGINT DEFAULT nextval('point_de_vente_seq') PRIMARY KEY,
    step_risque_commercial_id     BIGINT NOT NULL REFERENCES step_risque_commercial(id) ON DELETE CASCADE,

    type                          VARCHAR(255),
    propriete                     VARCHAR(255),
    jours_ouverture               VARCHAR(255),
    horaire_ouverture             VARCHAR(10),
    surface                       DECIMAL(10, 2),
    emplacement                   TEXT,
    ordre                         INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_step_risque_commercial_dossier_id ON step_risque_commercial(dossier_id);
CREATE INDEX IF NOT EXISTS idx_point_de_vente_step_id ON point_de_vente(step_risque_commercial_id);
