package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Step 4: Risque Commercial — analyst-entered business risk data.
 */
@Entity
@Table(name = "step_risque_commercial")
public class StepRisqueCommercial extends PanacheEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", nullable = false)
    public AnalyseDossier dossier;

    // ── Section 1: Information Activités ─────────────────────────────────────
    @Column(name = "nb_annees_experience_employe")
    public Integer nbAnneesExperienceEmploye;

    @Column(name = "nb_annees_experience_manager")
    public Integer nbAnneesExperienceManager;

    @Column(name = "autres_activites")
    public Boolean autresActivites;

    @Column(name = "vente_a_credit")
    public Boolean venteACredit;

    // ── Section 2: Points de vente ────────────────────────────────────────────
    @OneToMany(mappedBy = "stepRisqueCommercial", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordre ASC")
    public List<PointDeVente> pointsDeVente = new ArrayList<>();

    // ── Section 2: Description ────────────────────────────────────────────────
    @Column(name = "description_activite_analyse", columnDefinition = "TEXT")
    public String descriptionActiviteAnalyse;

    // ── Audit ──────────────────────────────────────────────────────────────────
    @Column(name = "is_complete", nullable = false)
    public boolean isComplete = false;

    @Column(name = "confirmed_by")
    public UUID confirmedBy;

    @Column(name = "confirmed_by_name")
    public String confirmedByName;

    @Column(name = "confirmed_at")
    public LocalDateTime confirmedAt;

    @Column(name = "last_edited_by")
    public UUID lastEditedBy;

    @Column(name = "last_edited_by_name")
    public String lastEditedByName;

    @Column(name = "last_edited_at")
    public LocalDateTime lastEditedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    public LocalDateTime createdAt;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    public static Optional<StepRisqueCommercial> findByDossierId(Long dossierId) {
        return find("dossier.id", dossierId).firstResultOptional();
    }
}
