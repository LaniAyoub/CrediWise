# nouvelle_demande service
Demande (credit request) lifecycle management.

Start: cd backend/nouvelle_demande && mvn quarkus:dev
Test:  cd backend/nouvelle_demande && mvn test
Swagger: http://localhost:8083/q/swagger-ui

## IMPORTANT
- Demande ID is **Long** (auto-incremented), NOT UUID. Changed April 2025. Do not revert.
- ClientGrpcClient.java has uncommitted changes (check before committing)

## Key files
- src/main/java/org/acme/grpc/ClientGrpcClient.java → HAS UNCOMMITTED CHANGES
- src/main/java/org/acme/grpc/NouvelleDemandeGrpcService.java → NEW: GetDemandeById gRPC endpoint
- src/main/resources/application.properties → HTTP 8083, gRPC 9002
- src/main/resources/db/migration/V1__init_schema.sql → single migration
- src/main/proto/nouvelle_demande.proto → NEW: GetDemandeById service definition

## gRPC Services (port 9002)
- **HistoriqueService** (existing) — GetDemandesForClient: fetch all demandes for a client
- **NouvelleDemandeService** (NEW) — GetDemandeById: fetch single demande detail for Step 2 Section A

## Important: Proto File Sync
`nouvelle_demande.proto` is duplicated in `backend/analyse/src/main/proto/nouvelle_demande.proto`  
When updating this proto file, MUST update the copy in analyse service too!
