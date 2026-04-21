Create a new Flyway migration for a CrediWise service.

Usage: /new-migration [service: gestionnaire|client|nouvelle_demande|analyse] [description]

Steps:
1. List existing migrations: ls backend/$SERVICE/src/main/resources/db/migration/
2. Determine next version number (highest V number + 1)
3. Create file: backend/$SERVICE/src/main/resources/db/migration/V{next}__{description}.sql
4. Write the SQL migration (CREATE TABLE, ALTER TABLE, etc.)
5. Always include: IF NOT EXISTS on CREATE TABLE
6. Always include: proper indexes on foreign keys and frequently queried columns
7. Print the created file path and content for review
8. REMINDER: Flyway will auto-run this on next quarkus:dev startup

NEVER edit existing V*.sql files. Always new file, always higher version number.
