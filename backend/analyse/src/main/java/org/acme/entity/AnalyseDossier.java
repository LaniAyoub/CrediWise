package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.acme.entity.enums.DossierStatus;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Top-level analysis dossier for a credit demande.
 * Tracks the 7-step credit analysis workflow.
 */
@Entity
@Table(
    name = "analyse_dossier",
    indexes = {
        @Index(name = "idx_dossier_demande_id", columnList = "demande_id", unique = true),
        @Index(name = "idx_dossier_client_id", columnList = "client_id"),
        @Index(name = "idx_dossier_gestionnaire_id", columnList = "gestionnaire_id"),
        @Index(name = "idx_dossier_status", columnList = "status")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@EqualsAndHashCode(of = "id", callSuper = false)
public class AnalyseDossier extends PanacheEntity {

    @NotNull
    @Column(name = "demande_id", unique = true, nullable = false)
    public Long demandeId;

    @NotNull
    @Column(name = "client_id", nullable = false)
    public UUID clientId;

    @NotNull
    @Column(name = "gestionnaire_id", nullable = false, columnDefinition = "uuid")
    public UUID gestionnaireId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    public DossierStatus status = DossierStatus.DRAFT;

    @NotNull
    @Column(name = "current_step", nullable = false)
    public Integer currentStep = 1;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    public LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @Column(name = "completed_at")
    public LocalDateTime completedAt;

    @Column(name = "demande_created_at")
    public LocalDateTime demandeCreatedAt;

    // ─────────────────────────────────────────────────────────────
    // Finders
    // ─────────────────────────────────────────────────────────────

    public static java.util.Optional<AnalyseDossier> findByDemandeId(Long demandeId) {
        return find("demandeId", demandeId).firstResultOptional();
    }

    public static java.util.List<AnalyseDossier> findByGestionnaireId(UUID gestionnaireId) {
        return find("gestionnaireId", gestionnaireId).list();
    }

    public static java.util.List<AnalyseDossier> findAllActive() {
        // Find dossiers in analysis phase (not yet completed or rejected)
        return find("status IN ?1", java.util.Arrays.asList(
            DossierStatus.SUBMITTED,
            DossierStatus.ANALYSE,
            DossierStatus.CHECK_BEFORE_COMMITTEE,
            DossierStatus.CREDIT_RISK_ANALYSIS,
            DossierStatus.COMMITTEE,
            DossierStatus.WAITING_CLIENT_APPROVAL,
            DossierStatus.READY_TO_DISBURSE
        )).list();
    }
}
