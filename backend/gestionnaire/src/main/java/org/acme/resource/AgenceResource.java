package org.acme.resource;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.dto.AgenceCreateDTO;
import org.acme.dto.AgenceResponseDTO;
import org.acme.dto.AgenceUpdateDTO;
import org.acme.service.AgenceService;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/api/agences")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Agences", description = "Manage bank branches")
@SecurityRequirement(name = "bearerAuth")
public class AgenceResource {

    @Inject
    AgenceService agenceService;

    @POST
    @RolesAllowed({"SUPER_ADMIN"})
    public Response create(@Valid AgenceCreateDTO dto) {
        AgenceResponseDTO created = agenceService.create(dto, null);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @GET
    @RolesAllowed({"SUPER_ADMIN", "TECH_USER", "FRONT_OFFICE", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "READ_ONLY"})
    public List<AgenceResponseDTO> list() {
        return agenceService.listAll();
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"SUPER_ADMIN", "TECH_USER", "FRONT_OFFICE", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "READ_ONLY"})
    public AgenceResponseDTO get(@PathParam("id") String id) {
        return agenceService.getById(id);
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed({"SUPER_ADMIN"})
    public AgenceResponseDTO update(@PathParam("id") String id, @Valid AgenceUpdateDTO dto) {
        return agenceService.update(id, dto, null);
    }
}

