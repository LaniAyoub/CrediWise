package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.acme.entity.enums.DecisionType;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Audit table for scoring results.
 * Stores each scoring calculation for traceability and history.
 * UNIQUE constraint on demande_id — only the latest score is kept per demand.
 */
@Entity
@Table(
    name = "scoring_results",
    indexes = {
        @Index(name = "idx_scoring_demande", columnList = "demande_id"),
        @Index(name = "idx_scoring_client", columnList = "client_id"),
        @Index(name = "idx_scoring_decision", columnList = "decision_systeme")
    }
)
@SequenceGenerator(
    name = "scoring_results_seq_gen",
    sequenceName = "scoring_results_seq",
    initialValue = 1,
    allocationSize = 50
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@EqualsAndHashCode(of = "id", callSuper = false)
public class ScoringResult extends PanacheEntity {

    @NotNull
    @Column(name = "demande_id", nullable = false)
    public Long demandeId;

    @Column(name = "client_id", columnDefinition = "uuid")
    public UUID clientId;

    // ─────────────────────────────────────────────────────────────
    // I. DRG (Rules of Management — Règles de Gestion)
    // ─────────────────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "drg_age", length = 20)
    public DecisionType drgAge;

    @Enumerated(EnumType.STRING)
    @Column(name = "drg_anciennete", length = 20)
    public DecisionType drgAnciennete;

    @Enumerated(EnumType.STRING)
    @Column(name = "drg_budget", length = 20)
    public DecisionType drgBudget;

    @Enumerated(EnumType.STRING)
    @Column(name = "drg_fichage", length = 20)
    public DecisionType drgFichage;

    @Enumerated(EnumType.STRING)
    @Column(name = "drg_offre", length = 20)
    public DecisionType drgOffre;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "drg_decision", length = 20, nullable = false)
    public DecisionType drgDecision;

    // ─────────────────────────────────────────────────────────────
    // II. DSS (Statistical Scoring System — Décision Système Scoring)
    // ─────────────────────────────────────────────────────────────

    @Column(name = "score_brut", precision = 12, scale = 5)
    public BigDecimal scoreBrut;

    @Column(name = "score_ajuste", precision = 8, scale = 3)
    public BigDecimal scoreAjuste;

    @Enumerated(EnumType.STRING)
    @Column(name = "dss_decision", length = 20)
    public DecisionType dssDecision;

    // ─────────────────────────────────────────────────────────────
    // III. System Decision
    // ─────────────────────────────────────────────────────────────

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "decision_systeme", length = 20, nullable = false)
    public DecisionType decisionSysteme;

    // ─────────────────────────────────────────────────────────────
    // Score Details Breakdown
    // ─────────────────────────────────────────────────────────────

    /**
     * Contribution breakdown of each variable to the score (JSON format).
     * Keys: constante, age_group, cat_mat, cred_amt_group,
     *       cred_taux_group, duree_pret_group, isepa, salaire_group
     * Values: numeric contribution to the raw score
     */
    @Column(name = "score_details", columnDefinition = "jsonb")
    @org.hibernate.annotations.JdbcTypeCode(SqlTypes.JSON)
    public String scoreDetails;

    // ─────────────────────────────────────────────────────────────
    // AUDIT
    // ─────────────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "scored_at", nullable = false, updatable = false)
    public LocalDateTime scoredAt;

    @Column(name = "created_by", columnDefinition = "uuid")
    public UUID createdBy;

    // ─────────────────────────────────────────────────────────────
    // Finders
    // ─────────────────────────────────────────────────────────────

    public static java.util.Optional<ScoringResult> findByDemandeId(Long demandeId) {
        return find("demandeId", demandeId).firstResultOptional();
    }
}
