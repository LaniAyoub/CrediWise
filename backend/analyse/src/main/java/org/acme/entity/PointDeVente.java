package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

import java.math.BigDecimal;

/**
 * One row in the "Points de vente" table within Step 4 (Risque Commercial).
 */
@Entity
@Table(name = "point_de_vente")
public class PointDeVente extends PanacheEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "step_risque_commercial_id", nullable = false)
    public StepRisqueCommercial stepRisqueCommercial;

    public String type;

    public String propriete;

    @Column(name = "jours_ouverture")
    public String joursOuverture;

    @Column(name = "horaire_ouverture", length = 10)
    public String horaireOuverture;

    @Column(precision = 10, scale = 2)
    public BigDecimal surface;

    @Column(columnDefinition = "TEXT")
    public String emplacement;

    @Column(nullable = false)
    public Integer ordre = 0;
}
