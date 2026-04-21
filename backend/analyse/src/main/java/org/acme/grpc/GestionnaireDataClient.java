package org.acme.grpc;

import io.grpc.StatusRuntimeException;
import io.quarkus.grpc.GrpcClient;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * gRPC client to fetch gestionnaire (manager) data from the gestionnaire service.
 * Manager data is supplementary (not critical) — failures are logged as warnings.
 */
@ApplicationScoped
public class GestionnaireDataClient {

    @GrpcClient("gestionnaire-service")
    GestionnaireServiceGrpc.GestionnaireServiceBlockingStub gestionnaireStub;

    /**
     * Fetch gestionnaire (manager) details by ID.
     * Failures return Optional.empty() (manager data is optional).
     *
     * @param gestionnaireId UUID of the gestionnaire
     * @return Optional containing GestionnaireResponse, empty if unavailable
     */
    public Optional<GestionnaireResponse> fetchGestionnaire(UUID gestionnaireId) {
        if (gestionnaireId == null) {
            return Optional.empty();
        }

        try {
            GestionnaireRequest request = GestionnaireRequest.newBuilder()
                .setId(gestionnaireId.toString())
                .build();

            GestionnaireResponse response = gestionnaireStub
                .withDeadlineAfter(5, TimeUnit.SECONDS)
                .getGestionnaireById(request);

            if (!response.getFound()) {
                Log.warn("Gestionnaire not found: " + gestionnaireId);
                return Optional.empty();
            }

            return Optional.of(response);

        } catch (StatusRuntimeException e) {
            Log.warn("gRPC warning fetching gestionnaire " + gestionnaireId + ": service unavailable (" + e.getStatus().getCode() + ")");
            return Optional.empty();
        } catch (Exception e) {
            Log.warn("Unexpected error fetching gestionnaire: " + e.getMessage());
            return Optional.empty();
        }
    }
}
