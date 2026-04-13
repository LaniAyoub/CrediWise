package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.acme.entity.enums.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(
    name = "clients",
    indexes = {
        @Index(name = "idx_client_email",        columnList = "email",         unique = true),
        @Index(name = "idx_client_national_id",  columnList = "national_id",   unique = true),
        @Index(name = "idx_client_cbs_id",       columnList = "cbs_id",        unique = true),
        @Index(name = "idx_client_type",         columnList = "client_type"),
        @Index(name = "idx_client_status",       columnList = "status"),
        @Index(name = "idx_client_agence",       columnList = "agence_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "attributes")
@EqualsAndHashCode(of = "id", callSuper = false)
public class Client extends PanacheEntityBase {

    // ─────────────────────────────────────────────
    // Identity
    // ─────────────────────────────────────────────

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    /**
     * PHYSICAL or LEGAL (personne physique / morale).
     */
    @NotNull(message = "Client type is mandatory")
    @Enumerated(EnumType.STRING)
    @Column(name = "client_type", nullable = false, length = 10)
    private ClientType clientType;

    @NotNull(message = "Status is mandatory")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ClientStatus status;

    // ─────────────────────────────────────────────
    // Person fields (PHYSICAL clients)
    // ─────────────────────────────────────────────

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "national_id", length = 50, unique = true)
    private String nationalId;

    @Column(name = "tax_identifier", length = 50)
    private String taxIdentifier;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Gender gender;

    @Enumerated(EnumType.STRING)
    @Column(name = "situation_familiale", length = 20)
    private SituationFamiliale situationFamiliale;

    @Column(length = 100)
    private String nationality;

    @DecimalMin(value = "0.0", message = "Monthly income must be positive")
    @Column(name = "monthly_income", precision = 15, scale = 3)
    private BigDecimal monthlyIncome;

    // ─────────────────────────────────────────────
    // Company fields (LEGAL clients)
    // ─────────────────────────────────────────────

    @Column(name = "company_name", length = 200)
    private String companyName;

    /**
     * sigle / sigle for the company.
     */
    @Column(name = "sigle", length = 50)
    private String sigle;

    @Column(name = "registration_number", length = 100)
    private String registrationNumber;

    /**
     * Principal contact person inside the company.
     */
    @Column(name = "principal_interlocutor", length = 200)
    private String principalInterlocutor;

    // ─────────────────────────────────────────────
    // Contact & address
    // ─────────────────────────────────────────────

    @Email(message = "Email should be valid")
    @Column(unique = true, length = 150)
    private String email;

    @Column(name = "primary_phone", length = 30)
    private String primaryPhone;

    @Column(name = "secondary_phone", length = 30)
    private String secondaryPhone;

    @Column(name = "address_street", length = 255)
    private String addressStreet;

    @Column(name = "address_city", length = 100)
    private String addressCity;

    @Column(name = "address_postal", length = 20)
    private String addressPostal;

    @Column(name = "address_country", length = 100)
    private String addressCountry;

    // ─────────────────────────────────────────────
    // References to local tables
    // ─────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "segment_id")
    private Segment segment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_type_id")
    private AccountType accountType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "secteur_activite_id")
    private SecteurActivite secteurActivite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sous_activite_id")
    private SousActivite sousActivite;

    

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mapping_risque_activite_id")
    private MappingRisqueActivite riskLevel;

    // ─────────────────────────────────────────────
    // References to external microservice (gestionnaire_db)
    // Stored as IDs only — names resolved via Feign/REST client
    // ─────────────────────────────────────────────

    /**
     * ID of the branch (agences.id_branch). Display libelle via gestionnaire service.
     */
    @Column(name = "agence_id", length = 10)
    private String agenceId;

    /**
     * ID of the assigned manager (gestionnaires.id). Resolved via gestionnaire service.
     */
    @Column(name = "assigned_manager_id", columnDefinition = "uuid")
    private UUID assignedManagerId;

    // ─────────────────────────────────────────────
    // Enums stored as strings
    // ─────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "relation_avec_client", length = 20)
    private RelationAvecClient relationAvecClient;

    @Column(name = "relation_avec_client_other", length = 150)
    private String relationAvecClientOther;

    @Column(name = "account_number", length = 20)
    private String accountNumber;

    @Column(name = "account_type_custom_name", length = 120)
    private String accountTypeCustomName;

    // ─────────────────────────────────────────────
    // Scoring & risk (computed externally)
    // ─────────────────────────────────────────────

    @Column(name = "scoring", length = 50)
    private String scoring;

    @Column(name = "cycle", length = 50)
    private String cycle;

    // ─────────────────────────────────────────────
    // Core Banking System reference
    // ─────────────────────────────────────────────

    @Column(name = "cbs_id", unique = true, length = 100)
    private String cbsId;

    // ─────────────────────────────────────────────
    // Flexible extra attributes (JSON)
    // ─────────────────────────────────────────────

    /**
     * Extensible key-value store for additional attributes not covered by the schema.
     * Stored as JSONB in PostgreSQL.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attributes", columnDefinition = "jsonb")
    private Map<String, Object> attributes;

    // ─────────────────────────────────────────────
    // Audit fields
    // ─────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", columnDefinition = "uuid")
    private UUID createdBy;

    @Column(name = "updated_by", columnDefinition = "uuid")
    private UUID updatedBy;

    @Version
    private Long version;

    // ─────────────────────────────────────────────
    // Lifecycle hooks
    // ─────────────────────────────────────────────

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }

    // ─────────────────────────────────────────────
    // Convenience helpers
    // ─────────────────────────────────────────────

    public boolean isPhysical() {
        return ClientType.PHYSICAL.equals(clientType);
    }

    public boolean isLegal() {
        return ClientType.LEGAL.equals(clientType);
    }
}
