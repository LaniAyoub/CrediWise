package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Step 5 (Risque Financier) snapshot data for a dossier.
 * Empty placeholder for financial analysis with 7 sub-sections.
 */
@Entity
@Table(
    name = "step_risque_financier",
    indexes = {
        @Index(name = "idx_step_risque_financier_dossier_id", columnList = "dossier_id"),
        @Index(name = "idx_step_risque_financier_confirmed_at", columnList = "confirmed_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@EqualsAndHashCode(of = "id", callSuper = false)
public class StepRisqueFinancier extends PanacheEntity {

    @NotNull
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", unique = true, nullable = false)
    public AnalyseDossier dossier;

    // ─────────────────────────────────────────────────────────────
    // 7 TAB SECTIONS (empty placeholders)
    // ─────────────────────────────────────────────────────────────

    @Column(name = "notes", columnDefinition = "TEXT")
    public String notes;

    // ─────────────────────────────────────────────────────────────
    // CONFIRMATION TRACKING
    // ─────────────────────────────────────────────────────────────

    @Column(name = "confirmed_by", columnDefinition = "uuid")
    public UUID confirmedBy;

    @Column(name = "confirmed_by_name", length = 200)
    public String confirmedByName;

    @Column(name = "confirmed_at")
    public LocalDateTime confirmedAt;

    @NotNull
    @Column(name = "is_complete", nullable = false)
    public Boolean isComplete = false;

    // ─────────────────────────────────────────────────────────────
    // AUDIT
    // ─────────────────────────────────────────────────────────────

    @Column(name = "last_edited_by", columnDefinition = "uuid")
    public UUID lastEditedBy;

    @Column(name = "last_edited_by_name", length = 200)
    public String lastEditedByName;

    @Column(name = "last_edited_at")
    public LocalDateTime lastEditedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    public LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    // ─────────────────────────────────────────────────────────────
    // Finders
    // ─────────────────────────────────────────────────────────────

    public static java.util.Optional<StepRisqueFinancier> findByDossierId(Long dossierId) {
        return find("dossier.id", dossierId).firstResultOptional();
    }
}
