package org.acme.grpc;

import io.grpc.StatusRuntimeException;
import io.quarkus.grpc.GrpcClient;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.concurrent.TimeUnit;

@ApplicationScoped
public class ClientGrpcClient {

    @GrpcClient("client-service")
    ClientService clientService;

    public ClientResponse getClient(String id) {
        try {
            return clientService.getClientById(
                    ClientRequest.newBuilder().setId(id).build()
            ).await().atMost(java.time.Duration.ofSeconds(5));
        } catch (StatusRuntimeException e) {
            Log.errorf("gRPC getClient failed for id=%s: %s", id, e.getStatus());
            throw e;
        }
    }

    public boolean clientExists(String id) {
        return getClient(id).getFound();
    }

    public boolean incrementClientCycle(String id) {
        try {
            ClientCycleUpdateResponse response = clientService.incrementClientCycle(
                    ClientRequest.newBuilder().setId(id).build()
            ).await().atMost(java.time.Duration.ofSeconds(5));
            return response.getSuccess();
        } catch (StatusRuntimeException e) {
            Log.errorf("gRPC incrementClientCycle failed for id=%s: %s", id, e.getStatus());
            return false;
        }
    }

    public boolean updateClientScoring(String id, String scoring) {
        try {
            ClientScoringUpdateResponse response = clientService.updateClientScoring(
                    ClientScoringUpdateRequest.newBuilder()
                            .setId(id)
                            .setScoring(scoring)
                            .build()
            ).await().atMost(java.time.Duration.ofSeconds(5));
            return response.getSuccess();
        } catch (StatusRuntimeException e) {
            Log.errorf("gRPC updateClientScoring failed for id=%s: %s", id, e.getStatus());
            return false;
        }
    }
}
