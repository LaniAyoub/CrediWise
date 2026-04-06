package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import lombok.*;

/**
 * Maps to MAPPING_RISQUE_ACTIVITE table.
 * Holds risk level associated with a sector + activity + sub-activity combination.
 */
@Entity
@Table(name = "mapping_risque_activite")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id", callSuper = false)
@ToString
public class MappingRisqueActivite extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_secteur_activite")
    private SecteurActivite secteurActivite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_sous_activite")
    private SousActivite sousActivite;

    @Column(name = "id_niveau")
    private Long niveauId;

    @Column(name = "ifc_level_of_risk")
    private String ifcLevelOfRisk;

    @Column(name = "ifc_level_of_risk_fr")
    private String ifcLevelOfRiskFr;

}
