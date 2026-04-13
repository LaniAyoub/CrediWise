package org.acme.dto;

import lombok.Builder;
import lombok.Getter;
import org.acme.entity.enums.DemandeStatut;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class DemandeResponse {

    public UUID id;
    public UUID clientId;
    public String clientType;
    public DemandeStatut status;

    // ── Physical person snapshot ─────────────────
    public String firstName;
    public String lastName;
    public LocalDate dateOfBirth;
    public String nationalId;
    public String gender;
    public String maritalStatus;
    public String nationality;
    public BigDecimal monthlyIncome;

    // ── Legal entity snapshot ────────────────────
    public String companyName;
    public String sigle;
    public String registrationNumber;
    public String principalInterlocutor;

    // ── Common snapshot ──────────────────────────
    public String email;
    public String primaryPhone;
    public String scoring;
    public String cycle;
    public String segment;
    public String accountType;
    public String businessSector;
    public String businessActivity;

    // ── Manager / branch snapshot ────────────────
    public String managerName;
    public String branchId;
    public String branchName;

    // ── Credit request ───────────────────────────
    public String loanPurpose;
    public BigDecimal requestedAmount;
    public Integer durationMonths;
    public String productId;
    public String productName;
    public String assetType;
    public BigDecimal monthlyRepaymentCapacity;
    public String applicationChannel;

    // ── Consent ──────────────────────────────────
    public String consentText;
    public String signatories;

    // ── Relations ────────────────────────────────
    public List<GuarantorDto> guarantors;
    public List<GuaranteeDto> guarantees;

    // ── Audit ────────────────────────────────────
    public LocalDateTime requestDate;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public UUID createdBy;
    public UUID updatedBy;
    public UUID deletedBy;
    public LocalDateTime deletedAt;
}
