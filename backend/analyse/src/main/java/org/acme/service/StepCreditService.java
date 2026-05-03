package org.acme.service;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.acme.dto.StepCreditResponse;
import org.acme.entity.AnalyseDossier;
import org.acme.entity.StepObjetCredit;
import org.acme.entity.StepDépenseProjet;
import org.acme.entity.StepFinancementAutre;
import org.acme.entity.enums.DossierStatus;
import org.acme.exception.ServiceUnavailableException;
import org.acme.grpc.GestionnaireResponse;
import org.acme.grpc.NouvelleDemandeDataClient;
import org.acme.grpc.GestionnaireDataClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Business logic for Step 2 (Credit Object) of the analysis dossier.
 */
@ApplicationScoped
public class StepCreditService {

    @Inject
    NouvelleDemandeDataClient nouvelleDemandeDataClient;

    @Inject
    GestionnaireDataClient gestionnaireDataClient;

    /**
     * Preview live Section A data before confirmation.
     * Fetches fresh data from nouvelle_demande service but does not save.
     *
     * @param dossierId ID of the dossier
     * @param callerGestionnaireId UUID of the caller
     * @return StepCreditResponse with live Section A data
     * @throws IllegalArgumentException if dossier not found
     * @throws ServiceUnavailableException if nouvelle_demande service is down
     */
    @Transactional
    public StepCreditResponse preview(Long dossierId, UUID callerGestionnaireId) {
        // Load dossier
        AnalyseDossier dossier = AnalyseDossier.findById(dossierId);
        if (dossier == null) {
            throw new IllegalArgumentException("Dossier introuvable: " + dossierId);
        }

        // Fetch demande data for Section A
        org.acme.grpc.DemandeDetail demandeData = nouvelleDemandeDataClient.fetchDemandeById(dossier.demandeId);

        // Return preview response with empty B and C sections
        return buildResponse(
            demandeData,
            new ArrayList<>(),
            new ArrayList<>(),
            false,
            null,
            null,
            null,
            null,
            dossier,
            null
        );
    }

    /**
     * Save Step 2 draft — persists data without marking complete or advancing step.
     * Safe to call multiple times (cascade replace on lists).
     */
    @Transactional
    public StepCreditResponse save(Long dossierId, StepCreditRequest demandeData, UUID callerGestionnaireId) {
        AnalyseDossier dossier = AnalyseDossier.findById(dossierId);
        if (dossier == null) {
            throw new IllegalArgumentException("Dossier introuvable: " + dossierId);
        }

        org.acme.grpc.DemandeDetail sectionAData = nouvelleDemandeDataClient.fetchDemandeById(dossier.demandeId);

        LocalDateTime now = LocalDateTime.now();

        Optional<StepObjetCredit> existingStep = StepObjetCredit.find("dossier.id", dossierId).firstResultOptional();
        StepObjetCredit stepCredit;
        if (existingStep.isPresent()) {
            stepCredit = existingStep.get();
            stepCredit.depenses.clear();
            stepCredit.financementAutre.clear();
            io.quarkus.hibernate.orm.panache.Panache.getEntityManager().flush();
        } else {
            stepCredit = new StepObjetCredit();
            stepCredit.dossier = dossier;
        }

        mapSectionAToEntity(stepCredit, sectionAData);
        stepCredit.pertinenceProjet = demandeData != null ? demandeData.pertinenceProjet : null;

        if (demandeData != null && demandeData.depenses != null) {
            for (int i = 0; i < demandeData.depenses.size(); i++) {
                var depenseReq = demandeData.depenses.get(i);
                StepDépenseProjet depense = new StepDépenseProjet();
                depense.stepObjetCredit = stepCredit;
                // category no longer provided by frontend; default to AUTRE
                depense.categorie = "AUTRE";
                depense.description = depenseReq.description;
                depense.cout = new BigDecimal(depenseReq.cout);
                depense.ordre = i + 1;
                stepCredit.depenses.add(depense);
            }
        }

        if (demandeData != null && demandeData.financementAutre != null) {
            for (int i = 0; i < demandeData.financementAutre.size(); i++) {
                var financementReq = demandeData.financementAutre.get(i);
                StepFinancementAutre financement = new StepFinancementAutre();
                financement.stepObjetCredit = stepCredit;
                financement.description = financementReq.description;
                financement.montant = new BigDecimal(financementReq.montant);
                financement.ordre = i + 1;
                stepCredit.financementAutre.add(financement);
            }
        }

        stepCredit.recalculateTotals();
        stepCredit.dataFetchedAt = now;
        // Do NOT set isComplete=true, confirmedBy, confirmedAt — draft only
        // Do NOT advance dossier.currentStep

        if (stepCredit.id == null) {
            stepCredit.persist();
        }

        Log.info("Step 2 draft saved for dossier: " + dossierId);

        return buildResponse(
            sectionAData,
            stepCredit.depenses,
            stepCredit.financementAutre,
            stepCredit.isComplete,
            stepCredit.confirmedBy,
            stepCredit.confirmedByName,
            stepCredit.confirmedAt,
            now,
            dossier,
            stepCredit.pertinenceProjet
        );
    }

    /**
     * Confirm Step 2 and advance to Step 3.
     * Saves Section A snapshot from demande, persists B and C data, updates dossier.
     *
     * @param dossierId ID of the dossier
     * @param demandeData data from frontend (expenses B and other financing C)
     * @param callerGestionnaireId UUID of the caller
     * @return StepCreditResponse with saved data
     * @throws IllegalArgumentException if dossier not found or invalid data
     * @throws ServiceUnavailableException if nouvelle_demande service is down
     */
    @Transactional
    public StepCreditResponse confirm(Long dossierId, StepCreditRequest demandeData, UUID callerGestionnaireId) {
        // Load dossier
        AnalyseDossier dossier = AnalyseDossier.findById(dossierId);
        if (dossier == null) {
            throw new IllegalArgumentException("Dossier introuvable: " + dossierId);
        }

        // Fetch demande data for Section A
        org.acme.grpc.DemandeDetail sectionAData = nouvelleDemandeDataClient.fetchDemandeById(dossier.demandeId);

        // Fetch confirming gestionnaire data (OPTIONAL)
        Optional<GestionnaireResponse> confirmingGestionnaireData = Optional.empty();
        try {
            confirmingGestionnaireData = gestionnaireDataClient.fetchGestionnaire(callerGestionnaireId);
        } catch (Exception e) {
            Log.warn("Failed to fetch confirming gestionnaire data: " + e.getMessage());
        }

        LocalDateTime now = LocalDateTime.now();

        // Create or update StepObjetCredit
        Optional<StepObjetCredit> existingStep = StepObjetCredit.find("dossier.id", dossierId)
            .firstResultOptional();

        StepObjetCredit stepCredit;
        if (existingStep.isPresent()) {
            stepCredit = existingStep.get();
            // Clear children for cascade replace
            stepCredit.depenses.clear();
            stepCredit.financementAutre.clear();
            // Flush deletes immediately before inserts to avoid UK constraint violation
            // on (step_objet_credit_id, ordre) when re-confirming
            io.quarkus.hibernate.orm.panache.Panache.getEntityManager().flush();
        } else {
            stepCredit = new StepObjetCredit();
            stepCredit.dossier = dossier;
        }

        // Map Section A from demande
        mapSectionAToEntity(stepCredit, sectionAData);

        // Map Section D: Project Relevance
        stepCredit.pertinenceProjet = demandeData.pertinenceProjet;

        // Map Section B: Expenses (cascade replace)
        if (demandeData.depenses != null && !demandeData.depenses.isEmpty()) {
            for (int i = 0; i < demandeData.depenses.size(); i++) {
                var depenseReq = demandeData.depenses.get(i);
                StepDépenseProjet depense = new StepDépenseProjet();
                depense.stepObjetCredit = stepCredit;
                // category no longer provided by frontend; default to AUTRE
                depense.categorie = "AUTRE";
                depense.description = depenseReq.description;
                depense.cout = new BigDecimal(depenseReq.cout);
                depense.ordre = i + 1;
                stepCredit.depenses.add(depense);
            }
        }

        // Map Section C: Other Financing (cascade replace)
        if (demandeData.financementAutre != null && !demandeData.financementAutre.isEmpty()) {
            for (int i = 0; i < demandeData.financementAutre.size(); i++) {
                var financementReq = demandeData.financementAutre.get(i);
                StepFinancementAutre financement = new StepFinancementAutre();
                financement.stepObjetCredit = stepCredit;
                financement.description = financementReq.description;
                financement.montant = new BigDecimal(financementReq.montant);
                financement.ordre = i + 1;
                stepCredit.financementAutre.add(financement);
            }
        }

        // Recalculate totals and balance
        stepCredit.recalculateTotals();

        // Mark as complete
        stepCredit.isComplete = true;
        stepCredit.confirmedBy = callerGestionnaireId;
        stepCredit.confirmedByName = buildManagerName(confirmingGestionnaireData);
        stepCredit.confirmedAt = now;
        stepCredit.dataFetchedAt = now;

        if (stepCredit.id == null) {
            stepCredit.persist();
        }

        // Update dossier status
        dossier.currentStep = 3;
        dossier.status = DossierStatus.ANALYSE;
        dossier.updatedAt = now;

        Log.info("Step 2 confirmed for dossier: " + dossierId + ", balance: " + stepCredit.isBalanced);

        return buildResponse(
            sectionAData,
            stepCredit.depenses,
            stepCredit.financementAutre,
            true,
            callerGestionnaireId,
            stepCredit.confirmedByName,
            stepCredit.confirmedAt,
            now,
            dossier,
            stepCredit.pertinenceProjet
        );
    }

    /**
     * Get saved Step 2 data (after confirmation).
     *
     * @param dossierId ID of the dossier
     * @param callerGestionnaireId UUID of the caller
     * @return StepCreditResponse with saved snapshot
     * @throws IllegalArgumentException if dossier not found
     */
    @Transactional
    public StepCreditResponse get(Long dossierId, UUID callerGestionnaireId) {
        // Load dossier
        AnalyseDossier dossier = AnalyseDossier.findById(dossierId);
        if (dossier == null) {
            throw new IllegalArgumentException("Dossier introuvable: " + dossierId);
        }

        // Load saved StepObjetCredit
        Optional<StepObjetCredit> savedStep = StepObjetCredit.find("dossier.id", dossierId)
            .firstResultOptional()
            .map(StepObjetCredit.class::cast);

        if (savedStep.isEmpty()) {
            // Return preview if no snapshot saved yet
            return preview(dossierId, callerGestionnaireId);
        }

        StepObjetCredit stepCredit = savedStep.get();

        // Build response from entity
        return buildResponseFromEntity(stepCredit, dossier);
    }

    // ─────────────────────────────────────────────────────────────
    // Helper methods
    // ─────────────────────────────────────────────────────────────

    private void mapSectionAToEntity(StepObjetCredit entity, org.acme.grpc.DemandeDetail data) {
        entity.loanPurpose = data.getLoanPurpose();
        entity.requestedAmount = new BigDecimal(data.getRequestedAmount());
        entity.durationMonths = data.getDurationMonths();
        entity.productId = data.getProductId();
        entity.productName = data.getProductName();
        entity.monthlyRepaymentCapacity = new BigDecimal(data.getMonthlyRepaymentCapacity());
    }

    private StepCreditResponse buildResponse(
        org.acme.grpc.DemandeDetail sectionAData,
        List<StepDépenseProjet> depenses,
        List<StepFinancementAutre> financementAutre,
        Boolean isComplete,
        UUID confirmedBy,
        String confirmedByName,
        LocalDateTime confirmedAt,
        LocalDateTime dataFetchedAt,
        AnalyseDossier dossier,
        String pertinenceProjet
    ) {
        BigDecimal totalExpenses = depenses.stream()
            .map(d -> d.cout != null ? d.cout : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalOther = financementAutre.stream()
            .map(f -> f.montant != null ? f.montant : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal requestedAmount = new BigDecimal(sectionAData.getRequestedAmount());
        boolean isBalanced = totalExpenses.subtract(requestedAmount.add(totalOther)).abs().compareTo(new BigDecimal("0.01")) <= 0;

        List<StepCreditResponse.DépenseProjetItem> depenseItems = depenses.stream()
            .map(d -> new StepCreditResponse.DépenseProjetItem(
                d.id,
                d.categorie,
                d.description,
                d.cout,
                d.ordre
            ))
            .collect(Collectors.toList());

        List<StepCreditResponse.FinancementAutreItem> financementItems = financementAutre.stream()
            .map(f -> new StepCreditResponse.FinancementAutreItem(
                f.id,
                f.description,
                f.montant,
                f.ordre
            ))
            .collect(Collectors.toList());

        return new StepCreditResponse(
            sectionAData.getLoanPurpose(),
            requestedAmount,
            sectionAData.getDurationMonths(),
            sectionAData.getProductId(),
            sectionAData.getProductName(),
            sectionAData.getAssetType(),
            new BigDecimal(sectionAData.getMonthlyRepaymentCapacity()),
            pertinenceProjet,
            totalExpenses,
            totalOther,
            isBalanced,
            null,
            depenseItems,
            financementItems,
            isComplete,
            confirmedBy,
            confirmedByName,
            confirmedAt,
            dataFetchedAt,
            dossier.id,
            dossier.demandeId,
            dossier.status.toString(),
            dossier.demandeCreatedAt
        );
    }

    private StepCreditResponse buildResponseFromEntity(StepObjetCredit entity, AnalyseDossier dossier) {
        List<StepCreditResponse.DépenseProjetItem> depenseItems = entity.depenses.stream()
            .map(d -> new StepCreditResponse.DépenseProjetItem(
                d.id,
                d.categorie,
                d.description,
                d.cout,
                d.ordre
            ))
            .collect(Collectors.toList());

        List<StepCreditResponse.FinancementAutreItem> financementItems = entity.financementAutre.stream()
            .map(f -> new StepCreditResponse.FinancementAutreItem(
                f.id,
                f.description,
                f.montant,
                f.ordre
            ))
            .collect(Collectors.toList());

        return new StepCreditResponse(
            entity.loanPurpose,
            entity.requestedAmount,
            entity.durationMonths,
            entity.productId,
            entity.productName,
            entity.assetType,
            entity.monthlyRepaymentCapacity,
            entity.pertinenceProjet,
            entity.totalCostExpenses,
            entity.totalOtherFinancing,
            entity.isBalanced,
            entity.balanceMessage,
            depenseItems,
            financementItems,
            entity.isComplete,
            entity.confirmedBy,
            entity.confirmedByName,
            entity.confirmedAt,
            entity.dataFetchedAt,
            dossier.id,
            dossier.demandeId,
            dossier.status.toString(),
            dossier.demandeCreatedAt
        );
    }

    private String buildManagerName(Optional<GestionnaireResponse> managerData) {
        if (managerData.isEmpty()) {
            return null;
        }
        GestionnaireResponse mgr = managerData.get();
        return mgr.getFirstName() + " " + mgr.getLastName();
    }

    /**
     * DTO for incoming Step 2 confirmation request
     */
    public static class StepCreditRequest {
        public List<DepenseItem> depenses;
        public List<FinancementItem> financementAutre;
        public String pertinenceProjet;

        public static class DepenseItem {
            // 'categorie' removed: frontend no longer sends category
            public String description;
            public String cout;
        }

        public static class FinancementItem {
            public String description;
            public String montant;
        }
    }
}
