package org.acme.resource;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.dto.*;
import org.acme.service.GestionnaireService;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;
import java.util.UUID;

@Path("/api/gestionnaires")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Gestionnaires", description = "Manage gestionnaire accounts")
@SecurityRequirement(name = "bearerAuth")
public class GestionnaireResource {

    @Inject
    GestionnaireService gestionnaireService;

    @Inject
    JsonWebToken jwt;

    private UUID currentUserId() {
        String subject = jwt.getSubject();
        if (subject == null) return null;
        try {
            return UUID.fromString(subject);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @POST
    @RolesAllowed({"SUPER_ADMIN", "TECH_USER"})
    public Response create(@Valid GestionnaireCreateDTO dto) {
        GestionnaireResponseDTO created = gestionnaireService.create(dto, currentUserId());
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @GET
    @RolesAllowed({"SUPER_ADMIN", "TECH_USER"})
    public List<GestionnaireResponseDTO> getAll() {
        return gestionnaireService.listAll();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed({"SUPER_ADMIN", "TECH_USER"})
    public GestionnaireResponseDTO update(@PathParam("id") UUID id, @Valid GestionnaireUpdateDTO dto) {
        return gestionnaireService.update(id, dto, currentUserId());
    }

    @PUT
    @Path("/{id}/agence")
    @RolesAllowed({"SUPER_ADMIN"})
    public GestionnaireResponseDTO moveToAgence(@PathParam("id") UUID id, @Valid GestionnaireAgenceUpdateDTO dto) {
        return gestionnaireService.moveToAgence(id, dto.getAgenceId(), currentUserId());
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed({"SUPER_ADMIN", "TECH_USER"})
    public Response delete(@PathParam("id") UUID id) {
        gestionnaireService.delete(id);
        return Response.noContent().build();
    }
}