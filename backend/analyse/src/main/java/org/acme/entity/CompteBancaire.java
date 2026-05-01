package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
    name = "compte_bancaire",
    indexes = {
        @Index(name = "idx_compte_bancaire_step_id", columnList = "step_risque_client_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "stepRisqueClient")
public class CompteBancaire extends PanacheEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "step_risque_client_id", nullable = false)
    public StepRisqueClient stepRisqueClient;

    @Column(name = "banque_imf", length = 200, nullable = false)
    public String banqueImf;

    @Column(name = "type_compte", length = 100, nullable = false)
    public String typeCompte;

    @Column(name = "solde", precision = 15, scale = 2)
    public BigDecimal solde;

    @Column(name = "ordre")
    public Integer ordre;
}
