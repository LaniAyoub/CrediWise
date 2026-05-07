package org.acme.grpc;

import io.grpc.StatusRuntimeException;
import io.quarkus.grpc.GrpcClient;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class GestionnaireGrpcClient {

    @GrpcClient("gestionnaire-service")
    GestionnaireService gestionnaireService;

    public AgenceResponse getAgence(String idBranch) {
        try {
            return gestionnaireService.getAgenceById(
                    AgenceRequest.newBuilder().setIdBranch(idBranch).build()
            ).await().atMost(java.time.Duration.ofSeconds(5));
        } catch (StatusRuntimeException e) {
            Log.errorf("gRPC getAgence failed for idBranch=%s: %s", idBranch, e.getStatus());
            throw e;
        }
    }

    public GestionnaireResponse getGestionnaire(String id) {
        try {
            return gestionnaireService.getGestionnaireById(
                    GestionnaireRequest.newBuilder().setId(id).build()
            ).await().atMost(java.time.Duration.ofSeconds(5));
        } catch (StatusRuntimeException e) {
            Log.errorf("gRPC getGestionnaire failed for id=%s: %s", id, e.getStatus());
            throw e;
        }
    }

    public boolean agenceExists(String idBranch) {
        return getAgence(idBranch).getFound();
    }

    public boolean gestionnaireExists(String id) {
        return getGestionnaire(id).getFound();
    }
}
