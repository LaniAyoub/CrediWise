package org.acme.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class ScoringRequest {

    @NotNull(message = "demandeId is required")
    public Long demandeId;

    public UUID clientId;

    // ── Emprunteur ───────────────────────────────────────────────────────────

    @NotNull(message = "dateOfBirth is required")
    public LocalDate dateOfBirth;

    /** Date de la demande de crédit — utilisée pour calculer l'âge et l'ancienneté */
    @NotNull(message = "requestDate is required")
    public LocalDate requestDate;

    /**
     * Date d'entrée en relation bancaire (ancienneté bancaire).
     * Facultatif : si absent, la règle d'ancienneté ne déclenche pas de refus.
     */
    public LocalDate bankingEntryDate;

    /**
     * Situation matrimoniale : valeurs attendues SINGLE | MARRIED | DIVORCED |
     * SEPARATED | WIDOWER | OTHER  (correspond à l'enum SituationFamiliale du
     * service client). Toute valeur inconnue sera traitée comme « Autre ».
     */
    public String maritalStatus;

    // ── Budget ───────────────────────────────────────────────────────────────

    @NotNull(message = "monthlyIncome is required")
    @DecimalMin(value = "0.001", message = "monthlyIncome must be positive")
    public BigDecimal monthlyIncome;

    // ── Offre commerciale ────────────────────────────────────────────────────

    @NotNull(message = "requestedAmount is required")
    @DecimalMin(value = "0.001", message = "requestedAmount must be positive")
    public BigDecimal requestedAmount;

    @NotNull(message = "durationMonths is required")
    @Min(value = 1, message = "durationMonths must be at least 1")
    public Integer durationMonths;

    /**
     * Taux d'intérêt annuel en pourcentage (ex: 8.5 pour 8,5 %).
     * Facultatif : si absent, la variable taux ne contribue pas au score.
     */
    public Double interestRate;

    /**
     * Dispose d'un compte épargne (isepa).
     * Facultatif : si absent, considéré comme false (pas de pénalité).
     */
    public Boolean hasSavingsAccount;

    // ── Fichage ──────────────────────────────────────────────────────────────

    @NotNull(message = "bankingRestriction is required")
    public Boolean bankingRestriction;

    @NotNull(message = "legalIssueOrAccountBlocked is required")
    public Boolean legalIssueOrAccountBlocked;
}
