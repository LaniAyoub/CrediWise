package ClientMicroservice.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "sub_activities")
public class SubActivity extends PanacheEntityBase {

    @Id
    public Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id")
    public Activity activity;

    public String libelle;
    public String wording;

    public String ifcLevelOfRisk;
}
