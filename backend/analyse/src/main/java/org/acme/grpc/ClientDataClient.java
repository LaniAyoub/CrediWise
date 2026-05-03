package org.acme.grpc;

import io.grpc.StatusRuntimeException;
import io.quarkus.grpc.GrpcClient;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import org.acme.exception.NotFoundException;
import org.acme.exception.ServiceUnavailableException;

import java.util.concurrent.TimeUnit;

/**
 * gRPC client to fetch client data from the client service.
 */
@ApplicationScoped
public class ClientDataClient {

    @GrpcClient("client-service")
    ClientServiceGrpc.ClientServiceBlockingStub clientStub;

    /**
     * Fetch client details by ID.
     *
     * @param clientId UUID string of the client
     * @return ClientResponse with all client fields
     * @throws ServiceUnavailableException if service is down or times out
     * @throws org.acme.exception.NotFoundException if client not found
     */
    public ClientResponse fetchClient(String clientId) {
        try {
            ClientRequest request = ClientRequest.newBuilder()
                .setId(clientId)
                .build();

            ClientResponse response = clientStub
                .withDeadlineAfter(5, TimeUnit.SECONDS)
                .getClientById(request);

            if (!response.getFound()) {
                throw new NotFoundException("Client introuvable: " + clientId);
            }

            return response;

        } catch (StatusRuntimeException e) {
            Log.error("gRPC error fetching client " + clientId + ": " + e.getStatus(), e);

            switch (e.getStatus().getCode()) {
                case UNAVAILABLE:
                case DEADLINE_EXCEEDED:
                    throw new ServiceUnavailableException("Service client indisponible", e);
                case NOT_FOUND:
                    throw new NotFoundException("Client introuvable: " + clientId, e);
                default:
                    throw new ServiceUnavailableException("Service client indisponible", e);
            }
        } catch (Exception e) {
            Log.error("Unexpected error fetching client: " + e.getMessage(), e);
            throw new ServiceUnavailableException("Service client indisponible", e);
        }
    }

    /**
     * Update client scoring by ID.
     *
     * @param clientId UUID string of the client
     * @param scoring Scoring decision (ACCEPTE, A_ETUDIER, REFUSE)
     * @return true if update successful
     * @throws ServiceUnavailableException if service is down or times out
     */
    public boolean updateScoring(String clientId, String scoring) {
        try {
            ClientScoringUpdateRequest request = ClientScoringUpdateRequest.newBuilder()
                .setId(clientId)
                .setScoring(scoring)
                .build();

            ClientScoringUpdateResponse response = clientStub
                .withDeadlineAfter(5, TimeUnit.SECONDS)
                .updateClientScoring(request);

            return response.getSuccess();

        } catch (StatusRuntimeException e) {
            Log.error("gRPC error updating client scoring " + clientId + ": " + e.getStatus(), e);

            switch (e.getStatus().getCode()) {
                case UNAVAILABLE:
                case DEADLINE_EXCEEDED:
                    throw new ServiceUnavailableException("Service client indisponible", e);
                case NOT_FOUND:
                    throw new org.acme.exception.NotFoundException("Client introuvable: " + clientId, e);
                default:
                    throw new ServiceUnavailableException("Service client indisponible", e);
            }
        } catch (Exception e) {
            Log.error("Unexpected error updating client scoring: " + e.getMessage(), e);
            throw new ServiceUnavailableException("Service client indisponible", e);
        }
    }
}
