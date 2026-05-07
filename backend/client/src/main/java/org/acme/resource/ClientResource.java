package org.acme.resource;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.dto.ClientCreateDTO;
import org.acme.dto.ClientResponseDTO;
import org.acme.dto.ClientSearchResultDTO;
import org.acme.dto.ClientUpdateDTO;
import org.acme.entity.enums.ClientStatus;
import org.acme.repository.ClientRepository;
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
    ClientRepository clientRepository;

    @Inject
    ClientService clientService;

    @Inject
    JsonWebToken jwt;

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────────────────────────────────

    @POST
    @RolesAllowed({"SUPER_ADMIN", "FRONT_OFFICE"})
    @Operation(summary = "Create a new client")
    public Response create(@Valid ClientCreateDTO dto) {
        String subject = jwt.getSubject();
        if (subject == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("{\"error\":\"Token missing sub claim\"}")
                    .build();
        }
        UUID actorId = UUID.fromString(subject);
        ClientResponseDTO created = clientService.create(dto, actorId);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // READ
    // ─────────────────────────────────────────────────────────────────────────

    @GET
    @RolesAllowed({"SUPER_ADMIN", "FRONT_OFFICE"})
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
    @RolesAllowed({"SUPER_ADMIN", "FRONT_OFFICE"})
    @Operation(summary = "Get client by ID")
    public ClientResponseDTO get(@PathParam("id") UUID id) {
        return clientService.getById(id);
    }
    /**
     * Smart multi-field fuzzy search.
     * GET /api/clients/search?q=...&limit=10
     *
     * Matches against firstName, lastName, companyName, nationalId,
     * primaryPhone, email, cbsId using PostgreSQL trigram similarity.
     * Results are ranked by relevance score (best match first).
     *
     * Legacy params national_id / primary_phone still work for backwards
     * compatibility with existing callers.
     */
    @GET
    @Path("/search")
    @RolesAllowed({"SUPER_ADMIN", "FRONT_OFFICE"})
    @Operation(summary = "Smart fuzzy search for clients")
    public Response searchClients(
            @QueryParam("q")            String q,
            @QueryParam("limit")        @DefaultValue("12") int limit,
            // Legacy exact-match params kept for backwards compatibility
            @QueryParam("national_id")  String nationalId,
            @QueryParam("primary_phone") String primaryPhone) {

        // ── Legacy exact-match path ───────────────────────────────────────────
        if (q == null || q.isBlank()) {
            if (nationalId != null && !nationalId.isBlank()) {
                return clientRepository.findByNationalId(nationalId)
                        .map(c -> Response.ok(c).build())
                        .orElseGet(() -> Response.status(Response.Status.NOT_FOUND).build());
            }
            if (primaryPhone != null && !primaryPhone.isBlank()) {
                return clientRepository.findByPrimaryPhone(primaryPhone)
                        .map(c -> Response.ok(c).build())
                        .orElseGet(() -> Response.status(Response.Status.NOT_FOUND).build());
            }
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\":\"Parameter 'q' is required\"}")
                    .build();
        }

        // ── Smart search path ─────────────────────────────────────────────────
        if (q.length() < 2) {
            return Response.ok(List.of()).build();
        }
        int safeLimit = Math.min(Math.max(limit, 1), 50);
        List<ClientSearchResultDTO> results = clientRepository.smartSearch(q.trim(), safeLimit);
        return Response.ok(results).build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────────────────────────────────

    @PUT
    @Path("/{id}")
    @RolesAllowed({"SUPER_ADMIN", "FRONT_OFFICE"})
    @Operation(summary = "Update a client")
    public Response update(@PathParam("id") UUID id, @Valid ClientUpdateDTO dto) {
        String subject = jwt.getSubject();
        if (subject == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("{\"error\":\"Token missing sub claim\"}")
                    .build();
        }
        UUID actorId = UUID.fromString(subject);
        return Response.ok(clientService.update(id, dto, actorId)).build();
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
