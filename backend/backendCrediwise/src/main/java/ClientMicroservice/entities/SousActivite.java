package ClientMicroservice.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "sous_activites")
public class SousActivite extends PanacheEntity {

    @Column(name = "id_sous_activite", nullable = false)
    public Integer idSousActivite;

    public String libelle;

    public String wording;

    @ManyToOne
    public Activite activite;

    public SousActivite() {}
}