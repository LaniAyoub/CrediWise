package org.acme.resource;

import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Sort;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import org.acme.dto.ReferenceItemDTO;
import org.acme.entity.AccountType;
import org.acme.entity.SecteurActivite;
import org.acme.entity.Segment;
import org.acme.entity.SousActivite;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Reference Data", description = "Reference data for client forms")
@SecurityRequirement(name = "bearerAuth")
public class ReferenceDataResource {

    @GET
    @Path("/segments")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY", "TECH_USER"})
    @Operation(summary = "List all client segments")
    public List<ReferenceItemDTO> getSegments() {
        return Segment.<Segment>listAll(Sort.by("libelle")).stream()
                .map(item -> new ReferenceItemDTO(item.getId(), item.getLibelle()))
                .toList();
    }

    @GET
    @Path("/account-types")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY", "TECH_USER"})
    @Operation(summary = "List all account types")
    public List<ReferenceItemDTO> getAccountTypes() {
        return AccountType.<AccountType>listAll(Sort.by("libelle")).stream()
                .map(item -> new ReferenceItemDTO(item.getId(), item.getLibelle()))
                .toList();
    }

    @GET
    @Path("/secteur-activites")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY", "TECH_USER"})
    @Operation(summary = "List all secteur activites")
    public List<ReferenceItemDTO> getSecteurActivites() {
        return SecteurActivite.<SecteurActivite>listAll(Sort.by("libelle")).stream()
                .map(item -> new ReferenceItemDTO(item.getId(), item.getLibelle()))
                .toList();
    }

    @GET
    @Path("/sous-activites")
    @RolesAllowed({"SUPER_ADMIN", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY", "TECH_USER"})
    @Operation(summary = "List sous activites, optionally filtered by secteurActiviteId")
    public List<ReferenceItemDTO> getSousActivites(@QueryParam("secteurActiviteId") Long secteurActiviteId) {
        PanacheQuery<SousActivite> query = (secteurActiviteId == null)
                ? SousActivite.findAll(Sort.by("libelle"))
                : SousActivite.find("secteurActivite.id = ?1", Sort.by("libelle"), secteurActiviteId);

        return query.list().stream()
                .map(item -> new ReferenceItemDTO(item.getId(), item.getLibelle()))
                .toList();
    }
}
