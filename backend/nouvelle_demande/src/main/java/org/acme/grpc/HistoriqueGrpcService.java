package org.acme.grpc;

import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import io.quarkus.grpc.GrpcService;
import io.quarkus.logging.Log;
import jakarta.inject.Inject;
import org.acme.entity.Demande;
import org.acme.entity.Guarantee;
import org.acme.entity.Guarantor;
import org.acme.entity.enums.DemandeStatut;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * gRPC service exposing credit history (demandes) for a given client.
 * Used by analyse service to fetch past demandes for credit analysis.
 */
@GrpcService
public class HistoriqueGrpcService extends HistoriqueServiceGrpc.HistoriqueServiceImplBase {

    private static final DateTimeFormatter ISO_FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'");

    @Override
    public void getDemandesForClient(GetDemandesForClientRequest request,
                                      StreamObserver<DemandeSummaryListResponse> observer) {
        try {
            // Parse client_id from string to UUID
            UUID clientId;
            try {
                clientId = UUID.fromString(request.getClientId());
            } catch (IllegalArgumentException e) {
                Log.warn("Invalid UUID format for client_id: " + request.getClientId());
                observer.onNext(DemandeSummaryListResponse.newBuilder()
                    .setSuccess(false)
                    .setErrorMessage("Client ID invalid: expected UUID format")
                    .build());
                observer.onCompleted();
                return;
            }

            // Fetch all demandes for this client
            List<Demande> demandes = Demande.find("client_id", clientId)
                .list();

            // Build response
            DemandeSummaryListResponse.Builder responseBuilder = DemandeSummaryListResponse.newBuilder()
                .setSuccess(true);

            for (Demande d : demandes) {
                DemandeSummary.Builder summaryBuilder = DemandeSummary.newBuilder()
                    .setDemandeId(d.id)
                    .setStatus(d.status != null ? d.status.toString() : "UNKNOWN")
                    .setRequestedAmount(d.requestedAmount != null ? d.requestedAmount.toPlainString() : "0.00")
                    .setDurationMonths(d.durationMonths != null ? d.durationMonths : 0)
                    .setProductName(d.productName != null ? d.productName : "—")
                    .setLoanPurpose(d.loanPurpose != null ? d.loanPurpose : "—")
                    .setManagerName(d.managerName != null ? d.managerName : "—")
                    .setApplicationChannel(d.applicationChannel != null ? d.applicationChannel : "—")
                    .setBankingRestriction(d.bankingRestriction != null && d.bankingRestriction)
                    .setLegalIssueOrAccountBlocked(d.legalIssueOrAccountBlocked != null && d.legalIssueOrAccountBlocked)
                    .setGuarantorsCount(d.guarantors != null ? d.guarantors.size() : 0)
                    .setGuaranteesCount(d.guarantees != null ? d.guarantees.size() : 0);

                // Format timestamps as ISO strings
                if (d.createdAt != null) {
                    summaryBuilder.setCreatedAt(d.createdAt.format(ISO_FORMATTER));
                }
                if (d.updatedAt != null) {
                    summaryBuilder.setUpdatedAt(d.updatedAt.format(ISO_FORMATTER));
                }

                responseBuilder.addDemandes(summaryBuilder.build());
            }

            observer.onNext(responseBuilder.build());
            observer.onCompleted();

        } catch (Exception e) {
            Log.error("Error fetching demandes for client: " + e.getMessage(), e);
            observer.onNext(DemandeSummaryListResponse.newBuilder()
                .setSuccess(false)
                .setErrorMessage("Internal error: " + e.getMessage())
                .build());
            observer.onCompleted();
        }
    }
}
