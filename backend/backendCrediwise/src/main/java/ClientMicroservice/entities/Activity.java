package ClientMicroservice.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "activities")
public class Activity extends PanacheEntityBase {

    @Id
    public Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sector_activity_id")
    public SectorActivity sectorActivity;

    public String libelle;
    public String wording;
    public String ifcLevelOfRisk;

}
