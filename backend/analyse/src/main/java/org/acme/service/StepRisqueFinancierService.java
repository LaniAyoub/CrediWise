package org.acme.service;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import org.acme.dto.StepRisqueFinancierResponse;
import org.acme.entity.*;
import org.acme.grpc.GestionnaireDataClient;
import org.acme.grpc.GestionnaireResponse;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Business logic for Step 5 (Risque Financier) of the analysis dossier.
 * Empty placeholder step with 7 sub-sections (tabs).
 */
@ApplicationScoped
public class StepRisqueFinancierService {

    @Inject
    GestionnaireDataClient gestionnaireDataClient;

    @Inject
    JsonWebToken jwt;

    // ─────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────

    /**
     * Preview Step 5 — returns saved draft or empty shell if not yet started.
     */
    public StepRisqueFinancierResponse preview(Long dossierId, UUID callerId) {
        AnalyseDossier dossier = loadAndAuthorize(dossierId, callerId);
        StepRisqueFinancier step = StepRisqueFinancier.findByDossierId(dossierId).orElse(null);
        return buildResponse(step, dossier);
    }

    /**
     * Save draft — persists all fields without marking isComplete.
     */
    @Transactional
    public StepRisqueFinancierResponse save(Long dossierId, StepRisqueFinancierRequest req, UUID callerId) {
        AnalyseDossier dossier = loadAndAuthorize(dossierId, callerId);
        StepRisqueFinancier step = findOrCreate(dossierId, dossier);
        mapAndPersist(step, req, callerId, dossier);
        return buildResponse(step, dossier);
    }

    /**
     * Confirm Step 5 — saves all fields, marks isComplete=true, advances dossier to step 6.
     */
    @Transactional
    public StepRisqueFinancierResponse confirm(Long dossierId, StepRisqueFinancierRequest req, UUID callerId) {
        AnalyseDossier dossier = loadAndAuthorize(dossierId, callerId);
        requireStep4Complete(dossier);
        StepRisqueFinancier step = findOrCreate(dossierId, dossier);
        mapAndPersist(step, req, callerId, dossier);

        String confirmedByName = resolveGestionnaireName(callerId);
        LocalDateTime now = LocalDateTime.now();
        step.isComplete = true;
        step.confirmedBy = callerId;
        step.confirmedByName = confirmedByName;
        step.confirmedAt = now;

        dossier.currentStep = Math.max(dossier.currentStep, 6);
        dossier.updatedAt = now;

        Log.info("Step 5 confirmed for dossier: " + dossierId + " by: " + callerId);
        return buildResponse(step, dossier);
    }

    /**
     * Get saved Step 5 data. Falls back to preview if not yet started.
     */
    public StepRisqueFinancierResponse get(Long dossierId, UUID callerId) {
        AnalyseDossier dossier = loadAndAuthorize(dossierId, callerId);
        StepRisqueFinancier step = StepRisqueFinancier.findByDossierId(dossierId).orElse(null);
        if (step == null) {
            return preview(dossierId, callerId);
        }
        return buildResponse(step, dossier);
    }

    // ─────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────

    private AnalyseDossier loadAndAuthorize(Long dossierId, UUID callerId) {
        AnalyseDossier dossier = AnalyseDossier.findById(dossierId);
        if (dossier == null) {
            throw new IllegalArgumentException("Dossier introuvable: " + dossierId);
        }
        boolean isSuperAdmin = jwt.getGroups() != null && jwt.getGroups().contains("SUPER_ADMIN");
        if (!isSuperAdmin && !dossier.gestionnaireId.equals(callerId)) {
            throw new SecurityException("Accès refusé: ce dossier ne vous appartient pas");
        }
        return dossier;
    }

    private void requireStep4Complete(AnalyseDossier dossier) {
        StepRisqueCommercial step4 = StepRisqueCommercial.findByDossierId(dossier.id).orElse(null);
        if (step4 == null || !Boolean.TRUE.equals(step4.isComplete)) {
            throw new WebApplicationException(
                Response.status(422)
                    .entity(Map.of(
                        "erreur", "L'étape 4 (Risque Commercial) doit être complétée avant l'étape Risque Financier",
                        "code", "STEP_4_INCOMPLETE"))
                    .build()
            );
        }
    }

    private StepRisqueFinancier findOrCreate(Long dossierId, AnalyseDossier dossier) {
        return StepRisqueFinancier.findByDossierId(dossierId).orElseGet(() -> {
            StepRisqueFinancier s = new StepRisqueFinancier();
            s.dossier = dossier;
            s.isComplete = false;
            s.createdAt = LocalDateTime.now();
            s.persist();
            return s;
        });
    }

    private void mapAndPersist(StepRisqueFinancier step, StepRisqueFinancierRequest req,
                               UUID callerId, AnalyseDossier dossier) {
        step.notes = req.notes;

        LocalDateTime now = LocalDateTime.now();
        step.lastEditedBy = callerId;
        step.lastEditedByName = resolveGestionnaireName(callerId);
        step.lastEditedAt = now;
        step.updatedAt = now;
        dossier.updatedAt = now;
    }

    private String resolveGestionnaireName(UUID gestionnaireId) {
        try {
            Optional<GestionnaireResponse> g = gestionnaireDataClient.fetchGestionnaire(gestionnaireId);
            return g.map(r -> r.getFirstName() + " " + r.getLastName()).orElse(null);
        } catch (Exception e) {
            Log.warn("Failed to resolve gestionnaire name for " + gestionnaireId + ": " + e.getMessage());
            return null;
        }
    }

    private String computeStepStatus(StepRisqueFinancier step) {
        if (step == null) return "EMPTY";
        if (!Boolean.TRUE.equals(step.isComplete)) return "DRAFT";
        if (step.lastEditedAt != null && step.confirmedAt != null
                && step.lastEditedAt.isAfter(step.confirmedAt)) {
            return "MODIFIED_AFTER_CONFIRM";
        }
        return "CONFIRMED";
    }

    private StepRisqueFinancierResponse buildResponse(StepRisqueFinancier step, AnalyseDossier dossier) {
        if (step == null) {
            return new StepRisqueFinancierResponse(
                dossier.id, dossier.demandeId, dossier.status.toString(),
                null,
                false, "EMPTY",
                null, null, null,
                null, null, null, null
            );
        }

        return new StepRisqueFinancierResponse(
            dossier.id, dossier.demandeId, dossier.status.toString(),
            step.notes,
            step.isComplete, computeStepStatus(step),
            step.confirmedBy, step.confirmedByName, step.confirmedAt,
            step.lastEditedBy, step.lastEditedByName, step.lastEditedAt, step.createdAt
        );
    }

    // ─────────────────────────────────────────────────────────────
    // INNER REQUEST DTO
    // ─────────────────────────────────────────────────────────────

    public static class StepRisqueFinancierRequest {
        public String notes;
    }
}
