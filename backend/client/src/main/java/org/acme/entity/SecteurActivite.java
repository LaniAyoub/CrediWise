package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "secteur_activite")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id", callSuper = false)
@ToString
public class SecteurActivite extends PanacheEntityBase {

    @Id
    @Column(name = "id_secteur_activite")
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String libelle;

}
