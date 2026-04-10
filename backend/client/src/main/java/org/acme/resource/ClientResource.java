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
import org.acme.dto.ScoringAnalysisDTO;
import org.acme.entity.Client;
import org.acme.entity.enums.ClientStatus;
import org.acme.repository.ClientRepository;
import org.acme.service.ClientService;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Path("/api/clients")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Clients", description = "Manage clients")
@SecurityRequirement(name = "bearerAuth")
public class ClientResource {
    @Inject
    ClientRepository clientRepository;

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
    @GET
    @Path("/search")
    @Produces(MediaType.APPLICATION_JSON)
    public Response searchClient(@QueryParam("national_id") String nationalId, @QueryParam("primary_phone") String primaryPhone) {
    // Check if nationalId is provided and not blank
    if (nationalId != null && !nationalId.isBlank()) {
        return clientRepository.findByNationalId(nationalId)
                .map(client -> Response.ok(client).build())
                .orElseGet(() -> Response.status(Response.Status.NOT_FOUND).build());
    }

    // If not, check if primaryPhone is provided and not blank
    if (primaryPhone != null && !primaryPhone.isBlank()) {
        return clientRepository.findByPrimaryPhone(primaryPhone)
                .map(client -> Response.ok(client).build())
                .orElseGet(() -> Response.status(Response.Status.NOT_FOUND).build());
    }

    // If neither is provided, return a bad request
    return Response.status(Response.Status.BAD_REQUEST)
                   .entity("{\"error\":\"Please provide a valid national_id or primary_phone to search.\"}")
                   .build();
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

    // ─────────────────────────────────────────────────────────────────────────
    // SCORING & ANALYSIS
    // ─────────────────────────────────────────────────────────────────────────

    @GET
    @Path("/{id}/scoring-analysis")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "READ_ONLY"})
    @Operation(summary = "Get detailed scoring analysis for a client")
    public Response getScoringAnalysis(@PathParam("id") UUID clientId) {
        var analysis = clientService.getScoringAnalysis(clientId);
        return Response.ok(analysis).build();
    }
}
