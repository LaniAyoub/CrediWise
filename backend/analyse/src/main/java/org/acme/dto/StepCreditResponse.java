package org.acme.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Complete Step 2 (Credit Object) response data.
 * Contains Section A (read-only snapshot), Section B (expenses), and Section C (other financing).
 * Returned to frontend for display in the analysis dossier.
 */
public record StepCreditResponse(
    // ─── SECTION A: Read-only snapshot from Demande ──────────────

    @JsonProperty("loanPurpose")
    String loanPurpose,

    @JsonProperty("requestedAmount")
    BigDecimal requestedAmount,

    @JsonProperty("durationMonths")
    Integer durationMonths,

    @JsonProperty("productId")
    String productId,

    @JsonProperty("productName")
    String productName,

    @JsonProperty("assetType")
    String assetType,

    @JsonProperty("monthlyRepaymentCapacity")
    BigDecimal monthlyRepaymentCapacity,

    @JsonProperty("pertinenceProjet")
    String pertinenceProjet,

    // ─── BALANCE CALCULATION ────────────────────────────────────

    @JsonProperty("totalCostExpenses")
    BigDecimal totalCostExpenses,

    @JsonProperty("totalOtherFinancing")
    BigDecimal totalOtherFinancing,

    @JsonProperty("isBalanced")
    Boolean isBalanced,

    @JsonProperty("balanceMessage")
    String balanceMessage,

    // ─── SECTION B: Project Expenses ────────────────────────────

    @JsonProperty("depenses")
    List<DépenseProjetItem> depenses,

    // ─── SECTION C: Other Financing Sources ─────────────────────

    @JsonProperty("financementAutre")
    List<FinancementAutreItem> financementAutre,

    // ─── CONFIRMATION TRACKING ──────────────────────────────────

    @JsonProperty("isComplete")
    Boolean isComplete,

    @JsonProperty("confirmedBy")
    UUID confirmedBy,

    @JsonProperty("confirmedByName")
    String confirmedByName,

    @JsonProperty("confirmedAt")
    LocalDateTime confirmedAt,

    @JsonProperty("dataFetchedAt")
    LocalDateTime dataFetchedAt,

    // ─── DOSSIER INFO ───────────────────────────────────────────

    @JsonProperty("dossierId")
    Long dossierId,

    @JsonProperty("demandeId")
    Long demandeId,

    @JsonProperty("dossierStatus")
    String dossierStatus,

    @JsonProperty("demandeCreatedAt")
    LocalDateTime demandeCreatedAt
) {

    /**
     * Nested record for expense items (Section B)
     */
    public record DépenseProjetItem(
        @JsonProperty("id")
        Long id,

        @JsonProperty("categorie")
        String categorie,

        @JsonProperty("description")
        String description,

        @JsonProperty("cout")
        BigDecimal cout,

        @JsonProperty("ordre")
        Integer ordre
    ) {}

    /**
     * Nested record for other financing items (Section C)
     */
    public record FinancementAutreItem(
        @JsonProperty("id")
        Long id,

        @JsonProperty("description")
        String description,

        @JsonProperty("montant")
        BigDecimal montant,

        @JsonProperty("ordre")
        Integer ordre
    ) {}
}
