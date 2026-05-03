package org.acme.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for Step 5 (Risque Financier).
 */
public record StepRisqueFinancierResponse(
        Long dossierId,
        Long demandeId,
        String dossierStatus,

        // Section fields
        String notes,

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
) {}
