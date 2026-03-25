package ClientMicroservice.entities;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
@Entity
@Table(name = "activites")
public class Activite extends PanacheEntity {

    @Column(name = "id_activite", nullable = false)
    public Integer idActivite;

    @Column(length = 100)
    public String libelle;

    @ManyToOne
    public SecteurActivite secteur;

    public Activite() {}
}
