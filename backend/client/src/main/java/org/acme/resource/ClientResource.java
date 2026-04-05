package org.acme.resource;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.dto.ClientCreateDTO;
import org.acme.dto.ClientResponseDTO;
import org.acme.dto.ClientUpdateDTO;
import org.acme.entity.enums.ClientStatus;
import org.acme.service.ClientService;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;
import java.util.UUID;

@Path("/api/clients")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Clients", description = "Manage clients")
@SecurityRequirement(name = "bearerAuth")
public class ClientResource {

    @Inject
    ClientService clientService;

    @Inject
    JsonWebToken jwt;

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────────────────────────────────

    @POST
    @RolesAllowed({"SUPER_ADMIN", "CRO", "FRONT_OFFICE"})
    @Operation(summary = "Create a new client")
    public Response create(@Valid ClientCreateDTO dto) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        ClientResponseDTO created = clientService.create(dto, actorId);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // READ
    // ─────────────────────────────────────────────────────────────────────────

    @GET
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY", "TECH_USER"})
    @Operation(summary = "List all clients (paginated, optional filters)")
    public List<ClientResponseDTO> list(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("status") ClientStatus status,
            @QueryParam("agenceId") String agenceId) {

        if (status != null) {
            return clientService.listByStatus(status, page, size);
        }
        if (agenceId != null && !agenceId.isBlank()) {
            return clientService.listByAgence(agenceId, page, size);
        }
        return clientService.listAll(page, size);
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY", "TECH_USER"})
    @Operation(summary = "Get client by ID")
    public ClientResponseDTO get(@PathParam("id") UUID id) {
        return clientService.getById(id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────────────────────────────────

    @PUT
    @Path("/{id}")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "FRONT_OFFICE"})
    @Operation(summary = "Update a client")
    public ClientResponseDTO update(@PathParam("id") UUID id, @Valid ClientUpdateDTO dto) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        return clientService.update(id, dto, actorId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────────────────────────────────

    @DELETE
    @Path("/{id}")
    @RolesAllowed({"SUPER_ADMIN"})
    @Operation(summary = "Delete a client")
    public Response delete(@PathParam("id") UUID id) {
        clientService.delete(id);
        return Response.noContent().build();
    }
}
