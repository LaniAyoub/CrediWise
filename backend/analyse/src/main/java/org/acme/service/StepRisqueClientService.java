package org.acme.service;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import org.acme.dto.StepRisqueClientResponse;
import org.acme.entity.*;
import org.acme.entity.enums.NoteCentraleRisque;
import org.acme.entity.enums.SituationFamiliale;
import org.acme.entity.enums.SituationLogement;
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
 * Business logic for Step 3 (Risque Client) of the analysis dossier.
 * Pure analyst input — no gRPC calls for data fetch.
 * gRPC is only used to resolve the gestionnaire display name on confirm.
 */
@ApplicationScoped
public class StepRisqueClientService {

    @Inject
    GestionnaireDataClient gestionnaireDataClient;

    @Inject
    JsonWebToken jwt;

    // ─────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────

    /**
     * Preview Step 3 — returns saved draft or empty shell if not yet started.
     * Does NOT require Step 3 to exist; DOES require Step 2 to be complete.
     */
    public StepRisqueClientResponse preview(Long dossierId, UUID callerId) {
        AnalyseDossier dossier = loadAndAuthorize(dossierId, callerId);
        StepRisqueClient step = StepRisqueClient.findByDossierId(dossierId).orElse(null);
        return buildResponse(step, dossier);
    }

    /**
     * Save draft — persists all fields without marking isComplete.
     * Safe to call multiple times; cascade replaces all 3 dynamic lists.
     */
    @Transactional
    public StepRisqueClientResponse save(Long dossierId, StepRisqueClientRequest req, UUID callerId) {
        AnalyseDossier dossier = loadAndAuthorize(dossierId, callerId);
        StepRisqueClient step = findOrCreate(dossierId, dossier);
        mapAndPersist(step, req, callerId, dossier);
        return buildResponse(step, dossier);
    }

    /**
     * Confirm Step 3 — saves all fields, marks isComplete=true, advances dossier to step 4.
     * Safe to re-confirm (flush pattern prevents UK constraint violation on list replace).
     */
    @Transactional
    public StepRisqueClientResponse confirm(Long dossierId, StepRisqueClientRequest req, UUID callerId) {
        AnalyseDossier dossier = loadAndAuthorize(dossierId, callerId);
        requireStep2Complete(dossier);
        StepRisqueClient step = findOrCreate(dossierId, dossier);
        mapAndPersist(step, req, callerId, dossier);

        // Resolve display name for audit trail
        String confirmedByName = resolveGestionnaireName(callerId);

        LocalDateTime now = LocalDateTime.now();
        step.isComplete = true;
        step.confirmedBy = callerId;
        step.confirmedByName = confirmedByName;
        step.confirmedAt = now;

        // Advance dossier — Math.max prevents downgrade if already further ahead
        dossier.currentStep = Math.max(dossier.currentStep, 4);
        dossier.updatedAt = now;

        Log.info("Step 3 confirmed for dossier: " + dossierId + " by: " + callerId);
        return buildResponse(step, dossier);
    }

    /**
     * Get saved Step 3 data. Falls back to preview if not yet started.
     */
    public StepRisqueClientResponse get(Long dossierId, UUID callerId) {
        AnalyseDossier dossier = loadAndAuthorize(dossierId, callerId);
        StepRisqueClient step = StepRisqueClient.findByDossierId(dossierId).orElse(null);
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
        // SUPER_ADMIN can access any dossier; FRONT_OFFICE must own it
        boolean isSuperAdmin = jwt.getGroups() != null && jwt.getGroups().contains("SUPER_ADMIN");
        if (!isSuperAdmin && !dossier.gestionnaireId.equals(callerId)) {
            throw new SecurityException("Accès refusé: ce dossier ne vous appartient pas");
        }
        return dossier;
    }

    private void requireStep2Complete(AnalyseDossier dossier) {
        StepObjetCredit step2 = StepObjetCredit.findByDossierId(dossier.id).orElse(null);
        if (step2 == null || !Boolean.TRUE.equals(step2.isComplete)) {
            throw new WebApplicationException(
                Response.status(422)
                    .entity(Map.of(
                        "erreur", "L'étape 2 (Objet du Crédit) doit être complétée avant l'étape Risque Client",
                        "code", "STEP_2_INCOMPLETE"))
                    .build()
            );
        }
    }

    private StepRisqueClient findOrCreate(Long dossierId, AnalyseDossier dossier) {
        return StepRisqueClient.findByDossierId(dossierId).orElseGet(() -> {
            StepRisqueClient s = new StepRisqueClient();
            s.dossier = dossier;
            s.isComplete = false;
            s.persist();
            return s;
        });
    }

    private void mapAndPersist(StepRisqueClient step, StepRisqueClientRequest req,
                               UUID callerId, AnalyseDossier dossier) {
        // Section 1.1
        step.situationFamiliale = req.situationFamiliale;
        step.situationFamilialeAutre =
            req.situationFamiliale == SituationFamiliale.AUTRE ? req.situationFamilialeAutre : null;
        step.situationLogement = req.situationLogement;
        step.situationLogementAutre =
            req.situationLogement == SituationLogement.AUTRE ? req.situationLogementAutre : null;
        step.dureeSejour = req.dureeSejour;
        step.ancienneteQuartier = req.ancienneteQuartier;
        step.nombrePersonnesCharge = req.nombrePersonnesCharge;
        step.nombreEnfants = req.nombreEnfants;

        // Section 2.2
        step.avisComite = req.avisComite;

        // Section 3
        step.nombreCreditsAnterieurs = req.nombreCreditsAnterieurs;
        step.noteCentraleRisque = req.noteCentraleRisque;
        step.estGarant = req.estGarant;

        // Section 4.1
        step.analyseCredit = req.analyseCredit;

        // Section 5.1
        step.analyseComptes = req.analyseComptes;

        // Cascade replace all 4 dynamic lists
        if (req.referenceFamiliales != null) {
            replaceReferenceFamiliales(step, req.referenceFamiliales);
        }
        if (req.enquetesMoralite != null) {
            replaceEnquetesMoralite(step, req.enquetesMoralite);
        }
        if (req.pretsCours != null) {
            replacePretsCours(step, req.pretsCours);
        }
        if (req.comptesBancaires != null) {
            replaceComptesBancaires(step, req.comptesBancaires);
        }

        // Audit
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
     * preventing any potential constraint violations on re-save.
     */
    private void replaceReferenceFamiliales(StepRisqueClient step,
                                            List<StepRisqueClientRequest.ReferenceFamilialeItem> items) {
        step.referenceFamiliales.clear();
        io.quarkus.hibernate.orm.panache.Panache.getEntityManager().flush();
        for (int i = 0; i < items.size(); i++) {
            var item = items.get(i);
            var entity = new ReferenceFamiliale();
            entity.stepRisqueClient = step;
            entity.prenom = item.prenom;
            entity.nom = item.nom;
            entity.telephone = item.telephone;
            entity.lienParente = item.lienParente;
            entity.ordre = i;
            step.referenceFamiliales.add(entity);
        }
    }

    private void replaceEnquetesMoralite(StepRisqueClient step,
                                         List<StepRisqueClientRequest.EnqueteMoraliteItem> items) {
        step.enquetesMoralite.clear();
        io.quarkus.hibernate.orm.panache.Panache.getEntityManager().flush();
        for (int i = 0; i < items.size(); i++) {
            var item = items.get(i);
            var entity = new EnqueteMoralite();
            entity.stepRisqueClient = step;
            entity.lienAvecClient = item.lienAvecClient;
            entity.contact = item.contact;
            entity.nomComplet = item.nomComplet;
            entity.idAmplitude = item.idAmplitude;
            entity.amplitude = item.amplitude;
            entity.opinion = item.opinion;
            entity.ordre = i;
            step.enquetesMoralite.add(entity);
        }
    }

    private void replacePretsCours(StepRisqueClient step,
                                   List<StepRisqueClientRequest.PretCoursItem> items) {
        step.pretsCours.clear();
        io.quarkus.hibernate.orm.panache.Panache.getEntityManager().flush();
        for (int i = 0; i < items.size(); i++) {
            var item = items.get(i);
            var entity = new PretCours();
            entity.stepRisqueClient = step;
            entity.nomInstitution = item.nomInstitution;
            entity.objet = item.objet;
            entity.dureeEnMois = item.dureeEnMois != null ? item.dureeEnMois : 1;
            entity.montantInitial = parseBigDecimal(item.montantInitial);
            entity.encoursSolde = parseBigDecimal(item.encoursSolde);
            entity.montantEcheance = parseBigDecimal(item.montantEcheance);
            entity.nombreEcheancesRestantes = item.nombreEcheancesRestantes != null ? item.nombreEcheancesRestantes : 0;
            entity.nombreEcheancesRetard = item.nombreEcheancesRetard != null ? item.nombreEcheancesRetard : 0;
            entity.joursRetardMax = item.joursRetardMax != null ? item.joursRetardMax : 0;
            entity.ordre = i;
            step.pretsCours.add(entity);
        }
    }

    private void replaceComptesBancaires(StepRisqueClient step,
                                          List<StepRisqueClientRequest.CompteBancaireItem> items) {
        step.comptesBancaires.clear();
        io.quarkus.hibernate.orm.panache.Panache.getEntityManager().flush();
        for (int i = 0; i < items.size(); i++) {
            var item = items.get(i);
            var entity = new CompteBancaire();
            entity.stepRisqueClient = step;
            entity.banqueImf = item.banqueImf;
            entity.typeCompte = item.typeCompte;
            entity.solde = parseBigDecimal(item.solde);
            entity.ordre = i;
            step.comptesBancaires.add(entity);
        }
    }

    private BigDecimal parseBigDecimal(String value) {
        if (value == null || value.isBlank()) return BigDecimal.ZERO;
        try {
            return new BigDecimal(value);
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
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

    private String computeStepStatus(StepRisqueClient step) {
        if (step == null) return "EMPTY";
        if (!Boolean.TRUE.equals(step.isComplete)) return "DRAFT";
        if (step.lastEditedAt != null && step.confirmedAt != null
                && step.lastEditedAt.isAfter(step.confirmedAt)) {
            return "MODIFIED_AFTER_CONFIRM";
        }
        return "CONFIRMED";
    }

    private StepRisqueClientResponse buildResponse(StepRisqueClient step, AnalyseDossier dossier) {
        String stepStatus = computeStepStatus(step);

        if (step == null) {
            return new StepRisqueClientResponse(
                dossier.id, dossier.demandeId, dossier.status.toString(),
                null, null, null, null, null, null, null, null,
                new ArrayList<>(), new ArrayList<>(),
                null, null, null, null,
                new ArrayList<>(),
                null,
                new ArrayList<>(),
                null,
                false, stepStatus,
                null, null, null,
                null, null, null,
                null
            );
        }

        List<StepRisqueClientResponse.ReferenceFamilialeItem> refItems = step.referenceFamiliales.stream()
            .map(r -> new StepRisqueClientResponse.ReferenceFamilialeItem(
                r.id, r.prenom, r.nom, r.telephone, r.lienParente, r.ordre))
            .collect(Collectors.toList());

        List<StepRisqueClientResponse.EnqueteMoraliteItem> enqueteItems = step.enquetesMoralite.stream()
            .map(e -> new StepRisqueClientResponse.EnqueteMoraliteItem(
                e.id, e.lienAvecClient, e.contact, e.nomComplet, e.idAmplitude, e.amplitude, e.opinion, e.ordre))
            .collect(Collectors.toList());

        List<StepRisqueClientResponse.PretCoursItem> pretItems = step.pretsCours.stream()
            .map(p -> new StepRisqueClientResponse.PretCoursItem(
                p.id, p.nomInstitution, p.objet, p.dureeEnMois,
                p.montantInitial, p.encoursSolde, p.montantEcheance,
                p.nombreEcheancesRestantes, p.nombreEcheancesRetard, p.joursRetardMax, p.ordre))
            .collect(Collectors.toList());

        List<StepRisqueClientResponse.CompteBancaireItem> compteItems = step.comptesBancaires.stream()
            .map(c -> new StepRisqueClientResponse.CompteBancaireItem(
                c.id, c.banqueImf, c.typeCompte, c.solde, c.ordre))
            .collect(Collectors.toList());

        return new StepRisqueClientResponse(
            dossier.id, dossier.demandeId, dossier.status.toString(),
            step.situationFamiliale != null ? step.situationFamiliale.name() : null,
            step.situationFamilialeAutre,
            step.situationLogement != null ? step.situationLogement.name() : null,
            step.situationLogementAutre,
            step.dureeSejour, step.ancienneteQuartier,
            step.nombrePersonnesCharge, step.nombreEnfants,
            refItems, enqueteItems,
            step.avisComite,
            step.nombreCreditsAnterieurs,
            step.noteCentraleRisque != null ? step.noteCentraleRisque.name() : null,
            step.estGarant,
            pretItems,
            step.analyseCredit,
            compteItems,
            step.analyseComptes,
            step.isComplete, stepStatus,
            step.confirmedBy, step.confirmedByName, step.confirmedAt,
            step.lastEditedBy, step.lastEditedByName, step.lastEditedAt,
            step.createdAt
        );
    }

    // ─────────────────────────────────────────────────────────────
    // INNER REQUEST DTO
    // ─────────────────────────────────────────────────────────────

    public static class StepRisqueClientRequest {

        // Section 1.1
        public SituationFamiliale situationFamiliale;
        public String situationFamilialeAutre;
        public SituationLogement situationLogement;
        public String situationLogementAutre;
        public Integer dureeSejour;
        public Integer ancienneteQuartier;
        public Integer nombrePersonnesCharge;
        public Integer nombreEnfants;

        // Section 1.2
        public List<ReferenceFamilialeItem> referenceFamiliales = new ArrayList<>();

        // Section 2.1
        public List<EnqueteMoraliteItem> enquetesMoralite = new ArrayList<>();

        // Section 2.2
        public String avisComite;

        // Section 3
        public Integer nombreCreditsAnterieurs;
        public NoteCentraleRisque noteCentraleRisque;
        public Boolean estGarant;

        // Section 4
        public List<PretCoursItem> pretsCours = new ArrayList<>();

        // Section 4.1
        public String analyseCredit;

        // Section 5
        public List<CompteBancaireItem> comptesBancaires = new ArrayList<>();

        // Section 5.1
        public String analyseComptes;

        public static class ReferenceFamilialeItem {
            public String prenom;
            public String nom;
            public String telephone;
            public String lienParente;
        }

        public static class EnqueteMoraliteItem {
            public String lienAvecClient;
            public String contact;
            public String nomComplet;
            public String idAmplitude;  // nullable
            public String amplitude;   // nullable
            public String opinion;
        }

        public static class PretCoursItem {
            public String nomInstitution;
            public String objet;
            public Integer dureeEnMois;
            public String montantInitial;    // String → BigDecimal in service
            public String encoursSolde;      // String → BigDecimal in service
            public String montantEcheance;   // String → BigDecimal in service
            public Integer nombreEcheancesRestantes;
            public Integer nombreEcheancesRetard;
            public Integer joursRetardMax;
        }

        public static class CompteBancaireItem {
            public String banqueImf;
            public String typeCompte;
            public String solde;             // String → BigDecimal in service
        }
    }
}
