# gestionnaire service
Main CrediWise service: Keycloak OIDC resource server, agence and gestionnaire management.

Start: cd backend/gestionnaire && mvn quarkus:dev
Test:  cd backend/gestionnaire && mvn test
Build: cd backend/gestionnaire && mvn clean package -DskipTests
Swagger: http://localhost:8080/q/swagger-ui

Key files:
- src/main/java/org/acme/ → REST resources, entities, services
- src/main/proto/gestionnaire.proto → AUTHORITATIVE proto (duplicate exists in client/)
- src/main/resources/application.properties → HTTP 8080, gRPC 9000, OIDC config, CORS
- src/main/resources/db/migration/ → V1__init_schema.sql, V2__hash_existing_passwords.sql (empty placeholder), V3__remove_legacy_password_requirement.sql

CORS: allows http://localhost:3000 only.
Auth: validates Keycloak JWT access tokens only (no token issuance in this service).
gRPC: exposes GestionnaireService and AgenceService on port 9000.
