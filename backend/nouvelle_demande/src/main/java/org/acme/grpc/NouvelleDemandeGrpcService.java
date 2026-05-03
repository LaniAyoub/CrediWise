package org.acme.grpc;

import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import io.quarkus.grpc.GrpcService;
import io.quarkus.logging.Log;
import jakarta.transaction.Transactional;
import org.acme.entity.Demande;

import java.time.format.DateTimeFormatter;

/**
 * gRPC service exposing Demande details by ID.
 * Used by analyse service to fetch Section A snapshot for Step 2 (Objet du Crédit).
 */
@GrpcService
public class NouvelleDemandeGrpcService extends NouvelleDemandeServiceGrpc.NouvelleDemandeServiceImplBase {

    private static final DateTimeFormatter ISO_FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'");

    @Override
    @Transactional
    public void getDemandeById(GetDemandeByIdRequest request,
                               StreamObserver<DemandeDetailResponse> observer) {
        try {
            Long demandeId = request.getDemandeId();
            Log.info("Fetching demande: " + demandeId);

            // Fetch demande by ID
            Demande demande = Demande.findById(demandeId);

            if (demande == null) {
                Log.warn("Demande not found: " + demandeId);
                observer.onNext(DemandeDetailResponse.newBuilder()
                    .setSuccess(false)
                    .setErrorMessage("Demande not found: " + demandeId)
                    .build());
                observer.onCompleted();
                return;
            }

            // Build response with Section A fields
            DemandeDetail.Builder detailBuilder = DemandeDetail.newBuilder()
                .setId(demande.id)
                .setClientId(demande.clientId.toString())
                .setLoanPurpose(demande.loanPurpose != null ? demande.loanPurpose : "")
                .setRequestedAmount(demande.requestedAmount != null ? demande.requestedAmount.toPlainString() : "0.00")
                .setDurationMonths(demande.durationMonths != null ? demande.durationMonths : 0)
                .setProductId(demande.productId != null ? demande.productId : "")
                .setProductName(demande.productName != null ? demande.productName : "")
                .setAssetType(demande.assetType != null ? demande.assetType : "")
                .setMonthlyRepaymentCapacity(demande.monthlyRepaymentCapacity != null ? demande.monthlyRepaymentCapacity.toPlainString() : "0.00")
                .setStatus(demande.status != null ? demande.status.toString() : "UNKNOWN");

            // Format timestamp
            if (demande.createdAt != null) {
                detailBuilder.setCreatedAt(demande.createdAt.format(ISO_FORMATTER));
            }

            observer.onNext(DemandeDetailResponse.newBuilder()
                .setSuccess(true)
                .setData(detailBuilder.build())
                .build());
            observer.onCompleted();

        } catch (Exception e) {
            Log.error("Error fetching demande: " + e.getMessage(), e);
            observer.onNext(DemandeDetailResponse.newBuilder()
                .setSuccess(false)
                .setErrorMessage("Internal error: " + e.getMessage())
                .build());
            observer.onCompleted();
        }
    }
}
