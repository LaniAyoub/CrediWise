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
import org.acme.entity.AnalyseDossier;
import org.acme.entity.enums.DossierStatus;
import org.acme.exception.ServiceUnavailableException;
import org.acme.service.StepClientService;
import org.acme.service.StepCreditService;
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

    // ─────────────────────────────────────────────────────────────
    // Dossier CRUD
    // ─────────────────────────────────────────────────────────────

    /**
     * Create a new analysis dossier for a demande.
     * POST /analyses/dossiers?demandeId={demandeId}&clientId={clientId}&demandeStatus={status}&demandeCreatedAt={ISO8601DateTime}
     */
    @POST
    @Path("/dossiers")
    @RolesAllowed({"FRONT_OFFICE", "SUPER_ADMIN"})
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
    @RolesAllowed({"FRONT_OFFICE", "SUPER_ADMIN"})
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
    @RolesAllowed({"FRONT_OFFICE", "SUPER_ADMIN"})
    public Response listDossiers() {
        UUID gestionnaireId = UUID.fromString(jwt.getSubject());
        boolean isSuperAdmin = jwt.getGroups().contains("SUPER_ADMIN");

        List<AnalyseDossier> dossiers;
        if (isSuperAdmin) {
            dossiers = AnalyseDossier.listAll();
        } else {
            dossiers = AnalyseDossier.findByGestionnaireId(gestionnaireId);
        }

        return Response.ok(dossiers).build();
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
    @RolesAllowed({"FRONT_OFFICE", "SUPER_ADMIN"})
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
     * Confirm Step 1 and advance to Step 2.
     * POST /analyses/dossiers/{dossierId}/steps/1/confirmer
     */
    @POST
    @Path("/dossiers/{dossierId}/steps/1/confirmer")
    @RolesAllowed({"FRONT_OFFICE", "SUPER_ADMIN"})
    public Response confirmStep1(@PathParam("dossierId") Long dossierId) {
        try {
            UUID gestionnaireId = UUID.fromString(jwt.getSubject());
            StepClientResponse response = stepClientService.confirm(dossierId, gestionnaireId);
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
    @RolesAllowed({"FRONT_OFFICE", "SUPER_ADMIN"})
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
    @RolesAllowed({"FRONT_OFFICE", "SUPER_ADMIN"})
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
     * Confirm Step 2 and advance to Step 3.
     * POST /analyses/dossiers/{dossierId}/steps/2/confirmer
     * Body: { depenses: [...], financementAutre: [...] }
     */
    @POST
    @Path("/dossiers/{dossierId}/steps/2/confirmer")
    @RolesAllowed({"FRONT_OFFICE", "SUPER_ADMIN"})
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
    @RolesAllowed({"FRONT_OFFICE", "SUPER_ADMIN"})
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

    // Helper for returning error responses
    private Response errorResponse(int status, String message, String code) {
        Map<String, Object> error = new HashMap<>();
        error.put("erreur", message);
        error.put("code", code);
        return Response.status(status).entity(error).build();
    }
}
