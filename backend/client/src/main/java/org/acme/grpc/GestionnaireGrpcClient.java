package org.acme.grpc;

import io.quarkus.grpc.GrpcClient;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Duration;

@ApplicationScoped
public class GestionnaireGrpcClient {

    @GrpcClient("gestionnaire-service")
    GestionnaireService gestionnaireService;

    public AgenceResponse getAgence(String idBranch) {
        try {
            return gestionnaireService
                    .getAgenceById(AgenceRequest.newBuilder().setIdBranch(idBranch).build())
                    .await().atMost(Duration.ofSeconds(5));
        } catch (RuntimeException e) {
            Log.warnf("gRPC getAgence failed for idBranch=%s: %s", idBranch, e.getMessage());
            return AgenceResponse.newBuilder().setFound(false).build();
        }
    }

    public GestionnaireResponse getGestionnaire(String id) {
        try {
            return gestionnaireService
                    .getGestionnaireById(GestionnaireRequest.newBuilder().setId(id).build())
                    .await().atMost(Duration.ofSeconds(5));
        } catch (RuntimeException e) {
            Log.warnf("gRPC getGestionnaire failed for id=%s: %s", id, e.getMessage());
            return GestionnaireResponse.newBuilder().setFound(false).build();
        }
    }

    public boolean agenceExists(String idBranch) {
        return getAgence(idBranch).getFound();
    }

    public boolean gestionnaireExists(String id) {
        return getGestionnaire(id).getFound();
    }
}
