package CreditRequestMicroservice.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "demandes")
public class Demande extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @Column(name = "client_id", nullable = false)
    public UUID clientId;

    // === OBJET DU CRÉDIT ===
    @Column(length = 2000)
    public String objetDescription;

    public BigDecimal montantDemande;
    public Integer dureeDemandee;
    public String produit;
    public String typeObjet;
    public BigDecimal capaciteRemboursementMensuelle;
    public String canalPriseDemande;

    // === Données client snapshot ===
    public String firstName;
    public String lastName;
    public String sexe;                     // MALE / FEMALE / OTHER
    public String scoreRubyx;
    public String statutKyc;
    public String nomGestionnaire;
    public String cycle;

    // === Consentement & auto ===
    @Column(length = 4000)
    public String texteConsentement;

    public String signataires;
    public LocalDateTime dateCreation;

    public String statut; // DRAFT / SUBMITTED / VALIDATED / REJECTED

    // === Relations ===
    @OneToMany(mappedBy = "demande", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    public List<Guarantor> guarantors = new ArrayList<>();

    @OneToMany(mappedBy = "demande", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    public List<Guarantee> guarantees = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    public LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
        if (statut == null) {
            statut = "DRAFT";
        }
        // Signataires définis automatiquement (logique simple – peut être enrichie via appel au microservice Client si besoin)
        if (signataires == null || signataires.isBlank()) {
            signataires = "Client principal + Gestionnaire (" + (nomGestionnaire != null ? nomGestionnaire : "N/A") + ")";
        }
    }
}
