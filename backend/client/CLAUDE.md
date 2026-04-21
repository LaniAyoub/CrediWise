# client service
Client management. Calls gestionnaire via gRPC for agence/gestionnaire lookups.

Start: cd backend/client && mvn quarkus:dev
Test:  cd backend/client && mvn test
Swagger: http://localhost:8082/q/swagger-ui

Key files:
- src/main/proto/gestionnaire.proto → DUPLICATE of gestionnaire's proto. Keep in sync manually.
- src/main/proto/client.proto → this service's own proto
- src/main/resources/application.properties → HTTP 8082, gRPC 9001, points to gestionnaire gRPC :9000

Dependency: gestionnaire must be running on gRPC :9000 for client to start without errors.
