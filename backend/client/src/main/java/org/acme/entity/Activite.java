package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Entity
@Table(name = "activite")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id", callSuper = false)
@ToString
public class Activite extends PanacheEntityBase {

    @Id
    @Column(name = "id_activite")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_secteur_activite", nullable = false)
    private SecteurActivite secteurActivite;

    @NotBlank
    @Column(nullable = false)
    private String libelle;

    @NotNull
    @Column(name = "id_niveau", nullable = false)
    private Integer idNiveau;
}
