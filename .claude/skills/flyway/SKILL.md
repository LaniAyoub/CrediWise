# Flyway migration skill for CrediWise

Current migrations: !`find backend -name "V*.sql" -path "*/db/migration/*" -exec echo {} \; | sort`

Rules — burned into project memory:
1. NEVER edit an existing V*.sql file (Flyway tracks checksums — edits break startup)
2. ALWAYS create a new file with next version: V{n+1}__description.sql
3. File naming: V2__add_status_column.sql (double underscore, lowercase words)
4. Auto-runs on: mvn quarkus:dev startup (quarkus.flyway.migrate-at-start=true)
5. To repair a failed migration: mvn quarkus:dev -Dquarkus.flyway.repair=true

Migration file template:
  -- V{n}__{description}.sql
  -- Description: [what this migration does]
  -- Service: [gestionnaire|client|nouvelle_demande|analyse]
  -- Date: [YYYY-MM-DD]

  ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {type} {constraints};
  CREATE INDEX IF NOT EXISTS idx_{table}_{column} ON {table}({column});

If Flyway fails on startup:
  1. Check logs for "Migration checksum mismatch" → someone edited an existing file
  2. Check logs for "Migration version already applied" → duplicate version number
  3. Fix: create new migration or repair with -Dquarkus.flyway.repair=true
