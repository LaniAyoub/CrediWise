package org.acme.service;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import org.acme.dto.StepRisqueCommercialResponse;
import org.acme.entity.*;
import org.acme.grpc.GestionnaireDataClient;
import org.acme.grpc.GestionnaireResponse;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Business logic for Step 4 (Risque Commercial) of the analysis dossier.
 */
@ApplicationScoped
public class StepRisqueCommercialService {

    @Inject
    GestionnaireDataClient gestionnaireDataClient;

    @Inject
    JsonWebToken jwt;

    // ─────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────

    /**
     * Preview Step 4 — returns saved draft or empty shell if not yet started.
     */
    public StepRisqueCommercialResponse preview(Long dossierId, UUID callerId) {
        AnalyseDossier dossier = loadAndAuthorize(dossierId, callerId);
        StepRisqueCommercial step = StepRisqueCommercial.findByDossierId(dossierId).orElse(null);
        return buildResponse(step, dossier);
    }

    /**
     * Save draft — persists all fields without marking isComplete.
     */
    @Transactional
    public StepRisqueCommercialResponse save(Long dossierId, StepRisqueCommercialRequest req, UUID callerId) {
        AnalyseDossier dossier = loadAndAuthorize(dossierId, callerId);
        StepRisqueCommercial step = findOrCreate(dossierId, dossier);
        mapAndPersist(step, req, callerId, dossier);
        return buildResponse(step, dossier);
    }

    /**
     * Confirm Step 4 — saves all fields, marks isComplete=true, advances dossier to step 5.
     */
    @Transactional
    public StepRisqueCommercialResponse confirm(Long dossierId, StepRisqueCommercialRequest req, UUID callerId) {
        AnalyseDossier dossier = loadAndAuthorize(dossierId, callerId);
        requireStep3Complete(dossier);
        StepRisqueCommercial step = findOrCreate(dossierId, dossier);
        mapAndPersist(step, req, callerId, dossier);

        String confirmedByName = resolveGestionnaireName(callerId);
        LocalDateTime now = LocalDateTime.now();
        step.isComplete = true;
        step.confirmedBy = callerId;
        step.confirmedByName = confirmedByName;
        step.confirmedAt = now;

        dossier.currentStep = Math.max(dossier.currentStep, 5);
        dossier.updatedAt = now;

        Log.info("Step 4 confirmed for dossier: " + dossierId + " by: " + callerId);
        return buildResponse(step, dossier);
    }

    /**
     * Get saved Step 4 data. Falls back to preview if not yet started.
     */
    public StepRisqueCommercialResponse get(Long dossierId, UUID callerId) {
        AnalyseDossier dossier = loadAndAuthorize(dossierId, callerId);
        StepRisqueCommercial step = StepRisqueCommercial.findByDossierId(dossierId).orElse(null);
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

    private void requireStep3Complete(AnalyseDossier dossier) {
        StepRisqueClient step3 = StepRisqueClient.findByDossierId(dossier.id).orElse(null);
        if (step3 == null || !Boolean.TRUE.equals(step3.isComplete)) {
            throw new WebApplicationException(
                Response.status(422)
                    .entity(Map.of(
                        "erreur", "L'étape 3 (Risque Client) doit être complétée avant l'étape Risque Commercial",
                        "code", "STEP_3_INCOMPLETE"))
                    .build()
            );
        }
    }

    private StepRisqueCommercial findOrCreate(Long dossierId, AnalyseDossier dossier) {
        return StepRisqueCommercial.findByDossierId(dossierId).orElseGet(() -> {
            StepRisqueCommercial s = new StepRisqueCommercial();
            s.dossier = dossier;
            s.isComplete = false;
            s.createdAt = LocalDateTime.now();
            s.persist();
            return s;
        });
    }

    private void mapAndPersist(StepRisqueCommercial step, StepRisqueCommercialRequest req,
                               UUID callerId, AnalyseDossier dossier) {
        step.nbAnneesExperienceEmploye = req.nbAnneesExperienceEmploye;
        step.nbAnneesExperienceManager = req.nbAnneesExperienceManager;
        step.autresActivites = req.autresActivites;
        step.venteACredit = req.venteACredit;
        step.descriptionActiviteAnalyse = req.descriptionActiviteAnalyse;
        
        step.listeExclusionAdvans = req.listeExclusionAdvans;
        step.regleAlcoolTabac = req.regleAlcoolTabac;
        step.regleMedicamentsNonReglementes = req.regleMedicamentsNonReglementes;
        step.travailForceOuEnfants = req.travailForceOuEnfants;
        step.risqueSanteSecuriteEmployes = req.risqueSanteSecuriteEmployes;
        step.impactNegatifEnvironnement = req.impactNegatifEnvironnement;
        step.activiteVulnerableClimat = req.activiteVulnerableClimat;
        step.activiteZoneExposeeClimat = req.activiteZoneExposeeClimat;
        step.exigencesLegalesSpecifiques = req.exigencesLegalesSpecifiques;
        step.clientConformite = req.clientConformite;

        if (req.pointsDeVente != null) {
            replacePointsDeVente(step, req.pointsDeVente);
        }

        LocalDateTime now = LocalDateTime.now();
        step.lastEditedBy = callerId;
        step.lastEditedByName = resolveGestionnaireName(callerId);
        step.lastEditedAt = now;
        step.updatedAt = now;
        dossier.updatedAt = now;
    }

    /**
     * Cascade replace: clear → flush → insert.
     * Flush ensures orphan DELETEs execute before new INSERTs,
     * preventing constraint violations on re-save.
     */
    private void replacePointsDeVente(StepRisqueCommercial step,
                                      List<StepRisqueCommercialRequest.PointDeVenteItem> items) {
        step.pointsDeVente.clear();
        io.quarkus.hibernate.orm.panache.Panache.getEntityManager().flush();
        for (int i = 0; i < items.size(); i++) {
            var item = items.get(i);
            var entity = new PointDeVente();
            entity.stepRisqueCommercial = step;
            entity.type = item.type;
            entity.propriete = item.propriete;
            entity.joursOuverture = item.joursOuverture;
            entity.horaireOuverture = item.horaireOuverture;
            entity.surface = item.surface != null ? new BigDecimal(item.surface.toString()) : null;
            entity.emplacement = item.emplacement;
            entity.ordre = i;
            step.pointsDeVente.add(entity);
        }
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

    private String computeStepStatus(StepRisqueCommercial step) {
        if (step == null) return "EMPTY";
        if (!Boolean.TRUE.equals(step.isComplete)) return "DRAFT";
        if (step.lastEditedAt != null && step.confirmedAt != null
                && step.lastEditedAt.isAfter(step.confirmedAt)) {
            return "MODIFIED_AFTER_CONFIRM";
        }
        return "CONFIRMED";
    }

    private StepRisqueCommercialResponse buildResponse(StepRisqueCommercial step, AnalyseDossier dossier) {
        String ifcLevelOfRisk = null;
        StepClient stepClient = StepClient.findByDossierId(dossier.id).orElse(null);
        if (stepClient != null) {
            ifcLevelOfRisk = stepClient.ifcLevelOfRisk;
        }

        if (step == null) {
            return new StepRisqueCommercialResponse(
                dossier.id, dossier.demandeId, dossier.status.toString(),
                null, null, null, null,
                new ArrayList<>(),
                null,
                ifcLevelOfRisk, null, null, null, null, null, null, null, null, null, null,
                false, "EMPTY",
                null, null, null,
                null, null, null, null
            );
        }

        List<StepRisqueCommercialResponse.PointDeVenteItem> pdvItems = step.pointsDeVente.stream()
            .map(p -> new StepRisqueCommercialResponse.PointDeVenteItem(
                p.id, p.type, p.propriete, p.joursOuverture, p.horaireOuverture,
                p.surface, p.emplacement, p.ordre))
            .collect(Collectors.toList());

        return new StepRisqueCommercialResponse(
            dossier.id, dossier.demandeId, dossier.status.toString(),
            step.nbAnneesExperienceEmploye,
            step.nbAnneesExperienceManager,
            step.autresActivites,
            step.venteACredit,
            pdvItems,
            step.descriptionActiviteAnalyse,
            ifcLevelOfRisk,
            step.listeExclusionAdvans,
            step.regleAlcoolTabac,
            step.regleMedicamentsNonReglementes,
            step.travailForceOuEnfants,
            step.risqueSanteSecuriteEmployes,
            step.impactNegatifEnvironnement,
            step.activiteVulnerableClimat,
            step.activiteZoneExposeeClimat,
            step.exigencesLegalesSpecifiques,
            step.clientConformite,
            step.isComplete, computeStepStatus(step),
            step.confirmedBy, step.confirmedByName, step.confirmedAt,
            step.lastEditedBy, step.lastEditedByName, step.lastEditedAt, step.createdAt
        );
    }

    // ─────────────────────────────────────────────────────────────
    // INNER REQUEST DTO
    // ─────────────────────────────────────────────────────────────

    public static class StepRisqueCommercialRequest {

        public Integer nbAnneesExperienceEmploye;
        public Integer nbAnneesExperienceManager;
        public Boolean autresActivites;
        public Boolean venteACredit;
        public List<PointDeVenteItem> pointsDeVente = new ArrayList<>();
        public String descriptionActiviteAnalyse;
        
        public Boolean listeExclusionAdvans;
        public String regleAlcoolTabac;
        public String regleMedicamentsNonReglementes;
        public Boolean travailForceOuEnfants;
        public Boolean risqueSanteSecuriteEmployes;
        public Boolean impactNegatifEnvironnement;
        public Boolean activiteVulnerableClimat;
        public Boolean activiteZoneExposeeClimat;
        public String exigencesLegalesSpecifiques;
        public Boolean clientConformite;

        public static class PointDeVenteItem {
            public String type;
            public String propriete;
            public String joursOuverture;
            public String horaireOuverture;
            public Double surface;
            public String emplacement;
        }
    }
}
