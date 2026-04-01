-- =====================================================
-- V2.0__Add_internationalization_support.sql
-- Multi-language support: French & English
-- =====================================================

-- =====================================================
-- TABLE: languages
-- Core language definitions
-- =====================================================
CREATE TABLE IF NOT EXISTS languages (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(5) NOT NULL UNIQUE,
    name            VARCHAR(50) NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE languages IS 'Supported languages: en, fr';

INSERT INTO languages (code, name, is_active) VALUES
('en', 'English', TRUE),
('fr', 'Français', TRUE)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- TABLE: role_translations
-- Translations for role labels and descriptions
-- =====================================================
CREATE TABLE IF NOT EXISTS role_translations (
    id              BIGSERIAL PRIMARY KEY,
    role_id         BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    language_id     INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    label           VARCHAR(200) NOT NULL,
    description     TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_role_translations UNIQUE(role_id, language_id)
);

CREATE INDEX idx_role_trans_role ON role_translations(role_id);
CREATE INDEX idx_role_trans_lang ON role_translations(language_id);

COMMENT ON TABLE role_translations IS 'Localized role labels and descriptions';

-- =====================================================
-- TABLE: screen_translations
-- Translations for screen labels
-- =====================================================
CREATE TABLE IF NOT EXISTS screen_translations (
    id              BIGSERIAL PRIMARY KEY,
    screen_id       BIGINT NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
    language_id     INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    label           VARCHAR(200) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_screen_translations UNIQUE(screen_id, language_id)
);

CREATE INDEX idx_screen_trans_screen ON screen_translations(screen_id);
CREATE INDEX idx_screen_trans_lang ON screen_translations(language_id);

COMMENT ON TABLE screen_translations IS 'Localized screen labels';

-- =====================================================
-- TABLE: permission_type_translations
-- Translations for permission type labels
-- =====================================================
CREATE TABLE IF NOT EXISTS permission_type_translations (
    id                  BIGSERIAL PRIMARY KEY,
    permission_type_id  BIGINT NOT NULL REFERENCES permission_types(id) ON DELETE CASCADE,
    language_id         INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    label               VARCHAR(100) NOT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_permission_type_trans UNIQUE(permission_type_id, language_id)
);

CREATE INDEX idx_perm_trans_perm ON permission_type_translations(permission_type_id);
CREATE INDEX idx_perm_trans_lang ON permission_type_translations(language_id);

COMMENT ON TABLE permission_type_translations IS 'Localized permission type labels';

-- =====================================================
-- ALTER gestionnaire: Add language preference
-- =====================================================
ALTER TABLE gestionnaire
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'en';

-- =====================================================
-- SEED: Role Translations (English)
-- =====================================================
INSERT INTO role_translations (role_id, language_id, label, description)
SELECT r.id, 1, r.label, r.description FROM roles r
ON CONFLICT (role_id, language_id) DO NOTHING;

-- =====================================================
-- SEED: Role Translations (French)
-- =====================================================
WITH role_data AS (
    VALUES
        (1, 'Super Administrateur', 'Accès complet au système'),
        (2, 'Agent Relations Client', 'Gère les demandes des clients'),
        (3, 'Décideur Succursale', 'Approuve au niveau succursale'),
        (4, 'Décideur Siège', 'Approuve au niveau siège'),
        (5, 'Analyste Risque Crédit', 'Analyse le risque crédit'),
        (6, 'Front Office', 'Gère les interactions front'),
        (7, 'Utilisateur Lecture Seule', 'Accès en lecture seule'),
        (8, 'Utilisateur Technique (UAT)', 'Accès complet en UAT')
)
INSERT INTO role_translations (role_id, language_id, label, description)
SELECT * FROM (SELECT r.id as role_id, 2 as language_id,
               d.column2 as label, d.column3 as description
               FROM roles r, role_data d WHERE r.id = d.column1) t
ON CONFLICT (role_id, language_id) DO NOTHING;

-- =====================================================
-- SEED: Screen Translations (English)
-- =====================================================
INSERT INTO screen_translations (screen_id, language_id, label)
SELECT s.id, 1, s.label FROM screens s
ON CONFLICT (screen_id, language_id) DO NOTHING;

-- =====================================================
-- SEED: Screen Translations (French)
-- =====================================================
WITH screen_data AS (
    VALUES
        (1, 'Page Accueil'),
        (2, 'Nouvelle Demande'),
        (3, 'Formulaire Demande Crédit'),
        (4, 'Checklist'),
        (5, 'Formulaire CRA'),
        (6, 'Formulaire LCM'),
        (7, 'Formulaire Visite Gestion')
)
INSERT INTO screen_translations (screen_id, language_id, label)
SELECT * FROM (SELECT s.id as screen_id, 2 as language_id,
               d.column2 as label
               FROM screens s, screen_data d WHERE s.id = d.column1) t
ON CONFLICT (screen_id, language_id) DO NOTHING;

-- =====================================================
-- SEED: Permission Type Translations (English)
-- =====================================================
INSERT INTO permission_type_translations (permission_type_id, language_id, label)
SELECT pt.id, 1, pt.code FROM permission_types pt
ON CONFLICT (permission_type_id, language_id) DO NOTHING;

-- =====================================================
-- SEED: Permission Type Translations (French)
-- =====================================================
WITH permission_data AS (
    VALUES
        (1, 'Lecture'),
        (2, 'Écriture'),
        (3, 'Écriture Partielle'),
        (4, 'Écriture Assignée')
)
INSERT INTO permission_type_translations (permission_type_id, language_id, label)
SELECT * FROM (SELECT pt.id as permission_type_id, 2 as language_id,
               d.column2 as label
               FROM permission_types pt, permission_data d WHERE pt.id = d.column1) t
ON CONFLICT (permission_type_id, language_id) DO NOTHING;

-- =====================================================
-- Indexes for performance
-- =====================================================
CREATE INDEX idx_gestionnaire_language ON gestionnaire(preferred_language);

