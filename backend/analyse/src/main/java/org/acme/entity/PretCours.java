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
 * Step 3 (Risque Client) — Section 4: Current or recent loan.
 * Dynamic list: cascade replaced on each save/confirm.
 */
@Entity
@Table(
    name = "step_pret_cours",
    indexes = {
        @Index(name = "idx_step_pret_cours_step_id", columnList = "step_risque_client_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "stepRisqueClient")
@EqualsAndHashCode(of = "id", callSuper = false)
public class PretCours extends PanacheEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "step_risque_client_id", nullable = false)
    public StepRisqueClient stepRisqueClient;

    @NotNull
    @Column(name = "nom_institution", nullable = false, columnDefinition = "TEXT")
    public String nomInstitution;

    @NotNull
    @Column(nullable = false, columnDefinition = "TEXT")
    public String objet;

    @NotNull
    @Column(name = "duree_en_mois", nullable = false)
    public Integer dureeEnMois;

    @NotNull
    @Column(name = "montant_initial", precision = 15, scale = 2, nullable = false)
    public BigDecimal montantInitial;

    @NotNull
    @Column(name = "encours_solde", precision = 15, scale = 2, nullable = false)
    public BigDecimal encoursSolde;

    @NotNull
    @Column(name = "montant_echeance", precision = 15, scale = 2, nullable = false)
    public BigDecimal montantEcheance;

    @NotNull
    @Column(name = "nombre_echeances_restantes", nullable = false)
    public Integer nombreEcheancesRestantes;

    @NotNull
    @Column(name = "nombre_echeances_retard", nullable = false)
    public Integer nombreEcheancesRetard = 0;

    @NotNull
    @Column(name = "jours_retard_max", nullable = false)
    public Integer joursRetardMax = 0;

    @NotNull
    @Column(nullable = false)
    public Integer ordre = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    public LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;
}
