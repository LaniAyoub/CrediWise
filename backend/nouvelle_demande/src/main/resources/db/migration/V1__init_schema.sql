-- ============================================================
-- nouvelle_demande_db — Complete Schema v1.0
-- Auto-incremented BIGSERIAL IDs + Risk Assessment Fields
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- DEMANDES TABLE (with BIGSERIAL auto-increment ID)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS demandes (
    -- Primary key: Auto-incremented (1, 2, 3...)
    id                               BIGSERIAL    PRIMARY KEY,

    -- Client reference (external microservice)
    client_id                        UUID         NOT NULL,

    -- Physical person snapshot
    client_type                      VARCHAR(10),
    first_name                       VARCHAR(100),
    last_name                        VARCHAR(100),
    date_of_birth                    DATE,
    national_id                      VARCHAR(50),
    gender                           VARCHAR(10),
    marital_status                   VARCHAR(20),
    nationality                      VARCHAR(100),
    monthly_income                   NUMERIC(15,3),

    -- Legal entity snapshot
    company_name                     VARCHAR(200),
    sigle                            VARCHAR(50),
    registration_number              VARCHAR(100),
    principal_interlocutor           VARCHAR(200),

    -- Common snapshot
    scoring                          VARCHAR(50),
    manager_name                     VARCHAR(200),
    branch_id                        VARCHAR(20),
    branch_name                      VARCHAR(200),
    cycle                            VARCHAR(50),
    segment                          VARCHAR(100),
    account_type                     VARCHAR(100),
    business_sector                  VARCHAR(200),
    business_activity                VARCHAR(200),
    email                            VARCHAR(150),
    primary_phone                    VARCHAR(30),

    -- Credit request
    loan_purpose                     VARCHAR(2000),
    requested_amount                 NUMERIC(15,3),
    duration_months                  INTEGER,
    product_id                       VARCHAR(50),
    product_name                     VARCHAR(200),
    asset_type                       VARCHAR(200),
    monthly_repayment_capacity       NUMERIC(15,3),
    application_channel              VARCHAR(100),

    -- Risk assessment
    banking_restriction              BOOLEAN      DEFAULT FALSE,
    legal_issue_or_account_blocked   BOOLEAN      DEFAULT FALSE,

    -- Consent & signatories
    consent_text                     VARCHAR(4000),
    signatories                      VARCHAR(500),
    request_date                     TIMESTAMP,

    -- Status (DRAFT / SUBMITTED / VALIDATED / REJECTED)
    status                           VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',

    -- Audit
    created_at                       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                       UUID,
    updated_by                       UUID,
    deleted_by                       UUID,
    deleted_at                       TIMESTAMP
);

CREATE INDEX idx_demandes_client_id  ON demandes (client_id);
CREATE INDEX idx_demandes_status     ON demandes (status);
CREATE INDEX idx_demandes_deleted_at ON demandes (deleted_at);

-- ────────────────────────────────────────────────────────────
-- GUARANTORS TABLE (references BIGINT demande_id)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS guarantors (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    demande_id           BIGINT      NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
    amplitude_id         VARCHAR(100),
    name                 VARCHAR(200),
    client_relationship  VARCHAR(100)
);

CREATE INDEX idx_guarantors_demande ON guarantors (demande_id);

-- ────────────────────────────────────────────────────────────
-- GUARANTEES TABLE (references BIGINT demande_id)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS guarantees (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    demande_id     BIGINT       NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
    owner          VARCHAR(200),
    type           VARCHAR(100),
    estimated_value NUMERIC(15,3)
);

CREATE INDEX idx_guarantees_demande ON guarantees (demande_id);

-- ────────────────────────────────────────────────────────────
-- PRODUCT TABLE
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product (
    product_id VARCHAR(50)  PRIMARY KEY,
    type       VARCHAR(50),
    name       VARCHAR(200) NOT NULL
);

-- ────────────────────────────────────────────────────────────
-- STATUS TABLE
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS status (
    id_status VARCHAR(50)  PRIMARY KEY,
    libelle   VARCHAR(200) NOT NULL
);

-- ────────────────────────────────────────────────────────────
-- Seed Data
-- ────────────────────────────────────────────────────────────

INSERT INTO product (product_id, type, name) VALUES
    ('MICRO_CREDIT',      'MICRO',     'Micro Crédit'),
    ('CREDIT_PME',        'PME',       'Crédit PME'),
    ('CREDIT_CONSO',      'CONSUMER',  'Crédit Consommation'),
    ('CREDIT_IMMO',       'MORTGAGE',  'Crédit Immobilier'),
    ('CREDIT_EQUIPEMENT', 'EQUIPMENT', 'Crédit Équipement'),
    ('101',               NULL,        'Crédit Micro Tatouir'),
    ('102',               NULL,        'Crédit TPE Mostakbali'),
    ('103',               NULL,        'Crédit PME Imtiez'),
    ('105',               NULL,        'Crédit EL BEYA'),
    ('110',               NULL,        'Crédit Agricole Saba')
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO status (id_status, libelle) VALUES
    ('DRAFT',      'Brouillon'),
    ('SUBMITTED',  'Soumise'),
    ('VALIDATED',  'Validée'),
    ('REJECTED',   'Rejetée')
ON CONFLICT (id_status) DO NOTHING;
