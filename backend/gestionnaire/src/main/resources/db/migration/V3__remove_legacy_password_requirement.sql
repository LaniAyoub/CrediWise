-- Authentication is fully delegated to Keycloak.
-- Keep the legacy column for backward compatibility but stop requiring data.
-- Authentication is fully delegated to Keycloak.
-- Keep the legacy column for backward compatibility but stop requiring data.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gestionnaires' AND column_name='password') THEN
        ALTER TABLE gestionnaires ALTER COLUMN password DROP NOT NULL;
    END IF;
END $$;
