package org.acme.grpc;

import io.quarkus.grpc.GrpcClient;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class GestionnaireGrpcClient {

    @GrpcClient("gestionnaire-service")
    GestionnaireService gestionnaireService;

    public AgenceResponse getAgence(String idBranch) {
        return gestionnaireService.getAgenceById(
                AgenceRequest.newBuilder().setIdBranch(idBranch).build()
        ).await().indefinitely();
    }

    public GestionnaireResponse getGestionnaire(String id) {
        return gestionnaireService.getGestionnaireById(
                GestionnaireRequest.newBuilder().setId(id).build()
        ).await().indefinitely();
    }

    public boolean agenceExists(String idBranch) {
        return getAgence(idBranch).getFound();
    }

    public boolean gestionnaireExists(String id) {
        return getGestionnaire(id).getFound();
    }
}