-- Change cycle from VARCHAR to INTEGER; default 0 for new clients
ALTER TABLE clients
    ALTER COLUMN cycle TYPE INTEGER
    USING COALESCE(NULLIF(TRIM(COALESCE(cycle, '')), '')::INTEGER, 0);

ALTER TABLE clients
    ALTER COLUMN cycle SET DEFAULT 0;

-- Ensure any remaining NULLs become 0
UPDATE clients SET cycle = 0 WHERE cycle IS NULL;
