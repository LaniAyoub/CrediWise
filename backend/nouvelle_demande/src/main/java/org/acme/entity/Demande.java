package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.acme.entity.enums.DemandeStatut;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    // ─────────────────────────────────────────────
    // Client reference (logical key — external microservice)
    // ─────────────────────────────────────────────
    @Column(name = "client_id", nullable = false)
    public UUID clientId;

    // ─────────────────────────────────────────────
    // Physical person snapshot
    // ─────────────────────────────────────────────
    @Column(name = "client_type", length = 10)
    public String clientType;

    @Column(name = "first_name", length = 100)
    public String firstName;

    @Column(name = "last_name", length = 100)
    public String lastName;

    @Column(name = "date_of_birth")
    public LocalDate dateOfBirth;

    @Column(name = "national_id", length = 50)
    public String nationalId;

    @Column(name = "gender", length = 10)
    public String gender;

    @Column(name = "marital_status", length = 20)
    public String maritalStatus;

    @Column(name = "nationality", length = 100)
    public String nationality;

    @Column(name = "monthly_income", precision = 15, scale = 3)
    public BigDecimal monthlyIncome;

    // ─────────────────────────────────────────────
    // Legal entity snapshot
    // ─────────────────────────────────────────────
    @Column(name = "company_name", length = 200)
    public String companyName;

    @Column(name = "sigle", length = 50)
    public String sigle;

    @Column(name = "registration_number", length = 100)
    public String registrationNumber;

    @Column(name = "principal_interlocutor", length = 200)
    public String principalInterlocutor;

    // ─────────────────────────────────────────────
    // Common snapshot
    // ─────────────────────────────────────────────
    @Column(name = "scoring", length = 50)
    public String scoring;

    @Column(name = "manager_name", length = 200)
    public String managerName;

    @Column(name = "branch_id", length = 20)
    public String branchId;

    @Column(name = "branch_name", length = 200)
    public String branchName;

    @Column(name = "cycle", length = 50)
    public String cycle;

    @Column(name = "segment", length = 100)
    public String segment;

    @Column(name = "account_type", length = 100)
    public String accountType;

    @Column(name = "business_sector", length = 200)
    public String businessSector;

    @Column(name = "business_activity", length = 200)
    public String businessActivity;

    @Column(name = "email", length = 150)
    public String email;

    @Column(name = "primary_phone", length = 30)
    public String primaryPhone;

    // ─────────────────────────────────────────────
    // Credit request
    // ─────────────────────────────────────────────
    @Column(name = "loan_purpose", length = 2000)
    public String loanPurpose;

    @Column(name = "requested_amount", precision = 15, scale = 3)
    public BigDecimal requestedAmount;

    @Column(name = "duration_months")
    public Integer durationMonths;

    @Column(name = "product_id", length = 50)
    public String productId;

    @Column(name = "product_name", length = 200)
    public String productName;

    @Column(name = "asset_type", length = 200)
    public String assetType;

    @Column(name = "monthly_repayment_capacity", precision = 15, scale = 3)
    public BigDecimal monthlyRepaymentCapacity;

    @Column(name = "application_channel", length = 100)
    public String applicationChannel;

    // ─────────────────────────────────────────────
    // Consent & signatories
    // ─────────────────────────────────────────────
    @Column(name = "consent_text", length = 4000)
    public String consentText;

    @Column(name = "signatories", length = 500)
    public String signatories;

    @Column(name = "request_date")
    public LocalDateTime requestDate;

    // ─────────────────────────────────────────────
    // Status  (DRAFT / SUBMITTED / VALIDATED / REJECTED)
    // ─────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    public DemandeStatut status;

    // ─────────────────────────────────────────────
    // Relations
    // ─────────────────────────────────────────────
    @OneToMany(mappedBy = "demande", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    public List<Guarantor> guarantors = new ArrayList<>();

    @OneToMany(mappedBy = "demande", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    public List<Guarantee> guarantees = new ArrayList<>();

    // ─────────────────────────────────────────────
    // Audit
    // ─────────────────────────────────────────────
    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    public LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @Column(name = "created_by")
    public UUID createdBy;

    @Column(name = "updated_by")
    public UUID updatedBy;

    @Column(name = "deleted_by")
    public UUID deletedBy;

    @Column(name = "deleted_at")
    public LocalDateTime deletedAt;

    // ─────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────
    @PrePersist
    void onCreate() {
        if (requestDate == null) {
            requestDate = LocalDateTime.now();
        }
        if (status == null) {
            status = DemandeStatut.DRAFT;
        }
        if (signatories == null || signatories.isBlank()) {
            String manager = managerName != null ? managerName : "N/A";
            signatories = "Main client + Manager (" + manager + ")";
        }
    }
}
