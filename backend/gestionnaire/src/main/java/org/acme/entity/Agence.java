package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "agences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@EqualsAndHashCode(of = "idBranch", callSuper = false)
public class Agence extends PanacheEntityBase {

    @Id
    @Column(name = "id_branch", nullable = false, length = 10)
    private String idBranch;     // code de l'agence (ex: "001")

    @Column(nullable = false, length = 100)
    private String libelle;

    @Column(length = 200)
    private String wording;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}