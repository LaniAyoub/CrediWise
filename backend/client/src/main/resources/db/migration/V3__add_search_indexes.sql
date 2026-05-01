-- V3__add_search_indexes.sql
-- Enable PostgreSQL trigram extension and add GIN indexes for high-performance
-- full-text fuzzy search on the clients table.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram indexes — used by ILIKE queries when pg_trgm is enabled.
-- Each index covers one searchable column. The planner uses them automatically
-- for '%query%' patterns, making fuzzy search sub-millisecond even at scale.

CREATE INDEX IF NOT EXISTS idx_client_trgm_first_name  ON clients USING GIN (first_name  gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_client_trgm_last_name   ON clients USING GIN (last_name   gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_client_trgm_company     ON clients USING GIN (company_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_client_trgm_national_id ON clients USING GIN (national_id gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_client_trgm_phone       ON clients USING GIN (primary_phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_client_trgm_email       ON clients USING GIN (email       gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_client_trgm_cbs_id      ON clients USING GIN (cbs_id      gin_trgm_ops);
