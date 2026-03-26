package GestionnaireMicroservice.entities;
import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "gestionnaires")
public class Gestionnaires extends PanacheEntity {

    @Column(name = "uuid", unique = true, nullable = false, updatable = false)
    public String uuid;                    // UUID comme identifiant métier

    @Column(name = "cin", unique = true, nullable = false, length = 8)
    public String cin;

    @Column(name = "first_name", nullable = false)
    public String firstName;

    @Column(name = "last_name", nullable = false)
    public String lastName;

    @Column(name = "email", unique = true, nullable = false)
    public String email;

    @Column(name = "num_telephone", length = 20)
    public String numTelephone;

    @Column(name = "date_of_birth")
    public LocalDate dateOfBirth;

    @Column(name = "address")
    public String address;

    @Column(name = "password")
    public String password;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "agence_id", nullable = false)
    public Agence agence;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    public Role role;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    public Gestionnaires() {}

    // Méthode appelée automatiquement avant la sauvegarde
    @PrePersist
    @PreUpdate
    public void prePersist() {
        this.updatedAt = LocalDateTime.now();
        if (this.uuid == null || this.uuid.isBlank()) {
            this.uuid = java.util.UUID.randomUUID().toString();
        }

    }
}
