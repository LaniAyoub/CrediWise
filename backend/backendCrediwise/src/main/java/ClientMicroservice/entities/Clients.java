package ClientMicroservice.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "clients")
public class Clients extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "client_type")
    public TypeClient clientType;           // PHYSIQUE ou MORALE

    public String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "segment_id")
    public Segment segment;

    public String scoring;
    public String Cin;

    public String firstName;
    public String lastName;
    public String companyName;
    public String registrationNumber;       // Matricule fiscal / registre commerce
    public String nationalId;               // CIN ou équivalent
    public LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(name = "nationality")
    public Nationality nationality;

    public String taxIdentifier;

    public String sexe;                     // MALE / FEMALE / OTHER

    public String email;
    public String primaryPhone;
    public String secondaryPhone;

    public String addressStreet;
    public String addressCity;
    public String addressPostal;
    public String addressCountry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agency_id")
    public Agency agency;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sector_activity_id")
    public SectorActivity sectorActivity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sub_activity_id")
    public SubActivity subActivity;

    @Enumerated(EnumType.STRING)
    @Column(name = "cycle")
    public Cycle cycle;

    @Column(name = "assigned_manager_id")
    public String assignedManager;

    @Column(name = "principal_interlocutor_id")
    public String principalInterlocutor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_situation_id")
    public FamilySituation familySituation;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    public LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    public int version;

    public Clients() {
    }
    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}