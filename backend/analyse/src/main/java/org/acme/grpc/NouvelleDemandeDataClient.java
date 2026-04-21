package org.acme.grpc;

import io.quarkus.grpc.GrpcClient;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import org.acme.exception.ServiceUnavailableException;

import java.util.concurrent.TimeUnit;

/**
 * gRPC client for fetching Demande data from nouvelle_demande service.
 * Used by Step 2 (Credit Object) to fetch Section A snapshot.
 */
@ApplicationScoped
public class NouvelleDemandeDataClient {

    @GrpcClient("nouvelle-demande-service")
    NouvelleDemandeServiceGrpc.NouvelleDemandeServiceBlockingStub demandeService;

    /**
     * Fetch demande details by ID from nouvelle_demande service.
     * Fetches only the fields needed for Step 2 Section A.
     *
     * @param demandeId ID of the demande
     * @return DemandeDetail with all Section A fields
     * @throws ServiceUnavailableException if service is unavailable
     */
    public DemandeDetail fetchDemandeById(Long demandeId) {
        try {
            Log.info("Fetching demande: " + demandeId + " from nouvelle_demande service");

            GetDemandeByIdRequest request = GetDemandeByIdRequest.newBuilder()
                .setDemandeId(demandeId)
                .build();

            DemandeDetailResponse response = demandeService
                .withDeadlineAfter(5, TimeUnit.SECONDS)
                .getDemandeById(request);

            if (!response.getSuccess()) {
                throw new ServiceUnavailableException("nouvelle_demande service error: " + response.getErrorMessage());
            }

            Log.info("Successfully fetched demande: " + demandeId);
            return response.getData();

        } catch (io.grpc.StatusRuntimeException e) {
            Log.error("gRPC error fetching demande " + demandeId + ": " + e.getStatus().getDescription(), e);
            throw new ServiceUnavailableException("nouvelle_demande service unavailable: " + e.getStatus().getDescription());
        } catch (Exception e) {
            Log.error("Unexpected error fetching demande " + demandeId + ": " + e.getMessage(), e);
            throw new ServiceUnavailableException("Error fetching demande: " + e.getMessage());
        }
    }
}
