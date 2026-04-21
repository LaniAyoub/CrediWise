# gestionnaire service
Main CrediWise service: JWT auth, agence and gestionnaire management.

Start: cd backend/gestionnaire && mvn quarkus:dev
Test:  cd backend/gestionnaire && mvn test
Build: cd backend/gestionnaire && mvn clean package -DskipTests
Swagger: http://localhost:8080/q/swagger-ui

Key files:
- src/main/java/org/acme/ → REST resources, entities, services
- src/main/proto/gestionnaire.proto → AUTHORITATIVE proto (duplicate exists in client/)
- src/main/resources/application.properties → HTTP 8080, gRPC 9000, JWT config, CORS
- src/main/resources/db/migration/ → V1__init_schema.sql, V2__hash_existing_passwords.sql
- privateKey.pem + publicKey.pem → JWT RS256 keys (must exist, must NOT be in git)

CORS: allows http://localhost:3000 only.
Auth: issues and validates JWT. Other services validate JWT but don't issue it.
gRPC: exposes GestionnaireService and AgenceService on port 9000.
