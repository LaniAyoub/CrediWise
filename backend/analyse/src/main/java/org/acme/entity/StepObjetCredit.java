package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Step 2 (Credit Object) snapshot data for a dossier.
 * Stores Section A (read-only snapshot from demande) and balance calculation.
 * Contains cascade relationships to expenses (Section B) and other financing (Section C).
 */
@Entity
@Table(
    name = "step_objet_credit",
    indexes = {
        @Index(name = "idx_step_objet_credit_dossier_id", columnList = "dossier_id"),
        @Index(name = "idx_step_objet_credit_confirmed_at", columnList = "confirmed_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"dossier", "depenses", "financementAutre"})
@EqualsAndHashCode(of = "id", callSuper = false)
public class StepObjetCredit extends PanacheEntity {

    @NotNull
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", unique = true, nullable = false)
    public AnalyseDossier dossier;

    // ─────────────────────────────────────────────────────────────
    // SECTION A: Read-only snapshot from Demande
    // ─────────────────────────────────────────────────────────────

    @Column(name = "loan_purpose", columnDefinition = "TEXT")
    public String loanPurpose;

    @Column(name = "requested_amount", precision = 15, scale = 2)
    public BigDecimal requestedAmount;

    @Column(name = "duration_months")
    public Integer durationMonths;

    @Column(name = "product_id", length = 50)
    public String productId;

    @Column(name = "product_name", length = 200)
    public String productName;

    @Column(name = "asset_type", length = 100)
    public String assetType;

    @Column(name = "monthly_repayment_capacity", precision = 15, scale = 2)
    public BigDecimal monthlyRepaymentCapacity;

    // ─────────────────────────────────────────────────────────────
    // SECTION D: Project Relevance (Pertinence du Projet)
    // Free-text field describing the justification and relevance of the project
    // ─────────────────────────────────────────────────────────────

    @Column(name = "pertinence_projet", columnDefinition = "TEXT")
    public String pertinenceProjet;

    // ─────────────────────────────────────────────────────────────
    // BALANCE CALCULATION
    // ─────────────────────────────────────────────────────────────

    @Column(name = "total_cost_expenses", precision = 15, scale = 2)
    public BigDecimal totalCostExpenses = BigDecimal.ZERO;

    @Column(name = "total_other_financing", precision = 15, scale = 2)
    public BigDecimal totalOtherFinancing = BigDecimal.ZERO;

    @Column(name = "is_balanced")
    public Boolean isBalanced = false;

    @Column(name = "balance_message", length = 500)
    public String balanceMessage;

    // ─────────────────────────────────────────────────────────────
    // SECTION B: Project Expenses (Dépenses du Projet)
    // Min 1 required, cascade delete on save (replace)
    // ─────────────────────────────────────────────────────────────

    @OneToMany(mappedBy = "stepObjetCredit", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("ordre ASC")
    public List<StepDépenseProjet> depenses = new ArrayList<>();

    // ─────────────────────────────────────────────────────────────
    // SECTION C: Other Financing Sources (Financement Autre)
    // Optional, cascade delete on save (replace)
    // ─────────────────────────────────────────────────────────────

    @OneToMany(mappedBy = "stepObjetCredit", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("ordre ASC")
    public List<StepFinancementAutre> financementAutre = new ArrayList<>();

    // ─────────────────────────────────────────────────────────────
    // CONFIRMATION TRACKING
    // ─────────────────────────────────────────────────────────────

    @Column(name = "confirmed_by", columnDefinition = "uuid")
    public UUID confirmedBy;

    @Column(name = "confirmed_by_name", length = 200)
    public String confirmedByName;

    @Column(name = "confirmed_at")
    public LocalDateTime confirmedAt;

    @Column(name = "data_fetched_at")
    public LocalDateTime dataFetchedAt;

    @NotNull
    @Column(name = "is_complete", nullable = false)
    public Boolean isComplete = false;

    // ─────────────────────────────────────────────────────────────
    // AUDIT
    // ─────────────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    public LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    // ─────────────────────────────────────────────────────────────
    // Finders
    // ─────────────────────────────────────────────────────────────

    public static java.util.Optional<StepObjetCredit> findByDossierId(Long dossierId) {
        return find("dossier.id", dossierId).firstResultOptional();
    }

    // ─────────────────────────────────────────────────────────────
    // Helper methods for balance calculation
    // ─────────────────────────────────────────────────────────────

    /**
     * Calculate balance status:
     * isBalanced = |totalCostExpenses - (requestedAmount + totalOtherFinancing)| <= 0.01
     *
     * @return true if balanced, false otherwise
     */
    public Boolean calculateIsBalanced() {
        if (requestedAmount == null || totalCostExpenses == null) {
            return false;
        }

        BigDecimal financeTotal = requestedAmount.add(totalOtherFinancing == null ? BigDecimal.ZERO : totalOtherFinancing);
        BigDecimal diff = totalCostExpenses.subtract(financeTotal).abs();

        return diff.compareTo(new BigDecimal("0.01")) <= 0;
    }

    /**
     * Recalculate totals from child collections.
     * Called before persist/update to ensure consistency.
     */
    public void recalculateTotals() {
        // Sum expenses
        totalCostExpenses = depenses.stream()
            .map(d -> d.cout != null ? d.cout : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Sum other financing
        totalOtherFinancing = financementAutre.stream()
            .map(f -> f.montant != null ? f.montant : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Check balance
        isBalanced = calculateIsBalanced();

        if (!isBalanced) {
            BigDecimal expected = requestedAmount != null ? requestedAmount : BigDecimal.ZERO;
            BigDecimal difference = totalCostExpenses.subtract(expected.add(totalOtherFinancing));
            balanceMessage = String.format(
                "Imbalanced: Total expenses %.2f TND but financing %.2f TND (diff: %.2f TND)",
                totalCostExpenses,
                expected.add(totalOtherFinancing),
                difference.abs()
            );
        } else {
            balanceMessage = null;
        }
    }
}
