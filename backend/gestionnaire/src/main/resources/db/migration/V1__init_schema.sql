-- =====================================================
-- create_tables.sql (Agences + Tunisian users)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLE: agences
-- =====================================================
CREATE TABLE IF NOT EXISTS agences (
    id_branch VARCHAR(10) PRIMARY KEY,
    libelle   VARCHAR(100) NOT NULL,
    wording   VARCHAR(200),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Seed agences with your list
INSERT INTO agences (id_branch, libelle, wording) VALUES
    ('100', 'SIEGE', 'HEAD OFFICE'),
    ('110', 'INTILAKA', 'INTILAKA'),
    ('120', 'BARCELONE', 'BARCELONE'),
    ('130', 'ARIANA', 'ARIANA'),
    ('140', 'ZAGHOUAN',     'ZAGHOUAN'),
    ('150', 'HAMMAM LIF', 'HAMMAM LIF'),
    ('160', 'NABEUL', 'NABEUL'),
    ('161', 'MENZEL TEMIME', NULL),
    ('170', 'BIZERTE', 'BIZERTE'),
    ('171', 'MATEUR', NULL),
    ('180', 'MANOUBA', 'MANOUBA'),
    ('190', 'MOUROUJ', NULL),
    ('210', 'SOUSSE', 'SOUSSE'),
    ('211', 'HAMEM SOUSSE', 'HAMEM SOUSSE'),
    ('220', 'MAHDIA', 'MAHDIA'),
    ('230', 'MONASTIR', NULL),
    ('310', 'KAIROUAN', 'KAIROUAN'),
    ('311', 'HAFFOUZ', NULL),
    ('312', 'SBIKHA', NULL),
    ('320', 'SIDI BOUZID', 'SIDI BOUZID'),
    ('321', 'Regueb', NULL),
    ('330', 'KASSERINE', 'KASSERINE'),
    ('410', 'BEJA', 'BEJA'),
    ('411', 'MJAZ AL BAB', NULL),
    ('420', 'JENDOUBA', 'JENDOUBA'),
    ('421', 'Bou Salem', NULL),
    ('430', 'EL KEF', 'EL KEF'),
    ('440', 'SILIANA', NULL),
    ('510', 'GABES', 'GABES'),
    ('520', 'MEDENINE', 'MEDENINE'),
    ('521', 'DJERBA', NULL),
    ('530', 'SFAX', 'SFAX'),
    ('531', 'SFAX 2', NULL),
    ('540', 'Agence X', NULL),
    ('610', 'GAFSA', 'GAFSA'),
    ('620', 'KEBILI', NULL),
    ('910', 'CALL CENTER', 'CALL CENTER'),
    ('99999', 'SITE CENTRAL', 'MAIN SITE')
    ON CONFLICT (id_branch) DO NOTHING;

-- =====================================================
-- TABLE: roles
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    label       VARCHAR(200) NOT NULL,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version     BIGINT NOT NULL DEFAULT 0,
    created_by  UUID,
    updated_by  UUID
);

-- Indexes for roles
CREATE INDEX IF NOT EXISTS idx_roles_code   ON roles(code);
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active);

-- Seed default roles
INSERT INTO roles (code, label, description) VALUES
    ('SUPER_ADMIN',    'Super Administrator', 'Full system access'),
    ('CRO',            'Client Relationship Officer', 'Handles client applications'),
    ('BRANCH_DM',      'Branch Decision Maker', 'Approves at branch level'),
    ('HEAD_OFFICE_DM', 'Head Office Decision Maker', 'Approves at HQ level'),
    ('RISK_ANALYST',   'Credit Risk Analyst', 'Analyzes credit risk'),
    ('FRONT_OFFICE',   'Front Office', 'Handles front interactions'),
    ('READ_ONLY',      'Read Only User', 'View-only access'),
    ('TECH_USER',      'Technical User (UAT only)', 'Full access in UAT')
    ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE roles IS 'System roles synced with Keycloak';

-- =====================================================
-- TABLE: gestionnaires
-- =====================================================
CREATE TABLE IF NOT EXISTS gestionnaires (
    id UUID PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    cin             VARCHAR(20)  NOT NULL UNIQUE,
    num_telephone   VARCHAR(20)  NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    date_of_birth   DATE NOT NULL,
    address         VARCHAR(500),
    password        VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
        REFERENCES roles(code)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    agence_id VARCHAR(10)
        REFERENCES agences(id_branch),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version     BIGINT NOT NULL DEFAULT 0,
    created_by UUID REFERENCES gestionnaires(id),
    updated_by UUID REFERENCES gestionnaires(id)
);

-- Indexes for gestionnaires
CREATE INDEX IF NOT EXISTS idx_gestionnaires_email   ON gestionnaires (email);
CREATE INDEX IF NOT EXISTS idx_gestionnaires_cin     ON gestionnaires (cin);
CREATE INDEX IF NOT EXISTS idx_gestionnaires_role    ON gestionnaires (role);
CREATE INDEX IF NOT EXISTS idx_gestionnaires_active  ON gestionnaires (is_active);
CREATE INDEX IF NOT EXISTS idx_gestionnaires_agence  ON gestionnaires (agence_id);

COMMENT ON TABLE gestionnaires IS 'User profile (authentication handled by Keycloak)';

-- =====================================================
-- SYSTEM BOOTSTRAP USER
-- =====================================================
-- Use pgcrypto's crypt function to hash passwords with bcrypt algorithm
INSERT INTO gestionnaires (
    id, email, cin, num_telephone, first_name, last_name,
    date_of_birth, address, password, role, is_active, created_by
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'system@creditwise.com',
    'SYSTEM0001',
    '+21600000000',
    'System',
    'Bootstrap',
    '2000-01-01',
    'Tunis, Tunisia',
    crypt('ChangeMe123!', gen_salt('bf', 10)),
    'TECH_USER',
    true,
    NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO gestionnaires (
    id, email, cin, num_telephone, first_name, last_name,
    date_of_birth, address, password, role, is_active, created_by
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    'admin@creditwise.com',
    'ADMIN0001',
    '+21600000000',
    'admin',
    'admin',
    '2000-01-01',
    'Tunis, Tunisia',
    crypt('ChangeMe123!', gen_salt('bf', 10)),
    'SUPER_ADMIN',
    true,
    NULL
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE USERS (Tunisian persons)
-- =====================================================
INSERT INTO gestionnaires (
    id, email, cin, num_telephone, first_name, last_name,
    date_of_birth, address, password, role, agence_id, created_by
) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'ahmed.benali@creditwise.com', 'TN123456', '+21620000001', 'Ahmed', 'Ben Ali', '1985-03-15', 'Tunis', crypt('ChangeMe123!', gen_salt('bf', 10)), 'CRO', '100', '00000000-0000-0000-0000-000000000001'),
    ('550e8400-e29b-41d4-a716-446655440002', 'fatma.hassine@creditwise.com', 'TN234567', '+21620000002', 'Fatma', 'Hassine', '1990-07-22', 'Ariana', crypt('ChangeMe123!', gen_salt('bf', 10)), 'BRANCH_DM', '130', '00000000-0000-0000-0000-000000000001'),
    ('550e8400-e29b-41d4-a716-446655440003', 'mourad.trabelsi@creditwise.com', 'TN345678', '+21620000003', 'Mourad', 'Trabelsi', '1988-11-08', 'Sousse', crypt('ChangeMe123!', gen_salt('bf', 10)), 'SUPER_ADMIN', '210', '00000000-0000-0000-0000-000000000001'),
    ('550e8400-e29b-41d4-a716-446655440004', 'leila.karoui@creditwise.com', 'TN456789', '+21620000004', 'Leila', 'Karoui', '1987-05-30', 'Monastir', crypt('ChangeMe123!', gen_salt('bf', 10)), 'HEAD_OFFICE_DM', '230', '00000000-0000-0000-0000-000000000001'),
    ('550e8400-e29b-41d4-a716-446655440005', 'karim.mzoughi@creditwise.com', 'TN567890', '+21620000005', 'Karim', 'Mzoughi', '1992-09-12', 'Nabeul', crypt('ChangeMe123!', gen_salt('bf', 10)), 'RISK_ANALYST', '160', '00000000-0000-0000-0000-000000000001'),
    ('550e8400-e29b-41d4-a716-446655440006', 'hassan.jaziri@creditwise.com', 'TN678901', '+21620000006', 'Hassan', 'Jaziri', '1980-02-18', 'Sfax', crypt('ChangeMe123!', gen_salt('bf', 10)), 'FRONT_OFFICE', '530', '00000000-0000-0000-0000-000000000001'),
    ('550e8400-e29b-41d4-a716-446655440007', 'nadia.benahmed@creditwise.com', 'TN789012', '+21620000007', 'Nadia', 'Ben Ahmed', '1983-08-25', 'Gabes', crypt('ChangeMe123!', gen_salt('bf', 10)), 'READ_ONLY', '510', '00000000-0000-0000-0000-000000000001')
    ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- AUDIT FK for roles
-- =====================================================
ALTER TABLE roles
    ADD CONSTRAINT fk_roles_created_by
        FOREIGN KEY (created_by) REFERENCES gestionnaires(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_roles_updated_by
        FOREIGN KEY (updated_by) REFERENCES gestionnaires(id) ON DELETE RESTRICT;

