package org.acme.resource;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.dto.ScoringRequest;
import org.acme.dto.ScoringResponse;
import org.acme.service.ScoringEngine;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/api/scoring")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Scoring", description = "Moteur de scoring crédit (DRG + DSS + Décision Système)")
@SecurityRequirement(name = "bearerAuth")
public class ScoringResource {

    @Inject
    ScoringEngine scoringEngine;

    /**
     * Calcule le score d'une demande de crédit.
     *
     * Retourne :
     *  - les décisions partielles DRG (Règles de Gestion) par critère
     *  - le score brut et ajusté (0–1000) ainsi que la décision DSS
     *  - la décision finale du système (matrice DRG × DSS)
     *  - le détail de la contribution de chaque variable au score brut
     */
    @POST
    @RolesAllowed({"SUPER_ADMIN", "RISK_ANALYST", "BRANCH_DM", "HEAD_OFFICE_DM", "CRO"})
    @Operation(summary = "Calculer le score d'une demande de crédit")
    public Response score(@Valid ScoringRequest request) {
        ScoringResponse result = scoringEngine.score(request);
        return Response.ok(result).build();
    }
}
