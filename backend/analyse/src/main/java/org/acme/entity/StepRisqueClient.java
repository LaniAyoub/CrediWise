package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.acme.entity.enums.NoteCentraleRisque;
import org.acme.entity.enums.SituationFamiliale;
import org.acme.entity.enums.SituationLogement;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Step 3 (Risque Client) master record for a dossier.
 * Pure analyst input — no gRPC calls required.
 * Contains cascade relationships to the 3 dynamic lists.
 */
@Entity
@Table(
    name = "step_risque_client",
    indexes = {
        @Index(name = "idx_step_risque_client_dossier_id", columnList = "dossier_id"),
        @Index(name = "idx_step_risque_client_confirmed_at", columnList = "confirmed_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"dossier", "referenceFamiliales", "enquetesMoralite", "pretsCours"})
@EqualsAndHashCode(of = "id", callSuper = false)
public class StepRisqueClient extends PanacheEntity {

    @NotNull
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", unique = true, nullable = false)
    public AnalyseDossier dossier;

    // ─────────────────────────────────────────────────────────────
    // SECTION 1.1: Situation du client
    // ─────────────────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "situation_familiale", length = 20)
    public SituationFamiliale situationFamiliale;

    @Column(name = "situation_familiale_autre", columnDefinition = "TEXT")
    public String situationFamilialeAutre;

    @Enumerated(EnumType.STRING)
    @Column(name = "situation_logement", length = 25)
    public SituationLogement situationLogement;

    @Column(name = "situation_logement_autre", columnDefinition = "TEXT")
    public String situationLogementAutre;

    @Column(name = "duree_sejour")
    public Integer dureeSejour;

    @Column(name = "anciennete_quartier")
    public Integer ancienneteQuartier;

    @Column(name = "nombre_personnes_charge")
    public Integer nombrePersonnesCharge;

    @Column(name = "nombre_enfants")
    public Integer nombreEnfants;

    // ─────────────────────────────────────────────────────────────
    // SECTION 1.2: Références familiales (dynamic list)
    // ─────────────────────────────────────────────────────────────

    @OneToMany(mappedBy = "stepRisqueClient", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("ordre ASC")
    public List<ReferenceFamiliale> referenceFamiliales = new ArrayList<>();

    // ─────────────────────────────────────────────────────────────
    // SECTION 2.1: Enquêtes de moralité (dynamic list)
    // ─────────────────────────────────────────────────────────────

    @OneToMany(mappedBy = "stepRisqueClient", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("ordre ASC")
    public List<EnqueteMoralite> enquetesMoralite = new ArrayList<>();

    // ─────────────────────────────────────────────────────────────
    // SECTION 2.2: Avis comité
    // ─────────────────────────────────────────────────────────────

    @Column(name = "avis_comite", columnDefinition = "TEXT")
    public String avisComite;

    // ─────────────────────────────────────────────────────────────
    // SECTION 3: Historique crédit / Centrale des Risques
    // ─────────────────────────────────────────────────────────────

    @Column(name = "nombre_credits_anterieurs")
    public Integer nombreCreditsAnterieurs;

    @Enumerated(EnumType.STRING)
    @Column(name = "note_centrale_risque", length = 1)
    public NoteCentraleRisque noteCentraleRisque;

    @Column(name = "est_garant")
    public Boolean estGarant;

    // ─────────────────────────────────────────────────────────────
    // SECTION 4: Prêts en cours (dynamic list)
    // ─────────────────────────────────────────────────────────────

    @OneToMany(mappedBy = "stepRisqueClient", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("ordre ASC")
    public List<PretCours> pretsCours = new ArrayList<>();

    // ─────────────────────────────────────────────────────────────
    // SECTION 4.1: Analyse crédit
    // ─────────────────────────────────────────────────────────────

    @Column(name = "analyse_credit", columnDefinition = "TEXT")
    public String analyseCredit;

    // ─────────────────────────────────────────────────────────────
    // SECTION 5: Comptes bancaires du client (dynamic list)
    // ─────────────────────────────────────────────────────────────

    @OneToMany(mappedBy = "stepRisqueClient", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("ordre ASC")
    public List<CompteBancaire> comptesBancaires = new ArrayList<>();

    // ─────────────────────────────────────────────────────────────
    // SECTION 5.1: Analyse de l'utilisation des comptes
    // ─────────────────────────────────────────────────────────────

    @Column(name = "analyse_comptes", columnDefinition = "TEXT")
    public String analyseComptes;

    // ─────────────────────────────────────────────────────────────
    // CONFIRMATION TRACKING
    // ─────────────────────────────────────────────────────────────

    @NotNull
    @Column(name = "is_complete", nullable = false)
    public Boolean isComplete = false;

    @Column(name = "confirmed_by", columnDefinition = "uuid")
    public UUID confirmedBy;

    @Column(name = "confirmed_by_name", length = 200)
    public String confirmedByName;

    @Column(name = "confirmed_at")
    public LocalDateTime confirmedAt;

    @Column(name = "last_edited_by", columnDefinition = "uuid")
    public UUID lastEditedBy;

    @Column(name = "last_edited_by_name", length = 200)
    public String lastEditedByName;

    @Column(name = "last_edited_at")
    public LocalDateTime lastEditedAt;

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

    public static Optional<StepRisqueClient> findByDossierId(Long dossierId) {
        return find("dossier.id", dossierId).firstResultOptional();
    }
}
