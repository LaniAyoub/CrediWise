-- ============================================================
-- analyse_db — Complete Schema v1.0 (CLEAN VERSION)
-- Compatible with Hibernate / Quarkus / Flyway
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- SEQUENCES (lowercase, NO quotes → avoids Hibernate issues)
-- ─────────────────────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS analyse_dossier_seq START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS step_client_seq START WITH 1 INCREMENT BY 50;

-- ─────────────────────────────────────────────────────────────
-- ANALYSE_DOSSIER TABLE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analyse_dossier (
                                               id BIGINT PRIMARY KEY DEFAULT nextval('analyse_dossier_seq'),

    demande_id BIGINT NOT NULL UNIQUE,
    client_id UUID NOT NULL,
    gestionnaire_id UUID NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'BROUILLON'
    CHECK (status IN ('BROUILLON', 'ANALYSE', 'EN_COURS', 'COMPLET', 'APPROUVE', 'REJETE', 'EN_ATTENTE')),

    current_step INTEGER NOT NULL DEFAULT 1
    CHECK (current_step BETWEEN 1 AND 7),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    completed_at TIMESTAMP
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dossier_demande_id ON analyse_dossier(demande_id);
CREATE INDEX IF NOT EXISTS idx_dossier_client_id ON analyse_dossier(client_id);
CREATE INDEX IF NOT EXISTS idx_dossier_gestionnaire_id ON analyse_dossier(gestionnaire_id);
CREATE INDEX IF NOT EXISTS idx_dossier_status ON analyse_dossier(status);

-- Comments
COMMENT ON TABLE analyse_dossier IS 'Top-level credit analysis dossier for a demande';
COMMENT ON COLUMN analyse_dossier.status IS 'Workflow status';
COMMENT ON COLUMN analyse_dossier.current_step IS 'Step 1 to 7';

-- ─────────────────────────────────────────────────────────────
-- STEP_CLIENT TABLE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS step_client (
                                           id BIGINT PRIMARY KEY DEFAULT nextval('step_client_seq'),

    dossier_id BIGINT NOT NULL UNIQUE
    REFERENCES analyse_dossier(id) ON DELETE CASCADE,

    -- CLIENT SNAPSHOT
    client_id UUID,
    client_type VARCHAR(10),
    status VARCHAR(20),

    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    national_id VARCHAR(50),
    tax_identifier VARCHAR(50),
    gender VARCHAR(10),
    situation_familiale VARCHAR(20),
    nationality VARCHAR(100),
    monthly_income NUMERIC(15,3),

    company_name VARCHAR(200),
    sigle VARCHAR(50),
    registration_number VARCHAR(100),
    principal_interlocutor VARCHAR(200),

    email VARCHAR(150),
    primary_phone VARCHAR(30),
    secondary_phone VARCHAR(30),

    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_postal VARCHAR(20),
    address_country VARCHAR(100),

    segment_id BIGINT,
    account_type_id BIGINT,
    secteur_activite_id BIGINT,
    sous_activite_id BIGINT,
    mapping_risque_activite_id BIGINT,
    ifc_level_of_risk VARCHAR(100),

    agence_id VARCHAR(10),
    assigned_manager_id UUID,

    relation_avec_client VARCHAR(20),
    relation_avec_client_other VARCHAR(150),

    account_number VARCHAR(20),
    account_type_custom_name VARCHAR(120),
    scoring VARCHAR(50),
    cycle VARCHAR(50),
    cbs_id VARCHAR(100),

    client_created_at TIMESTAMP,
    client_updated_at TIMESTAMP,

    -- AGENCE SNAPSHOT
    agence_id_branch VARCHAR(10),
    agence_libelle VARCHAR(100),
    agence_wording VARCHAR(200),
    agence_is_active BOOLEAN,

    -- CREDIT HISTORY
    historique_credits TEXT,
    nombre_demandes_passees INTEGER DEFAULT 0,
    nombre_demandes_approuvees INTEGER DEFAULT 0,
    nombre_demandes_rejetees INTEGER DEFAULT 0,

    -- CONFIRMATION
    confirmed_by UUID,
    confirmed_at TIMESTAMP,
    data_fetched_at TIMESTAMP,
    is_complete BOOLEAN NOT NULL DEFAULT FALSE,

    -- FLAGS
    agence_data_available BOOLEAN DEFAULT TRUE,
    warning_message VARCHAR(500),

    -- AUDIT
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_step_client_dossier_id ON step_client(dossier_id);
CREATE INDEX IF NOT EXISTS idx_step_client_confirmed_at ON step_client(confirmed_at);

-- Comments
COMMENT ON TABLE step_client IS 'Step 1 (Client) snapshot data';
COMMENT ON COLUMN step_client.historique_credits IS 'JSON history';
COMMENT ON COLUMN step_client.is_complete IS 'Confirmed by manager';

-- ============================================================
-- END
-- ============================================================
