package ClientMicroservice.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "sector_activities")
public class SectorActivity extends PanacheEntityBase {

    @Id
    public Integer id;

    public String libelle;
    public String wording;
}