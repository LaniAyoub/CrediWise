package org.acme.resource;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.dto.*;
import org.acme.entity.enums.DemandeStatut;
import org.acme.service.DemandeService;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;
import java.util.UUID;

@Path("/api/demandes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Demandes", description = "Manage credit requests")
@SecurityRequirement(name = "bearerAuth")
public class DemandeResource {

    @Inject
    DemandeService demandeService;

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────────────────────────────────

    @POST
    @RolesAllowed({"SUPER_ADMIN", "CRO", "FRONT_OFFICE"})
    @Operation(summary = "Create a new credit request (DRAFT)")
    public Response create(@Valid DemandeCreateRequest req) {
        DemandeResponse created = demandeService.create(req);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE  (DRAFT only — locked once SUBMITTED)
    // ─────────────────────────────────────────────────────────────────────────

    @PUT
    @Path("/{id}")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "FRONT_OFFICE"})
    @Operation(summary = "Update a DRAFT demande (blocked once submitted)")
    public DemandeResponse update(@PathParam("id") Long id, @Valid DemandeUpdateRequest req) {
        return demandeService.update(id, req);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // READ
    // ─────────────────────────────────────────────────────────────────────────

    @GET
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY", "TECH_USER"})
    @Operation(summary = "List demandes (paginated, optional filters)")
    public List<DemandeResponse> list(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("clientId") UUID clientId,
            @QueryParam("statut") DemandeStatut statut) {

        if (clientId != null) {
            return demandeService.listByClientId(clientId, page, size);
        }
        if (statut != null) {
            return demandeService.listByStatut(statut, page, size);
        }
        return demandeService.listAll(page, size);
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY", "TECH_USER"})
    @Operation(summary = "Get demande by ID")
    public DemandeResponse getById(@PathParam("id") Long id) {
        return demandeService.getById(id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUBMIT  (DRAFT → ANALYSE or CHECK_BEFORE_COMMITTEE, creates dossier atomically)
    // Products 101,102,103 → ANALYSE | Products 104,105 → CHECK_BEFORE_COMMITTEE
    // ─────────────────────────────────────────────────────────────────────────

    @POST
    @Path("/{id}/submit")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "FRONT_OFFICE"})
    @Operation(summary = "Submit a DRAFT demande — creates analysis dossier and routes by product")
    public Response submit(@PathParam("id") Long id) {
        StartAnalysisResponse result = demandeService.submit(id);
        return Response.ok(result).build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATUS UPDATE  (manual transitions for reviewers / workflow engine)
    // ─────────────────────────────────────────────────────────────────────────

    @PATCH
    @Path("/{id}/statut")
    @RolesAllowed({"SUPER_ADMIN", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST"})
    @Operation(summary = "Manually update demande status (workflow transitions)")
    public DemandeResponse updateStatut(@PathParam("id") Long id, @Valid StatutUpdateRequest req) {
        return demandeService.updateStatut(id, req.getStatus());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE  (DRAFT only — soft delete)
    // ─────────────────────────────────────────────────────────────────────────

    @DELETE
    @Path("/{id}")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "FRONT_OFFICE"})
    @Operation(summary = "Soft-delete a DRAFT demande")
    public Response delete(@PathParam("id") Long id) {
        demandeService.delete(id);
        return Response.noContent().build();
    }
}
