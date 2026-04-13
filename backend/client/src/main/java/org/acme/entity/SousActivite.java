package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "sous_activite")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id", callSuper = false)
@ToString
public class SousActivite extends PanacheEntityBase {

    @Id
    @Column(name = "id_sous_activite")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_secteur_activite", nullable = false)
    private SecteurActivite secteurActivite;

    @NotBlank
    @Column(nullable = false)
    private String libelle;

    @Column(name = "ifc_level_of_risk")
    private String ifcLevelOfRisk;
}
