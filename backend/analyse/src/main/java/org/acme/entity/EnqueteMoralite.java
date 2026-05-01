package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Step 3 (Risque Client) — Section 2.1: Morality enquiry contact.
 * Dynamic list: cascade replaced on each save/confirm.
 */
@Entity
@Table(
    name = "step_enquete_moralite",
    indexes = {
        @Index(name = "idx_step_enquete_moralite_step_id", columnList = "step_risque_client_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "stepRisqueClient")
@EqualsAndHashCode(of = "id", callSuper = false)
public class EnqueteMoralite extends PanacheEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "step_risque_client_id", nullable = false)
    public StepRisqueClient stepRisqueClient;

    @NotNull
    @Column(name = "lien_avec_client", nullable = false, columnDefinition = "TEXT")
    public String lienAvecClient;

    @NotNull
    @Column(length = 20, nullable = false)
    public String contact;

    @NotNull
    @Column(name = "nom_complet", nullable = false, columnDefinition = "TEXT")
    public String nomComplet;

    // nullable — how long the contact has known the client
    @Column(columnDefinition = "TEXT")
    public String amplitude;

    @NotNull
    @Column(nullable = false, columnDefinition = "TEXT")
    public String opinion;

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
