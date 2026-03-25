package ClientMicroservice.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "secteurs_activite")
public class SecteurActivite extends PanacheEntity {

    @Column(name = "idsecteur", nullable = false)
    public Long idSecteur;         // 97000, 97100...

    @Column(length = 100, nullable = false)
    public String libelle;

    public SecteurActivite() {}
}
