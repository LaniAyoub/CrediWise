# gRPC skill for CrediWise

Proto files in project: !`find backend -name "*.proto" | sort`

Service topology:
  gestionnaire exposes gRPC on :9000 → GestionnaireService, AgenceService
  client        exposes gRPC on :9001 → ClientService (+ imports gestionnaire.proto)
  nouvelle_demande gRPC :9002 (proto not yet created)
  analyse       gRPC :9003 (proto not yet created)

IMPORTANT duplication:
  backend/gestionnaire/src/main/proto/gestionnaire.proto  ← AUTHORITATIVE
  backend/client/src/main/proto/gestionnaire.proto        ← DUPLICATE (must stay in sync manually)
  If you update the authoritative file, ALWAYS update the duplicate.

Generate Java stubs after proto change:
  cd backend/{service} && mvn generate-sources

Quarkus gRPC server annotation: @GrpcService
Quarkus gRPC client injection: @GrpcClient("gestionnaire")

gRPC client call pattern with deadline:
  try {
      var response = gestionnaireClient
          .withDeadlineAfter(5, TimeUnit.SECONDS)
          .getGestionnaireById(request);
  } catch (StatusRuntimeException e) {
      Log.errorf("gRPC call failed: %s", e.getStatus());
      throw new WebApplicationException(Response.Status.SERVICE_UNAVAILABLE);
  }

Test gRPC connectivity:
  grpcurl -plaintext localhost:9000 list  (if grpcurl installed)
  or check Quarkus dev-ui gRPC tab at http://localhost:{port}/q/dev-ui
