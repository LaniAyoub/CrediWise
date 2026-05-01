package org.acme.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.acme.entity.enums.ClientType;
import org.acme.entity.enums.Gender;
import org.acme.entity.enums.RelationAvecClient;
import org.acme.entity.enums.SituationFamiliale;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
public class ClientCreateDTO {

    @NotNull(message = "Client type is mandatory")
    private ClientType clientType;

    // ── Physical person ──────────────────────────────
    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private String nationalId;
    private String taxIdentifier;
    private Gender gender;
    private SituationFamiliale situationFamiliale;
    private String nationality;

    @DecimalMin(value = "0.0", message = "Monthly income must be positive")
    private BigDecimal monthlyIncome;

    // ── Legal entity ─────────────────────────────────
    private String companyName;
    private String sigle;
    private String registrationNumber;
    private String principalInterlocutor;

    // ── Contact ──────────────────────────────────────
    @Email(message = "Email should be valid")
    private String email;
    private String primaryPhone;
    private String secondaryPhone;
    private String addressStreet;
    private String addressCity;
    private String addressPostal;
    private String addressCountry;

    // ── Local references (by ID) ─────────────────────
    private Long segmentId;
    private Long accountTypeId;
    private Long secteurActiviteId;
    private Long activiteId;
    private Long sousActiviteId;
    private Long mappingRisqueActiviteId;

    // ── External references (validated via gRPC) ─────
    private String agenceId;
    private UUID assignedManagerId;

    // ── Other ────────────────────────────────────────
    private RelationAvecClient relationAvecClient;
    private String relationAvecClientOther;
    private String accountNumber;
    private String accountTypeCustomName;
    private String scoring;
    private String cycle;
    private String cbsId;
    private Map<String, Object> attributes;

    // Change from numeric IDs to libelle strings
    private String segmentLibelle;
    private String accountTypeLibelle;
    private String secteurActiviteLibelle;
    private String sousActiviteLibelle;

    // Getters/Setters
    public String getSegmentLibelle() { return segmentLibelle; }
    public void setSegmentLibelle(String segmentLibelle) { this.segmentLibelle = segmentLibelle; }

    public String getAccountTypeLibelle() { return accountTypeLibelle; }
    public void setAccountTypeLibelle(String accountTypeLibelle) { this.accountTypeLibelle = accountTypeLibelle; }

    public String getSecteurActiviteLibelle() { return secteurActiviteLibelle; }
    public void setSecteurActiviteLibelle(String secteurActiviteLibelle) { this.secteurActiviteLibelle = secteurActiviteLibelle; }

    public String getSousActiviteLibelle() { return sousActiviteLibelle; }
    public void setSousActiviteLibelle(String sousActiviteLibelle) { this.sousActiviteLibelle = sousActiviteLibelle; }
}
