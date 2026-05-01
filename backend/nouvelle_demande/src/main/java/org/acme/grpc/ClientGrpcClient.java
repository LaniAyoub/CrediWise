package org.acme.grpc;

import io.quarkus.grpc.GrpcClient;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ClientGrpcClient {

    @GrpcClient("client-service")
    ClientService clientService;

    public ClientResponse getClient(String id) {
        return clientService.getClientById(
                ClientRequest.newBuilder().setId(id).build()
        ).await().indefinitely();
    }

    public boolean clientExists(String id) {
        return getClient(id).getFound();
    }

    public boolean incrementClientCycle(String id) {
        ClientCycleUpdateResponse response = clientService.incrementClientCycle(
                ClientRequest.newBuilder().setId(id).build()
        ).await().indefinitely();
        return response.getSuccess();
    }

    public boolean updateClientScoring(String id, String scoring) {
        ClientScoringUpdateResponse response = clientService.updateClientScoring(
                ClientScoringUpdateRequest.newBuilder()
                        .setId(id)
                        .setScoring(scoring)
                        .build()
        ).await().indefinitely();
        return response.getSuccess();
    }
}
