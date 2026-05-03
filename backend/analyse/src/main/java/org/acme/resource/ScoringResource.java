package org.acme.resource;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.dto.ScoringRequest;
import org.acme.dto.ScoringResponse;
import org.acme.entity.ScoringResult;
import org.acme.grpc.ClientDataClient;
import org.acme.service.ScoringEngine;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.math.BigDecimal;
import java.util.UUID;

@Path("/api/scoring")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Scoring", description = "Moteur de scoring crédit (DRG + DSS + Décision Système)")
@SecurityRequirement(name = "bearerAuth")
public class ScoringResource {

    @Inject
    ScoringEngine scoringEngine;

    @Inject
    ClientDataClient clientDataClient;

    @Inject
    JsonWebToken jwt;

    /**
     * Calcule et persiste le score d'une demande de crédit.
     *
     * Retourne :
     *  - les décisions partielles DRG (Règles de Gestion) par critère
     *  - le score brut et ajusté (0–1000) ainsi que la décision DSS
     *  - la décision finale du système (matrice DRG × DSS)
     *  - le détail de la contribution de chaque variable au score brut
     *
     * Sauvegarde le résultat dans la table scoring_results avec UPSERT sur demande_id.
     */
    @POST
    @Transactional
    @RolesAllowed({"SUPER_ADMIN", "FRONT_OFFICE"})
    @Operation(summary = "Calculer et sauvegarder le score d'une demande de crédit")
    public Response score(@Valid ScoringRequest request) {
        // Compute score
        ScoringResponse result = scoringEngine.score(request);

        // Persist or update in DB (UPSERT on demande_id)
        UUID callerId = null;
        try {
            callerId = UUID.fromString(jwt.getSubject());
        } catch (Exception e) {
            // No caller ID available
        }

        // UPSERT on demande_id: delete existing, then persist new
        ScoringResult.delete("demandeId", result.getDemandeId());

        ScoringResult entity = new ScoringResult();
        entity.demandeId = result.getDemandeId();
        entity.clientId = result.getClientId();
        entity.drgAge = result.getDrgAge();
        entity.drgAnciennete = result.getDrgAnciennete();
        entity.drgBudget = result.getDrgBudget();
        entity.drgFichage = result.getDrgFichage();
        entity.drgOffre = result.getDrgOffre();
        entity.drgDecision = result.getDecisionDRG();
        entity.scoreBrut = result.getScoreBrut() != 0 ? BigDecimal.valueOf(result.getScoreBrut()) : null;
        entity.scoreAjuste = result.getScoreAjuste() != 0 ? BigDecimal.valueOf(result.getScoreAjuste()) : null;
        entity.dssDecision = result.getDecisionDSS();
        entity.decisionSysteme = result.getDecisionSysteme();
        entity.createdBy = callerId;
        entity.persist();

        // Update client service with final scoring decision
        try {
            clientDataClient.updateScoring(result.getClientId().toString(), result.getDecisionSysteme().name());
        } catch (Exception e) {
            // Log error but don't fail the response — scoring is saved
            org.slf4j.LoggerFactory.getLogger(ScoringResource.class)
                .warn("Failed to update client scoring: " + e.getMessage());
        }

        return Response.ok(result).build();
    }

    /**
     * Retrieve saved scoring result for a demand.
     * GET /api/scoring/{demandeId}
     */
    @GET
    @Path("/{demandeId}")
    @RolesAllowed({"SUPER_ADMIN", "FRONT_OFFICE", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "READ_ONLY", "TECH_USER"})
    @Operation(summary = "Récupérer le score sauvegardé d'une demande")
    public Response getSavedScoring(@PathParam("demandeId") Long demandeId) {
        ScoringResult result = ScoringResult.findByDemandeId(demandeId).orElse(null);
        if (result == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(java.util.Map.of("erreur", "Scoring non trouvé", "code", "SCORING_NOT_FOUND"))
                .build();
        }
        return Response.ok(result).build();
    }
}
