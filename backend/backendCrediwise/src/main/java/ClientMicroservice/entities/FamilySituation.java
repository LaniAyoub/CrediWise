package ClientMicroservice.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "family_situations")
public class FamilySituation extends PanacheEntityBase {

    @Id
    public Integer id;

    public String code;         // A, C, D, M, S, V
    public String libelle;      // CELIBATAIRE, MARIE(E), etc.
    public String wording;      // SINGLE, MARRIED, etc.
}