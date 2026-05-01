package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Step 3 (Risque Client) — Section 1.2: Family reference contact.
 * Dynamic list: cascade replaced on each save/confirm.
 */
@Entity
@Table(
    name = "step_reference_familiale",
    indexes = {
        @Index(name = "idx_step_reference_familiale_step_id", columnList = "step_risque_client_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "stepRisqueClient")
@EqualsAndHashCode(of = "id", callSuper = false)
public class ReferenceFamiliale extends PanacheEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "step_risque_client_id", nullable = false)
    public StepRisqueClient stepRisqueClient;

    @NotNull
    @Column(nullable = false, columnDefinition = "TEXT")
    public String prenom;

    @NotNull
    @Column(nullable = false, columnDefinition = "TEXT")
    public String nom;

    @NotNull
    @Column(length = 20, nullable = false)
    public String telephone;

    @NotNull
    @Column(name = "lien_parente", nullable = false, columnDefinition = "TEXT")
    public String lienParente;

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
