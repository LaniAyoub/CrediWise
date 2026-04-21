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
 * Step 2 (Credit Object) - Section B: Project Expense item.
 * Part of the cost breakdown for credit analysis.
 * Multiple items per dossier, minimum 1 required.
 */
@Entity
@Table(
    name = "step_depense_projet",
    indexes = {
        @Index(name = "idx_step_depense_projet_step_credit_id", columnList = "step_objet_credit_id"),
        @Index(name = "idx_step_depense_projet_categorie", columnList = "categorie")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_step_depense_ordre", columnNames = {"step_objet_credit_id", "ordre"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "stepObjetCredit")
@EqualsAndHashCode(of = "id", callSuper = false)
public class StepDépenseProjet extends PanacheEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "step_objet_credit_id", nullable = false)
    public StepObjetCredit stepObjetCredit;

    @NotNull
    @Column(name = "categorie", length = 50, nullable = false)
    public String categorie;  // Enum value (TERRAIN_BATIMENT, EQUIPEMENT, etc.)

    @NotNull
    @Column(columnDefinition = "TEXT", nullable = false)
    public String description;

    @NotNull
    @Column(name = "cout", precision = 15, scale = 2, nullable = false)
    public BigDecimal cout;

    @NotNull
    @Column(name = "ordre", nullable = false)
    public Integer ordre;  // Display order (1-based, cascade reorder)

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

    public static java.util.List<StepDépenseProjet> findByStepCreditId(Long stepCreditId) {
        return find("stepObjetCredit.id = ?1 ORDER BY ordre", stepCreditId).list();
    }

    public static java.util.Optional<StepDépenseProjet> findByIdAndStepCredit(Long depenseId, Long stepCreditId) {
        return find("id = ?1 AND stepObjetCredit.id = ?2", depenseId, stepCreditId)
            .firstResultOptional();
    }
}
