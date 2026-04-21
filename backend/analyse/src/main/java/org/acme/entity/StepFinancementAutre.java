package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Step 2 (Credit Object) - Section C: Other Financing Source item.
 * Additional funding sources beyond the main credit request.
 * Optional, can be empty. Multiple items per dossier.
 */
@Entity
@Table(
    name = "step_financement_autre",
    indexes = {
        @Index(name = "idx_step_financement_autre_step_credit_id", columnList = "step_objet_credit_id")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_step_financement_ordre", columnNames = {"step_objet_credit_id", "ordre"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "stepObjetCredit")
@EqualsAndHashCode(of = "id", callSuper = false)
public class StepFinancementAutre extends PanacheEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "step_objet_credit_id", nullable = false)
    public StepObjetCredit stepObjetCredit;

    @NotNull
    @Column(columnDefinition = "TEXT", nullable = false)
    public String description;

    @NotNull
    @Column(name = "montant", precision = 15, scale = 2, nullable = false)
    public BigDecimal montant;

    @NotNull
    @Column(name = "ordre", nullable = false)
    public Integer ordre;  // Display order (1-based)

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

    public static java.util.List<StepFinancementAutre> findByStepCreditId(Long stepCreditId) {
        return find("stepObjetCredit.id = ?1 ORDER BY ordre", stepCreditId).list();
    }

    public static java.util.Optional<StepFinancementAutre> findByIdAndStepCredit(Long financementId, Long stepCreditId) {
        return find("id = ?1 AND stepObjetCredit.id = ?2", financementId, stepCreditId)
            .firstResultOptional();
    }
}
