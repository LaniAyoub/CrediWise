package org.acme.resource;

import io.quarkus.logging.Log;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.dto.StepClientResponse;
import org.acme.dto.StepCreditResponse;
import org.acme.dto.StepRisqueClientResponse;
import org.acme.dto.StepRisqueCommercialResponse;
import org.acme.dto.StepRisqueFinancierResponse;
import org.acme.entity.AnalyseDossier;
import org.acme.entity.enums.DossierStatus;
import org.acme.exception.ServiceUnavailableException;
import org.acme.service.StepClientService;
import org.acme.service.StepCreditService;
import org.acme.service.StepRisqueClientService;
import org.acme.service.StepRisqueCommercialService;
import org.acme.service.StepRisqueFinancierService;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.*;

/**
 * REST endpoints for managing analysis dossiers and Step 1 (Client) data.
 */
@Path("/analyses")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
public class AnalyseDossierResource {

    @Inject
    JsonWebToken jwt;

    @Inject
    StepClientService stepClientService;

    @Inject
    StepCreditService stepCreditService;

    @Inject
    StepRisqueClientService stepRisqueClientService;

    @Inject
    StepRisqueCommercialService stepRisqueCommercialService;

    @Inject
    StepRisqueFinancierService stepRisqueFinancierService;

    // ─────────────────────────────────────────────────────────────
    // Dossier CRUD
    // ─────────────────────────────────────────────────────────────

    /**
     * Create a new analysis dossier for a demande.
     * POST /analyses/dossiers?demandeId={demandeId}&clientId={clientId}&demandeStatus={status}&demandeCreatedAt={ISO8601DateTime}
     */
    @POST
    @Path("/dossiers")
    @RolesAllowed({"FRONT_OFFICE", "SUPER_ADMIN", "CRO", "BRANCH_DM"})
    @Transactional
    public Response createDossier(
        @QueryParam("demandeId") Long demandeId,
        @QueryParam("clientId") String clientId,
        @QueryParam("demandeStatus") String demandeStatus,
        @QueryParam("demandeCreatedAt") String demandeCreatedAtStr
    ) {
        if (demandeId == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("erreur", "demandeId is required");
            return Response.status(400).entity(error).build();
        }

        if (clientId == null || clientId.isBlank()) {
            Map<String, Object> error = new HashMap<>();
            error.put("erreur", "clientId is required");
            return Response.status(400).entity(error).build();
        }

        // Check if dossier already exists for this demande
        if (AnalyseDossier.findByDemandeId(demandeId).isPresent()) {
            Map<String, Object> error = new HashMap<>();
            error.put("erreur", "Un dossier existe déjà pour cette demande");
            return Response.status(409).entity(error).build();
        }

        UUID gestionnaireId = UUID.fromString(jwt.getSubject());
        UUID clientUUID;
        try {
            clientUUID = UUID.fromString(clientId);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("erreur", "clientId must be a valid UUID");
            return Response.status(400).entity(error).build();
        }

        AnalyseDossier dossier = new AnalyseDossier();
        dossier.demandeId = demandeId;
        dossier.clientId = clientUUID;
        dossier.gestionnaireId = gestionnaireId;

        // Set status from demande (default to DRAFT if not provided)
        if (demandeStatus != null && !demandeStatus.isBlank()) {
            try {
                dossier.status = DossierStatus.valueOf(demandeStatus);
            } catch (IllegalArgumentException e) {
                Log.warn("Invalid demandeStatus: " + demandeStatus + ", defaulting to DRAFT");
                dossier.status = DossierStatus.DRAFT;
            }
        } else {
            dossier.status = DossierStatus.DRAFT;
        }

        dossier.currentStep = 1;

        // Parse demande creation date if provided
        if (demandeCreatedAtStr != null && !demandeCreatedAtStr.isBlank()) {
            try {
                dossier.demandeCreatedAt = java.time.LocalDateTime.parse(demandeCreatedAtStr);
            } catch (Exception e) {
                Log.warn("Failed to parse demandeCreatedAt: " + demandeCreatedAtStr);
            }
        }

        dossier.persist();

        Log.info("Dossier créé: " + dossier.id + " pour demande " + demandeId + " client " + clientId + " status " + dossier.status);

        return Response.status(201)
            .entity(dossier)
            .build();
    }

    /**
     * Get dossier by ID.
     * GET /analyses/dossiers/{dossierId}
     */
    @GET
    @Path("/dossiers/{dossierId}")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY", "TECH_USER"})
    public Response getDossier(@PathParam("dossierId") Long dossierId) {
        AnalyseDossier dossier = AnalyseDossier.findById(dossierId);
        if (dossier == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("erreur", "Dossier introuvable");
            return Response.status(404).entity(error).build();
        }

        return Response.ok(dossier).build();
    }

    /**
     * List dossiers (filtered by role).
     * GET /analyses/dossiers
     */
    @GET
    @Path("/dossiers")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY", "TECH_USER"})
    public Response listDossiers() {
        UUID gestionnaireId = UUID.fromString(jwt.getSubject());
        // Analysts and decision-makers see all dossiers; front-office sees only their own
        boolean canSeeAll = jwt.getGroups().stream().anyMatch(g ->
            g.equals("SUPER_ADMIN") || g.equals("CRO") || g.equals("BRANCH_DM")
            || g.equals("HEAD_OFFICE_DM") || g.equals("RISK_ANALYST"));

        List<AnalyseDossier> dossiers;
        if (canSeeAll) {
            dossiers = AnalyseDossier.listAll();
        } else {
            dossiers = AnalyseDossier.findByGestionnaireId(gestionnaireId);
        }

        return Response.ok(dossiers).build();
    }

    /**
     * Record which rule was applied when this dossier was opened for analysis.
     * PATCH /analyses/dossiers/{dossierId}/applied-rule
     * Body: { "ruleId": 3, "ruleVersion": 2 }
     *
     * Idempotent: only writes if not already set (first time) or if rule changed.
     */
    @PATCH
    @Path("/dossiers/{dossierId}/applied-rule")
    @Transactional
    @RolesAllowed({"FRONT_OFFICE", "SUPER_ADMIN", "CRO", "BRANCH_DM"})
    public Response setAppliedRule(
        @PathParam("dossierId") Long dossierId,
        AppliedRuleRequest req
    ) {
        AnalyseDossier dossier = AnalyseDossier.findById(dossierId);
        if (dossier == null) {
            return Response.status(404).entity(Map.of("erreur", "Dossier introuvable")).build();
        }
        if (req == null || req.ruleId == null) {
            return Response.status(400).entity(Map.of("erreur", "ruleId is required")).build();
        }
        // Only update if it has changed (avoids pointless writes on every page load)
        if (!req.ruleId.equals(dossier.appliedRuleId)) {
            dossier.appliedRuleId      = req.ruleId;
            dossier.appliedRuleVersion = req.ruleVersion;
        }
        return Response.ok(dossier).build();
    }

    /** Inline DTO for the applied-rule PATCH body. */
    public static class AppliedRuleRequest {
        public Long    ruleId;
        public Integer ruleVersion;
    }

    // ─────────────────────────────────────────────────────────────
    // Step 1 (Client) endpoints
    // ─────────────────────────────────────────────────────────────

    /**
     * Preview live client data before confirmation.
     * GET /analyses/dossiers/{dossierId}/steps/1/preview
     */
    @GET
    @Path("/dossiers/{dossierId}/steps/1/preview")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY", "TECH_USER"})
    public Response previewStep1(@PathParam("dossierId") Long dossierId) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepClientResponse response = stepClientService.preview(dossierId, gestionnaireId);
            return Response.ok(response).build();

        } catch (IllegalArgumentException e) {
            return errorResponse(404, e.getMessage(), "DOSSIER_NOT_FOUND");
        } catch (SecurityException e) {
            return errorResponse(403, "Accès refusé", "FORBIDDEN");
        } catch (ServiceUnavailableException e) {
            return errorResponse(503, e.getMessage(), "SERVICE_INDISPONIBLE");
        }
    }

    /**
     * Save Step 1 draft — persists snapshot without marking complete.
     * POST /analyses/dossiers/{dossierId}/steps/1/sauvegarder
     */
    @POST
    @Path("/dossiers/{dossierId}/steps/1/sauvegarder")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM"})
    public Response saveStep1(
        @PathParam("dossierId") Long dossierId,
        StepClientService.StepClientRequest request
    ) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepClientResponse response = stepClientService.save(dossierId, gestionnaireId, request);
            return Response.ok(response).build();
        } catch (IllegalArgumentException e) {
            return errorResponse(404, e.getMessage(), "DOSSIER_NOT_FOUND");
        } catch (SecurityException e) {
            return errorResponse(403, "Accès refusé", "FORBIDDEN");
        } catch (ServiceUnavailableException e) {
            return errorResponse(503, e.getMessage(), "SERVICE_INDISPONIBLE");
        }
    }

    /**
     * Confirm Step 1 and advance to Step 2.
     * POST /analyses/dossiers/{dossierId}/steps/1/confirmer
     * Body: { "location": "optional string" }
     */
    @POST
    @Path("/dossiers/{dossierId}/steps/1/confirmer")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM"})
    public Response confirmStep1(
        @PathParam("dossierId") Long dossierId,
        StepClientService.StepClientRequest request
    ) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepClientResponse response = stepClientService.confirm(dossierId, gestionnaireId, request);
            return Response.ok(response).build();

        } catch (IllegalArgumentException e) {
            return errorResponse(404, e.getMessage(), "DOSSIER_NOT_FOUND");
        } catch (SecurityException e) {
            return errorResponse(403, "Accès refusé", "FORBIDDEN");
        } catch (ServiceUnavailableException e) {
            return errorResponse(503, e.getMessage(), "SERVICE_INDISPONIBLE");
        }
    }

    /**
     * Get saved Step 1 data.
     * GET /analyses/dossiers/{dossierId}/steps/1
     */
    @GET
    @Path("/dossiers/{dossierId}/steps/1")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY", "TECH_USER"})
    public Response getStep1(@PathParam("dossierId") Long dossierId) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepClientResponse response = stepClientService.get(dossierId, gestionnaireId);
            return Response.ok(response).build();

        } catch (IllegalArgumentException e) {
            return errorResponse(404, e.getMessage(), "DOSSIER_NOT_FOUND");
        } catch (SecurityException e) {
            return errorResponse(403, "Accès refusé", "FORBIDDEN");
        } catch (ServiceUnavailableException e) {
            return errorResponse(503, e.getMessage(), "SERVICE_INDISPONIBLE");
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Step 2 (Credit Object) endpoints
    // ─────────────────────────────────────────────────────────────

    /**
     * Preview live Section A data before confirmation.
     * GET /analyses/dossiers/{dossierId}/steps/2/preview
     */
    @GET
    @Path("/dossiers/{dossierId}/steps/2/preview")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY", "TECH_USER"})
    public Response previewStep2(@PathParam("dossierId") Long dossierId) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepCreditResponse response = stepCreditService.preview(dossierId, gestionnaireId);
            return Response.ok(response).build();

        } catch (IllegalArgumentException e) {
            return errorResponse(404, e.getMessage(), "DOSSIER_NOT_FOUND");
        } catch (ServiceUnavailableException e) {
            return errorResponse(503, e.getMessage(), "SERVICE_INDISPONIBLE");
        }
    }

    /**
     * Save Step 2 draft — persists data without marking complete or advancing step.
     * POST /analyses/dossiers/{dossierId}/steps/2/sauvegarder
     */
    @POST
    @Path("/dossiers/{dossierId}/steps/2/sauvegarder")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM"})
    public Response saveStep2(
        @PathParam("dossierId") Long dossierId,
        StepCreditService.StepCreditRequest request
    ) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepCreditResponse response = stepCreditService.save(dossierId, request, gestionnaireId);
            return Response.ok(response).build();
        } catch (IllegalArgumentException e) {
            return errorResponse(400, e.getMessage(), "INVALID_REQUEST");
        } catch (ServiceUnavailableException e) {
            return errorResponse(503, e.getMessage(), "SERVICE_INDISPONIBLE");
        }
    }

    /**
     * Confirm Step 2 and advance to Step 3.
     * POST /analyses/dossiers/{dossierId}/steps/2/confirmer
     * Body: { depenses: [...], financementAutre: [...] }
     */
    @POST
    @Path("/dossiers/{dossierId}/steps/2/confirmer")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM"})
    public Response confirmStep2(
        @PathParam("dossierId") Long dossierId,
        StepCreditService.StepCreditRequest request
    ) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepCreditResponse response = stepCreditService.confirm(dossierId, request, gestionnaireId);
            return Response.ok(response).build();

        } catch (IllegalArgumentException e) {
            return errorResponse(400, e.getMessage(), "INVALID_REQUEST");
        } catch (ServiceUnavailableException e) {
            return errorResponse(503, e.getMessage(), "SERVICE_INDISPONIBLE");
        }
    }

    /**
     * Get saved Step 2 data.
     * GET /analyses/dossiers/{dossierId}/steps/2
     */
    @GET
    @Path("/dossiers/{dossierId}/steps/2")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY", "TECH_USER"})
    public Response getStep2(@PathParam("dossierId") Long dossierId) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepCreditResponse response = stepCreditService.get(dossierId, gestionnaireId);
            return Response.ok(response).build();

        } catch (IllegalArgumentException e) {
            return errorResponse(404, e.getMessage(), "DOSSIER_NOT_FOUND");
        } catch (ServiceUnavailableException e) {
            return errorResponse(503, e.getMessage(), "SERVICE_INDISPONIBLE");
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Step 3 (Risque Client) endpoints
    // ─────────────────────────────────────────────────────────────

    /**
     * Preview Step 3 — returns saved draft or empty shell.
     * GET /analyses/dossiers/{dossierId}/steps/3/preview
     */
    @GET
    @Path("/dossiers/{dossierId}/steps/3/preview")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY", "TECH_USER"})
    public Response previewStep3(@PathParam("dossierId") Long dossierId) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepRisqueClientResponse response = stepRisqueClientService.preview(dossierId, gestionnaireId);
            return Response.ok(response).build();
        } catch (IllegalArgumentException e) {
            return errorResponse(404, e.getMessage(), "DOSSIER_NOT_FOUND");
        } catch (SecurityException e) {
            return errorResponse(403, "Accès refusé", "FORBIDDEN");
        } catch (jakarta.ws.rs.WebApplicationException e) {
            return e.getResponse();
        }
    }

    /**
     * Save Step 3 draft — all fields persisted, isComplete stays false.
     * POST /analyses/dossiers/{dossierId}/steps/3/sauvegarder
     */
    @POST
    @Path("/dossiers/{dossierId}/steps/3/sauvegarder")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM"})
    public Response saveStep3(
        @PathParam("dossierId") Long dossierId,
        StepRisqueClientService.StepRisqueClientRequest request
    ) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepRisqueClientService.StepRisqueClientRequest safeReq =
                request != null ? request : new StepRisqueClientService.StepRisqueClientRequest();
            StepRisqueClientResponse response = stepRisqueClientService.save(dossierId, safeReq, gestionnaireId);
            return Response.ok(response).build();
        } catch (IllegalArgumentException e) {
            return errorResponse(400, e.getMessage(), "INVALID_REQUEST");
        } catch (SecurityException e) {
            return errorResponse(403, "Accès refusé", "FORBIDDEN");
        } catch (jakarta.ws.rs.WebApplicationException e) {
            return e.getResponse();
        }
    }

    /**
     * Confirm Step 3 — marks isComplete=true, advances dossier to step 4.
     * POST /analyses/dossiers/{dossierId}/steps/3/confirmer
     */
    @POST
    @Path("/dossiers/{dossierId}/steps/3/confirmer")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM"})
    public Response confirmStep3(
        @PathParam("dossierId") Long dossierId,
        StepRisqueClientService.StepRisqueClientRequest request
    ) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepRisqueClientService.StepRisqueClientRequest safeReq =
                request != null ? request : new StepRisqueClientService.StepRisqueClientRequest();
            StepRisqueClientResponse response = stepRisqueClientService.confirm(dossierId, safeReq, gestionnaireId);
            return Response.ok(response).build();
        } catch (IllegalArgumentException e) {
            return errorResponse(400, e.getMessage(), "INVALID_REQUEST");
        } catch (SecurityException e) {
            return errorResponse(403, "Accès refusé", "FORBIDDEN");
        } catch (jakarta.ws.rs.WebApplicationException e) {
            return e.getResponse();
        }
    }

    /**
     * Get saved Step 3 data. Falls back to preview if not yet started.
     * GET /analyses/dossiers/{dossierId}/steps/3
     */
    @GET
    @Path("/dossiers/{dossierId}/steps/3")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY", "TECH_USER"})
    public Response getStep3(@PathParam("dossierId") Long dossierId) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepRisqueClientResponse response = stepRisqueClientService.get(dossierId, gestionnaireId);
            return Response.ok(response).build();
        } catch (IllegalArgumentException e) {
            return errorResponse(404, e.getMessage(), "DOSSIER_NOT_FOUND");
        } catch (SecurityException e) {
            return errorResponse(403, "Accès refusé", "FORBIDDEN");
        } catch (jakarta.ws.rs.WebApplicationException e) {
            return e.getResponse();
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Step 4 (Risque Commercial) endpoints
    // ─────────────────────────────────────────────────────────────

    /**
     * Preview Step 4 — returns saved draft or empty shell.
     * GET /analyses/dossiers/{dossierId}/steps/4/preview
     */
    @GET
    @Path("/dossiers/{dossierId}/steps/4/preview")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY", "TECH_USER"})
    public Response previewStep4(@PathParam("dossierId") Long dossierId) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepRisqueCommercialResponse response = stepRisqueCommercialService.preview(dossierId, gestionnaireId);
            return Response.ok(response).build();
        } catch (IllegalArgumentException e) {
            return errorResponse(404, e.getMessage(), "DOSSIER_NOT_FOUND");
        } catch (SecurityException e) {
            return errorResponse(403, "Accès refusé", "FORBIDDEN");
        } catch (jakarta.ws.rs.WebApplicationException e) {
            return e.getResponse();
        }
    }

    /**
     * Save Step 4 draft.
     * POST /analyses/dossiers/{dossierId}/steps/4/sauvegarder
     */
    @POST
    @Path("/dossiers/{dossierId}/steps/4/sauvegarder")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM"})
    public Response saveStep4(
        @PathParam("dossierId") Long dossierId,
        StepRisqueCommercialService.StepRisqueCommercialRequest request
    ) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepRisqueCommercialService.StepRisqueCommercialRequest safeReq =
                request != null ? request : new StepRisqueCommercialService.StepRisqueCommercialRequest();
            StepRisqueCommercialResponse response = stepRisqueCommercialService.save(dossierId, safeReq, gestionnaireId);
            return Response.ok(response).build();
        } catch (IllegalArgumentException e) {
            return errorResponse(400, e.getMessage(), "INVALID_REQUEST");
        } catch (SecurityException e) {
            return errorResponse(403, "Accès refusé", "FORBIDDEN");
        } catch (jakarta.ws.rs.WebApplicationException e) {
            return e.getResponse();
        }
    }

    /**
     * Confirm Step 4 — marks isComplete=true, advances dossier to step 5.
     * POST /analyses/dossiers/{dossierId}/steps/4/confirmer
     */
    @POST
    @Path("/dossiers/{dossierId}/steps/4/confirmer")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM"})
    public Response confirmStep4(
        @PathParam("dossierId") Long dossierId,
        StepRisqueCommercialService.StepRisqueCommercialRequest request
    ) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepRisqueCommercialService.StepRisqueCommercialRequest safeReq =
                request != null ? request : new StepRisqueCommercialService.StepRisqueCommercialRequest();
            StepRisqueCommercialResponse response = stepRisqueCommercialService.confirm(dossierId, safeReq, gestionnaireId);
            return Response.ok(response).build();
        } catch (IllegalArgumentException e) {
            return errorResponse(400, e.getMessage(), "INVALID_REQUEST");
        } catch (SecurityException e) {
            return errorResponse(403, "Accès refusé", "FORBIDDEN");
        } catch (jakarta.ws.rs.WebApplicationException e) {
            return e.getResponse();
        }
    }

    /**
     * Get saved Step 4 data.
     * GET /analyses/dossiers/{dossierId}/steps/4
     */
    @GET
    @Path("/dossiers/{dossierId}/steps/4")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY", "TECH_USER"})
    public Response getStep4(@PathParam("dossierId") Long dossierId) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepRisqueCommercialResponse response = stepRisqueCommercialService.get(dossierId, gestionnaireId);
            return Response.ok(response).build();
        } catch (IllegalArgumentException e) {
            return errorResponse(404, e.getMessage(), "DOSSIER_NOT_FOUND");
        } catch (SecurityException e) {
            return errorResponse(403, "Accès refusé", "FORBIDDEN");
        } catch (jakarta.ws.rs.WebApplicationException e) {
            return e.getResponse();
        }
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 5: RISQUE FINANCIER
    // ─────────────────────────────────────────────────────────────

    /**
     * Preview Step 5 data.
     * GET /analyses/dossiers/{dossierId}/steps/5/preview
     */
    @GET
    @Path("/dossiers/{dossierId}/steps/5/preview")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY", "TECH_USER"})
    public Response previewStep5(@PathParam("dossierId") Long dossierId) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepRisqueFinancierResponse response = stepRisqueFinancierService.preview(dossierId, gestionnaireId);
            return Response.ok(response).build();
        } catch (IllegalArgumentException e) {
            return errorResponse(404, e.getMessage(), "DOSSIER_NOT_FOUND");
        } catch (SecurityException e) {
            return errorResponse(403, "Accès refusé", "FORBIDDEN");
        }
    }

    /**
     * Save draft Step 5 data.
     * POST /analyses/dossiers/{dossierId}/steps/5/sauvegarder
     */
    @POST
    @Path("/dossiers/{dossierId}/steps/5/sauvegarder")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM"})
    public Response saveStep5(
        @PathParam("dossierId") Long dossierId,
        StepRisqueFinancierService.StepRisqueFinancierRequest request
    ) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepRisqueFinancierService.StepRisqueFinancierRequest safeReq =
                request != null ? request : new StepRisqueFinancierService.StepRisqueFinancierRequest();
            StepRisqueFinancierResponse response = stepRisqueFinancierService.save(dossierId, safeReq, gestionnaireId);
            return Response.ok(response).build();
        } catch (IllegalArgumentException e) {
            return errorResponse(400, e.getMessage(), "INVALID_REQUEST");
        } catch (SecurityException e) {
            return errorResponse(403, "Accès refusé", "FORBIDDEN");
        } catch (jakarta.ws.rs.WebApplicationException e) {
            return e.getResponse();
        }
    }

    /**
     * Confirm Step 5 data and advance to Step 6.
     * POST /analyses/dossiers/{dossierId}/steps/5/confirmer
     */
    @POST
    @Path("/dossiers/{dossierId}/steps/5/confirmer")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM"})
    public Response confirmStep5(
        @PathParam("dossierId") Long dossierId,
        StepRisqueFinancierService.StepRisqueFinancierRequest request
    ) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepRisqueFinancierService.StepRisqueFinancierRequest safeReq =
                request != null ? request : new StepRisqueFinancierService.StepRisqueFinancierRequest();
            StepRisqueFinancierResponse response = stepRisqueFinancierService.confirm(dossierId, safeReq, gestionnaireId);
            return Response.ok(response).build();
        } catch (IllegalArgumentException e) {
            return errorResponse(400, e.getMessage(), "INVALID_REQUEST");
        } catch (SecurityException e) {
            return errorResponse(403, "Accès refusé", "FORBIDDEN");
        } catch (jakarta.ws.rs.WebApplicationException e) {
            return e.getResponse();
        }
    }

    /**
     * Get saved Step 5 data.
     * GET /analyses/dossiers/{dossierId}/steps/5
     */
    @GET
    @Path("/dossiers/{dossierId}/steps/5")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY", "TECH_USER"})
    public Response getStep5(@PathParam("dossierId") Long dossierId) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepRisqueFinancierResponse response = stepRisqueFinancierService.get(dossierId, gestionnaireId);
            return Response.ok(response).build();
        } catch (IllegalArgumentException e) {
            return errorResponse(404, e.getMessage(), "DOSSIER_NOT_FOUND");
        } catch (SecurityException e) {
            return errorResponse(403, "Accès refusé", "FORBIDDEN");
        } catch (jakarta.ws.rs.WebApplicationException e) {
            return e.getResponse();
        }
    }

    // Helper for returning error responses
    private Response errorResponse(int status, String message, String code) {
        Map<String, Object> error = new HashMap<>();
        error.put("erreur", message);
        error.put("code", code);
        return Response.status(status).entity(error).build();
    }
}
