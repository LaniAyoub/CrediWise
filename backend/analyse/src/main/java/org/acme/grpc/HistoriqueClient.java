package org.acme.grpc;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.grpc.StatusRuntimeException;
import io.quarkus.grpc.GrpcClient;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import org.acme.dto.CreditHistoriqueItem;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * gRPC client to fetch credit history from the nouvelle_demande service.
 * History data is informational (not critical) — failures are logged as warnings.
 */
@ApplicationScoped
public class HistoriqueClient {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @GrpcClient("nouvelle-demande-service")
    HistoriqueServiceGrpc.HistoriqueServiceBlockingStub historiqueStub;

    /**
     * Fetch past demandes for a client.
     * Failures return empty list (history is informational).
     *
     * @param clientId UUID string of the client
     * @return List of CreditHistoriqueItem (may be empty)
     */
    public List<CreditHistoriqueItem> fetchHistorique(String clientId) {
        if (clientId == null || clientId.isBlank()) {
            return new ArrayList<>();
        }

        try {
            GetDemandesForClientRequest request = GetDemandesForClientRequest.newBuilder()
                .setClientId(clientId)
                .build();

            DemandeSummaryListResponse response = historiqueStub
                .withDeadlineAfter(5, TimeUnit.SECONDS)
                .getDemandesForClient(request);

            if (!response.getSuccess()) {
                Log.warn("Historique service returned error: " + response.getErrorMessage());
                return new ArrayList<>();
            }

            List<CreditHistoriqueItem> items = new ArrayList<>();
            for (DemandeSummary summary : response.getDemandesList()) {
                CreditHistoriqueItem item = new CreditHistoriqueItem(
                    summary.getDemandeId(),
                    summary.getStatus(),
                    summary.getRequestedAmount(),
                    summary.getDurationMonths(),
                    summary.getProductName(),
                    summary.getLoanPurpose(),
                    summary.getManagerName(),
                    summary.getApplicationChannel(),
                    summary.getBankingRestriction(),
                    summary.getLegalIssueOrAccountBlocked(),
                    summary.getGuarantorsCount(),
                    summary.getGuaranteesCount(),
                    summary.getCreatedAt(),
                    summary.getUpdatedAt()
                );
                items.add(item);
            }

            return items;

        } catch (StatusRuntimeException e) {
            Log.warn("gRPC warning fetching historique for client " + clientId + ": service unavailable (" + e.getStatus().getCode() + ")");
            return new ArrayList<>();
        } catch (Exception e) {
            Log.warn("Unexpected error fetching historique: " + e.getMessage());
            return new ArrayList<>();
        }
    }
}
