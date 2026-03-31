package ClientMicroservice.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "segments")
public class Segment extends PanacheEntityBase {

    @Id
    public Integer id;

    @Column(name = "libelle", nullable = false, length = 100)
    public String libelle;          // ex: "Courant"

    @Column(name = "wording", length = 100)
    public String wording;          // ex: "Current"

    public Segment() {}
}