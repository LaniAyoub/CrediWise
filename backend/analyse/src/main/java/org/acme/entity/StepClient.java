package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Step 1 (Client) snapshot data for a dossier.
 * Stores a complete snapshot of client information at the time of analysis.
 */
@Entity
@Table(
    name = "step_client",
    indexes = {
        @Index(name = "idx_step_client_dossier_id", columnList = "dossier_id"),
        @Index(name = "idx_step_client_confirmed_at", columnList = "confirmed_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@EqualsAndHashCode(of = "id", callSuper = false)
public class StepClient extends PanacheEntity {

    @NotNull
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", unique = true, nullable = false)
    public AnalyseDossier dossier;

    // ─────────────────────────────────────────────────────────────
    // CLIENT SNAPSHOT (from client service)
    // ─────────────────────────────────────────────────────────────

    // Identity
    @Column(name = "client_id", columnDefinition = "uuid")
    public UUID clientId;

    @Column(name = "client_type", length = 10)
    public String clientType;

    @Column(name = "status", length = 20)
    public String status;

    // Physical person fields
    @Column(name = "first_name", length = 100)
    public String firstName;

    @Column(name = "last_name", length = 100)
    public String lastName;

    @Column(name = "date_of_birth")
    public LocalDate dateOfBirth;

    @Column(name = "national_id", length = 50)
    public String nationalId;

    @Column(name = "tax_identifier", length = 50)
    public String taxIdentifier;

    @Column(name = "gender", length = 10)
    public String gender;

    @Column(name = "situation_familiale", length = 20)
    public String situationFamiliale;

    @Column(name = "nationality", length = 100)
    public String nationality;

    @Column(name = "monthly_income", precision = 15, scale = 3)
    public BigDecimal monthlyIncome;

    // Legal entity fields
    @Column(name = "company_name", length = 200)
    public String companyName;

    @Column(name = "sigle", length = 50)
    public String sigle;

    @Column(name = "registration_number", length = 100)
    public String registrationNumber;

    @Column(name = "principal_interlocutor", length = 200)
    public String principalInterlocutor;

    // Contact
    @Column(name = "email", length = 150)
    public String email;

    @Column(name = "primary_phone", length = 30)
    public String primaryPhone;

    @Column(name = "secondary_phone", length = 30)
    public String secondaryPhone;

    @Column(name = "address_street", length = 255)
    public String addressStreet;

    @Column(name = "address_city", length = 100)
    public String addressCity;

    @Column(name = "address_postal", length = 20)
    public String addressPostal;

    @Column(name = "address_country", length = 100)
    public String addressCountry;

    // References (local IDs from client service)
    @Column(name = "segment_id")
    public Long segmentId;

    @Column(name = "account_type_id")
    public Long accountTypeId;

    @Column(name = "secteur_activite_id")
    public Long secteurActiviteId;

    @Column(name = "sous_activite_id")
    public Long sousActiviteId;

    @Column(name = "mapping_risque_activite_id")
    public Long mappingRisqueActiviteId;

    @Column(name = "ifc_level_of_risk", length = 100)
    public String ifcLevelOfRisk;

    // Resolved labels (display names from reference tables)
    @Column(name = "segment_name", length = 200)
    public String segmentName;

    @Column(name = "account_type_name", length = 200)
    public String accountTypeName;

    @Column(name = "business_sector_name", length = 200)
    public String businessSectorName;

    @Column(name = "business_activity_group_name", length = 200)
    public String businessActivityGroupName;

    @Column(name = "business_activity_name", length = 200)
    public String businessActivityName;

    // External references
    @Column(name = "agence_id", length = 10)
    public String agenceId;

    @Column(name = "assigned_manager_id", columnDefinition = "uuid")
    public UUID assignedManagerId;

    // Other fields
    @Column(name = "relation_avec_client", length = 20)
    public String relationAvecClient;

    @Column(name = "relation_avec_client_other", length = 150)
    public String relationAvecClientOther;

    @Column(name = "account_number", length = 20)
    public String accountNumber;

    @Column(name = "account_type_custom_name", length = 120)
    public String accountTypeCustomName;

    @Column(name = "scoring", length = 50)
    public String scoring;

    @Column(name = "cycle", length = 50)
    public String cycle;

    @Column(name = "cbs_id", length = 100)
    public String cbsId;

    // Audit from client service
    @Column(name = "client_created_at")
    public LocalDateTime clientCreatedAt;

    @Column(name = "client_updated_at")
    public LocalDateTime clientUpdatedAt;

    // ─────────────────────────────────────────────────────────────
    // AGENCE SNAPSHOT (from gestionnaire service)
    // ─────────────────────────────────────────────────────────────

    @Column(name = "agence_id_branch", length = 10)
    public String agenceIdBranch;

    @Column(name = "agence_libelle", length = 100)
    public String agenceLibelle;

    @Column(name = "agence_wording", length = 200)
    public String agenceWording;

    @Column(name = "agence_is_active")
    public Boolean agenceIsActive;

    // ─────────────────────────────────────────────────────────────
    // CREDIT HISTORY (JSON snapshot)
    // ─────────────────────────────────────────────────────────────

    @Column(name = "historique_credits", columnDefinition = "TEXT")
    public String historiqueCreditJson;

    @Column(name = "nombre_demandes_passees")
    public Integer nombreDemandesPassees = 0;

    @Column(name = "nombre_demandes_approuvees")
    public Integer nombreDemandesApprouvees = 0;

    @Column(name = "nombre_demandes_rejetees")
    public Integer nombreDemandesRejetees = 0;

    // ─────────────────────────────────────────────────────────────
    // CONFIRMATION TRACKING
    // ─────────────────────────────────────────────────────────────

    @Column(name = "confirmed_by", columnDefinition = "uuid")
    public UUID confirmedBy;

    @Column(name = "confirmed_by_name", length = 200)
    public String confirmedByName;

    @Column(name = "confirmed_at")
    public LocalDateTime confirmedAt;

    @Column(name = "data_fetched_at")
    public LocalDateTime dataFetchedAt;

    @NotNull
    @Column(name = "is_complete", nullable = false)
    public Boolean isComplete = false;

    // ─────────────────────────────────────────────────────────────
    // SERVICE AVAILABILITY FLAGS
    // ─────────────────────────────────────────────────────────────

    @Column(name = "agence_data_available")
    public Boolean agenceDataAvailable = true;

    @Column(name = "warning_message", length = 500)
    public String warningMessage;

    // ─────────────────────────────────────────────────────────────
    // USER INPUT
    // ─────────────────────────────────────────────────────────────

    /** Activité client — business/activity location noted by analyst */
    @Column(name = "location", length = 500)
    public String location;

    /** Domicile client — home/domicile location noted by analyst */
    @Column(name = "location_domicile", length = 500)
    public String locationDomicile;

    /** Date de visite — date the analyst visited the client */
    @Column(name = "date_visite")
    public LocalDate dateVisite;

    /** Date de finalisation — date the analysis was finalised */
    @Column(name = "date_finalisation")
    public LocalDate dateFinalisation;

    // ─────────────────────────────────────────────────────────────
    // ASSIGNED MANAGER INFO
    // ─────────────────────────────────────────────────────────────

    @Column(name = "assigned_manager_name", length = 200)
    public String assignedManagerName;

    @Column(name = "assigned_manager_email", length = 150)
    public String assignedManagerEmail;

    @Column(name = "assigned_manager_role", length = 50)
    public String assignedManagerRole;

    // ─────────────────────────────────────────────────────────────
    // AUDIT
    // ─────────────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    public LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    // ─────────────────────────────────────────────────────────────
    // Finders
    // ─────────────────────────────────────────────────────────────

    public static java.util.Optional<StepClient> findByDossierId(Long dossierId) {
        return find("dossier.id", dossierId).firstResultOptional();
    }
}
