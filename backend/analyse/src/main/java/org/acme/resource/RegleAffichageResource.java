package org.acme.resource;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.dto.RegleAffichageRequest;
import org.acme.dto.RegleAffichageResponse;
import org.acme.service.RegleAffichageService;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/analyses/regles")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Règles d'affichage", description = "Manage product display / navigation rules")
@SecurityRequirement(name = "bearerAuth")
public class RegleAffichageResource {

    @Inject
    RegleAffichageService service;

    @GET
    @RolesAllowed({"SUPER_ADMIN", "TECH_USER", "FRONT_OFFICE", "CRO", "BRANCH_DM",
                   "HEAD_OFFICE_DM", "RISK_ANALYST", "READ_ONLY"})
    @Operation(summary = "List all active rules")
    public List<RegleAffichageResponse> list() {
        return service.listAll();
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"SUPER_ADMIN", "TECH_USER", "FRONT_OFFICE", "CRO", "BRANCH_DM",
                   "HEAD_OFFICE_DM", "RISK_ANALYST", "READ_ONLY"})
    @Operation(summary = "Get a rule by ID — includes inactive (for staleness checks)")
    public RegleAffichageResponse getById(@PathParam("id") Long id) {
        return service.getById(id);
    }

    @POST
    @RolesAllowed({"SUPER_ADMIN"})
    @Operation(summary = "Create a new rule")
    public Response create(@Valid RegleAffichageRequest req) {
        return Response.status(Response.Status.CREATED).entity(service.create(req)).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed({"SUPER_ADMIN"})
    @Operation(summary = "Edit a rule — soft-deletes current version, creates version+1")
    public Response update(@PathParam("id") Long id, @Valid RegleAffichageRequest req) {
        return Response.ok(service.update(id, req)).build();
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed({"SUPER_ADMIN"})
    @Operation(summary = "Hard-delete a rule (use only when no dossiers reference it)")
    public Response delete(@PathParam("id") Long id) {
        service.delete(id);
        return Response.noContent().build();
    }
}
