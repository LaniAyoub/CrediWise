package ClientMicroservice.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "agences")

public class Agency extends PanacheEntityBase {
    @Id
    @Column(name = "id_branch")
    public String idBranch;     // code de l'agence (ex: "001")

    @Column(nullable = false)
    public String libelle;      // ex: "Bizerte"

    public String wording;      // ex: "Bizerte Branch" (optionnel)

    public Agency() {}
    public Agency(String idBranch) {
        this.idBranch = idBranch;
    }
}

