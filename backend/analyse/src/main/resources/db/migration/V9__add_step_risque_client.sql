-- ============================================================
-- Step 3: Risque Client tables
-- ============================================================

-- Sequences (INCREMENT BY 50 matches Hibernate default allocationSize)
CREATE SEQUENCE IF NOT EXISTS step_risque_client_seq    START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS step_reference_familiale_seq START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS step_enquete_moralite_seq    START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS step_pret_cours_seq          START WITH 1 INCREMENT BY 50;

-- ── Master record: one row per dossier ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS step_risque_client (
  id                          BIGINT PRIMARY KEY DEFAULT nextval('step_risque_client_seq'),
  dossier_id                  BIGINT NOT NULL UNIQUE
                                REFERENCES analyse_dossier(id) ON DELETE CASCADE,

  -- Section 1.1: Situation du client
  situation_familiale         VARCHAR(20)
                                CHECK (situation_familiale IN (
                                  'MARIE','CELIBATAIRE','DIVORCE','SEPARE','VEUF','AUTRE')),
  situation_familiale_autre   TEXT,
  situation_logement          VARCHAR(25)
                                CHECK (situation_logement IN (
                                  'PROPRIETAIRE','LOCATAIRE',
                                  'COLOCATAIRE','HEBERGE_FAMILLE','AUTRE')),
  situation_logement_autre    TEXT,
  duree_sejour                INTEGER CHECK (duree_sejour >= 0),
  anciennete_quartier         INTEGER CHECK (anciennete_quartier >= 0),
  nombre_personnes_charge     INTEGER CHECK (nombre_personnes_charge >= 0),
  nombre_enfants              INTEGER CHECK (nombre_enfants >= 0),

  -- Section 2.2: Avis comité
  avis_comite                 TEXT,

  -- Section 3: Historique crédit / Centrale des Risques
  nombre_credits_anterieurs   INTEGER CHECK (nombre_credits_anterieurs >= 0),
  note_centrale_risque        VARCHAR(1)
                                CHECK (note_centrale_risque IN ('A','B','C','D','E')),
  est_garant                  BOOLEAN,

  -- Section 4.1: Analyse crédit
  analyse_credit              TEXT,

  -- Step metadata
  is_complete                 BOOLEAN NOT NULL DEFAULT FALSE,
  confirmed_by                UUID,
  confirmed_by_name           VARCHAR(200),
  confirmed_at                TIMESTAMP,
  last_edited_by              UUID,
  last_edited_by_name         VARCHAR(200),
  last_edited_at              TIMESTAMP,
  created_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                  TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_step_risque_client_dossier_id
  ON step_risque_client(dossier_id);
CREATE INDEX IF NOT EXISTS idx_step_risque_client_confirmed_at
  ON step_risque_client(confirmed_at);

-- ── Section 1.2: Références familiales ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS step_reference_familiale (
  id                        BIGINT PRIMARY KEY DEFAULT nextval('step_reference_familiale_seq'),
  step_risque_client_id     BIGINT NOT NULL
                              REFERENCES step_risque_client(id) ON DELETE CASCADE,
  prenom                    TEXT NOT NULL,
  nom                       TEXT NOT NULL,
  telephone                 VARCHAR(20) NOT NULL,
  lien_parente              TEXT NOT NULL,
  ordre                     INTEGER NOT NULL DEFAULT 0,
  created_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_step_reference_familiale_step_id
  ON step_reference_familiale(step_risque_client_id);

-- ── Section 2.1: Enquêtes de moralité ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS step_enquete_moralite (
  id                        BIGINT PRIMARY KEY DEFAULT nextval('step_enquete_moralite_seq'),
  step_risque_client_id     BIGINT NOT NULL
                              REFERENCES step_risque_client(id) ON DELETE CASCADE,
  lien_avec_client          TEXT NOT NULL,
  contact                   VARCHAR(20) NOT NULL,
  nom_complet               TEXT NOT NULL,
  amplitude                 TEXT,           -- nullable: duration known to client
  opinion                   TEXT NOT NULL,
  ordre                     INTEGER NOT NULL DEFAULT 0,
  created_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_step_enquete_moralite_step_id
  ON step_enquete_moralite(step_risque_client_id);

-- ── Section 4: Prêts en cours ou récents ────────────────────────────────────
CREATE TABLE IF NOT EXISTS step_pret_cours (
  id                              BIGINT PRIMARY KEY DEFAULT nextval('step_pret_cours_seq'),
  step_risque_client_id           BIGINT NOT NULL
                                    REFERENCES step_risque_client(id) ON DELETE CASCADE,
  nom_institution                 TEXT NOT NULL,
  objet                           TEXT NOT NULL,
  duree_en_mois                   INTEGER NOT NULL CHECK (duree_en_mois > 0),
  montant_initial                 DECIMAL(15,2) NOT NULL CHECK (montant_initial >= 0),
  encours_solde                   DECIMAL(15,2) NOT NULL CHECK (encours_solde >= 0),
  montant_echeance                DECIMAL(15,2) NOT NULL CHECK (montant_echeance >= 0),
  nombre_echeances_restantes      INTEGER NOT NULL CHECK (nombre_echeances_restantes >= 0),
  nombre_echeances_retard         INTEGER NOT NULL DEFAULT 0,
  jours_retard_max                INTEGER NOT NULL DEFAULT 0,
  ordre                           INTEGER NOT NULL DEFAULT 0,
  created_at                      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                      TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_step_pret_cours_step_id
  ON step_pret_cours(step_risque_client_id);

COMMENT ON TABLE step_risque_client IS 'Step 3: Client Risk (Risque Client) — analyst-filled form, no gRPC calls';
COMMENT ON TABLE step_reference_familiale IS 'Step 3: Section 1.2 — Family references (dynamic list)';
COMMENT ON TABLE step_enquete_moralite IS 'Step 3: Section 2.1 — Morality enquiries (dynamic list)';
COMMENT ON TABLE step_pret_cours IS 'Step 3: Section 4 — Current/recent loans (dynamic list)';
