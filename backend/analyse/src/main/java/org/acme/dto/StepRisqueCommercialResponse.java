package org.acme.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for Step 4 (Risque Commercial).
 */
public record StepRisqueCommercialResponse(
        Long dossierId,
        Long demandeId,
        String dossierStatus,

        // Section 1: Information Activités
        Integer nbAnneesExperienceEmploye,
        Integer nbAnneesExperienceManager,
        Boolean autresActivites,
        Boolean venteACredit,

        // Section 2: Points de vente
        List<PointDeVenteItem> pointsDeVente,

        // Section 2: Description
        String descriptionActiviteAnalyse,

        // Metadata
        boolean isComplete,
        String stepStatus,

        // Audit
        UUID confirmedBy,
        String confirmedByName,
        LocalDateTime confirmedAt,
        UUID lastEditedBy,
        String lastEditedByName,
        LocalDateTime lastEditedAt,
        LocalDateTime createdAt
) {
    public record PointDeVenteItem(
            Long id,
            String type,
            String propriete,
            String joursOuverture,
            String horaireOuverture,
            BigDecimal surface,
            String emplacement,
            Integer ordre
    ) {}
}
