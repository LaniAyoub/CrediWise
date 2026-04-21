package org.acme.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A single credit (demande) in a client's history.
 * Used inside the JSON array in step_client.historique_credits.
 */
public record CreditHistoriqueItem(
    @JsonProperty("demandeId")
    Long demandeId,

    @JsonProperty("status")
    String status,

    @JsonProperty("requestedAmount")
    String requestedAmount,

    @JsonProperty("durationMonths")
    Integer durationMonths,

    @JsonProperty("productName")
    String productName,

    @JsonProperty("loanPurpose")
    String loanPurpose,

    @JsonProperty("managerName")
    String managerName,

    @JsonProperty("applicationChannel")
    String applicationChannel,

    @JsonProperty("bankingRestriction")
    Boolean bankingRestriction,

    @JsonProperty("legalIssueOrAccountBlocked")
    Boolean legalIssueOrAccountBlocked,

    @JsonProperty("guarantorsCount")
    Integer guarantorsCount,

    @JsonProperty("guaranteesCount")
    Integer guaranteesCount,

    @JsonProperty("createdAt")
    String createdAt,

    @JsonProperty("updatedAt")
    String updatedAt
) {}
