# CrediWise

Credit management platform. 4 independent Quarkus microservices + React frontend.

# Architecture
- backend/gestionnaire/   → Main service: Keycloak OIDC resource server, agence/gestionnaire management (HTTP :8080, gRPC :9000)
- backend/client/         → Client management, calls gestionnaire via gRPC (HTTP :8082, gRPC :9001)
- backend/nouvelle_demande/ → Demande lifecycle management (HTTP :8083, gRPC :9002)
- backend/analyse/        → Credit analysis service (HTTP :8084, gRPC :9003)
- frontend/               → React 19 + Vite + TailwindCSS (dev server :3000)
- docker-compose.yml      → 5 PostgreSQL DBs (including Keycloak) + Keycloak + pgAdmin (root level)

Each service has its OWN Maven project, its OWN database, its OWN Flyway migrations. There is NO shared parent POM.

# Stack
- Backend: Java 21, Quarkus 3.34.1, Hibernate ORM Panache, Flyway, gRPC, Quarkus OIDC
- Frontend: React 19.2, TypeScript 5.9, Vite 8, TailwindCSS 3.4, React Router 7, React Hook Form + Zod, i18next, Axios
- Databases: PostgreSQL 15 (5 separate instances, including Keycloak DB)
- Auth: Keycloak (OIDC/OAuth2) as the only identity provider
- Roles: FRONT_OFFICE, SUPER_ADMIN

# Port map
gestionnaire  HTTP 8080  gRPC 9000  DB 5432
client        HTTP 8082  gRPC 9001  DB 5433
nouvelle_demande HTTP 8083 gRPC 9002 DB 5434
analyse       HTTP 8084  gRPC 9003  DB 5435
frontend      3000
pgAdmin       8081
keycloak      8180

# Start dev
1. docker-compose up -d                          (start DBs + Keycloak + pgAdmin)
2. cd backend/gestionnaire && mvn quarkus:dev    (terminal 1)
3. cd backend/client && mvn quarkus:dev          (terminal 2)
4. cd backend/nouvelle_demande && mvn quarkus:dev (terminal 3)
5. cd backend/analyse && mvn quarkus:dev         (terminal 4)
6. cd frontend && npm run dev                    (terminal 5)

# Essential commands (run from each service dir)
- Dev mode:     mvn quarkus:dev
- Build JAR:    mvn clean package -DskipTests
- Build native: mvn clean package -Dnative -DskipTests
- Run tests:    mvn test
- Frontend dev: cd frontend && npm run dev
- Frontend build: cd frontend && npm run build
- Frontend lint: cd frontend && npm run lint
- Frontend typecheck: cd frontend && npx tsc --noEmit
- Swagger UI:   http://localhost:{port}/q/swagger-ui
- Dev UI:       http://localhost:{port}/q/dev-ui

# Flyway migrations — CRITICAL RULES
- NEVER edit an existing migration file (V1__, V2__, etc.)
- ALWAYS create a new versioned file: V{next}__description.sql
- Migration runs automatically on quarkus:dev startup
- Migration files location: src/main/resources/db/migration/
- gestionnaire: V1__init_schema.sql, V2__hash_existing_passwords.sql
- client: V1__init_schema.sql
- nouvelle_demande: V1__init_schema.sql
- analyse: no migrations yet

# gRPC inter-service rules
- gestionnaire exposes: GestionnaireService, AgenceService (gestionnaire.proto)
- client calls gestionnaire gRPC at port 9000
- Proto files: src/main/proto/ in each service
- IMPORTANT: gestionnaire.proto is DUPLICATED in client/src/main/proto/ — if you update gestionnaire.proto, update the copy in client too
- Shared proto dir (shared/) is EMPTY — do not expect shared proto compilation

# Security — IMPORTANT
- No custom JWT signing is allowed in services. Tokens are issued only by Keycloak.
- Dev DB credentials are hardcoded (admin:admin) — acceptable for dev, NEVER in prod
- CORS: gestionnaire allows http://localhost:3000 only

# What I commonly get wrong
- Forgetting to update the duplicate gestionnaire.proto in backend/client/src/main/proto/
- Running mvn commands from wrong directory (always cd into the service first)
- Forgetting docker-compose up before starting services (DBs must be running)
- Flyway checksum errors from editing existing migration files
- Frontend env: VITE_API_BASE_URL must point to gestionnaire (:8080), not other services
- Demande ID changed from UUID to Long (Apr 2025) — do not revert to UUID
- backend/nouvelle_demande/src/main/java/org/acme/grpc/ClientGrpcClient.java has uncommitted changes — check before committing

# Do not do these things
- NEVER create a shared parent pom.xml — services are intentionally independent
- NEVER modify src/main/resources/db/migration/V*.sql files that already exist
- NEVER use localhost inside Docker network — use service names from docker-compose
- NEVER delete Flyway migration history table
- NEVER run mvn clean install at repo root — no parent POM exists
