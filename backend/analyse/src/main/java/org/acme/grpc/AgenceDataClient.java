package org.acme.grpc;

import io.grpc.StatusRuntimeException;
import io.quarkus.grpc.GrpcClient;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * gRPC client to fetch agence data from the gestionnaire service.
 * Agence data is supplementary (not critical) — failures are logged as warnings.
 */
@ApplicationScoped
public class AgenceDataClient {

    @GrpcClient("gestionnaire-service")
    GestionnaireServiceGrpc.GestionnaireServiceBlockingStub gestionnaireStub;

    /**
     * Fetch agence details by ID.
     * Failures return Optional.empty() (agence data is optional).
     *
     * @param agenceId VARCHAR(10) code of the agence
     * @return Optional containing AgenceResponse, empty if unavailable
     */
    public Optional<AgenceResponse> fetchAgence(String agenceId) {
        if (agenceId == null || agenceId.isBlank()) {
            return Optional.empty();
        }

        try {
            AgenceRequest request = AgenceRequest.newBuilder()
                .setIdBranch(agenceId)
                .build();

            AgenceResponse response = gestionnaireStub
                .withDeadlineAfter(5, TimeUnit.SECONDS)
                .getAgenceById(request);

            if (!response.getFound()) {
                Log.warn("Agence not found: " + agenceId);
                return Optional.empty();
            }

            return Optional.of(response);

        } catch (StatusRuntimeException e) {
            Log.warn("gRPC warning fetching agence " + agenceId + ": service unavailable (" + e.getStatus().getCode() + ")");
            return Optional.empty();
        } catch (Exception e) {
            Log.warn("Unexpected error fetching agence: " + e.getMessage());
            return Optional.empty();
        }
    }
}
