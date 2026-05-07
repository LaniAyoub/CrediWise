-- Add keycloak_id so ProfileResource can look up the gestionnaire by the
-- Keycloak user's "sub" UUID claim when email / preferred_username are
-- absent from the access token (e.g. protocol mappers not configured).
--
-- The column is nullable — existing rows keep keycloak_id = NULL and are
-- still looked up by email.  The backend will populate it opportunistically
-- on the first successful profile request that resolves by email.

ALTER TABLE gestionnaires
    ADD COLUMN IF NOT EXISTS keycloak_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_gestionnaire_keycloak_id
    ON gestionnaires (keycloak_id)
    WHERE keycloak_id IS NOT NULL;
