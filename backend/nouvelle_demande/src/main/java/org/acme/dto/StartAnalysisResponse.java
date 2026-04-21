package org.acme.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response from starting analysis on a demande.
 * Returns both the updated demande and the created dossier.
 */
public record StartAnalysisResponse(
    @JsonProperty("demandeId")
    Long demandeId,

    @JsonProperty("demandeStatus")
    String demandeStatus,

    @JsonProperty("dossierId")
    Long dossierId,

    @JsonProperty("message")
    String message
) {}
