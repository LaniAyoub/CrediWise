-- ============================================================
-- Migration V4: Change Demande ID from UUID to BIGSERIAL
-- ============================================================

-- Drop dependent tables first (they're empty anyway)
DROP TABLE IF EXISTS guarantees CASCADE;
DROP TABLE IF EXISTS guarantors CASCADE;

-- Drop old indexes on demandes
DROP INDEX IF EXISTS idx_demandes_client_id;
DROP INDEX IF EXISTS idx_demandes_status;
DROP INDEX IF EXISTS idx_demandes_deleted_at;

-- Drop old id column and recreate with BIGSERIAL
ALTER TABLE demandes DROP CONSTRAINT demandes_pkey;
ALTER TABLE demandes DROP COLUMN id;
ALTER TABLE demandes ADD COLUMN id BIGSERIAL PRIMARY KEY;

-- Recreate guarantors table with BIGINT foreign key
CREATE TABLE guarantors (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    demande_id           BIGINT      NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
    amplitude_id         VARCHAR(100),
    name                 VARCHAR(200),
    client_relationship  VARCHAR(100)
);

CREATE INDEX idx_guarantors_demande ON guarantors (demande_id);

-- Recreate guarantees table with BIGINT foreign key
CREATE TABLE guarantees (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    demande_id     BIGINT       NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
    owner          VARCHAR(200),
    type           VARCHAR(100),
    estimated_value NUMERIC(15,3)
);

CREATE INDEX idx_guarantees_demande ON guarantees (demande_id);

-- Recreate demandes indexes
CREATE INDEX idx_demandes_client_id ON demandes (client_id);
CREATE INDEX idx_demandes_status ON demandes (status);
CREATE INDEX idx_demandes_deleted_at ON demandes (deleted_at);
