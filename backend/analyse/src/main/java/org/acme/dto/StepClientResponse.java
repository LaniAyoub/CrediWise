package org.acme.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Complete Step 1 (Client) response data.
 * Returned to frontend for display in the analysis dossier.
 */
public record StepClientResponse(
    // ─── CLIENT DATA ─────────────────────────────────────────────

    @JsonProperty("clientId")
    UUID clientId,

    @JsonProperty("clientType")
    String clientType,

    @JsonProperty("status")
    String status,

    // Physical person
    @JsonProperty("firstName")
    String firstName,

    @JsonProperty("lastName")
    String lastName,

    @JsonProperty("dateOfBirth")
    LocalDate dateOfBirth,

    @JsonProperty("nationalId")
    String nationalId,

    @JsonProperty("taxIdentifier")
    String taxIdentifier,

    @JsonProperty("gender")
    String gender,

    @JsonProperty("situationFamiliale")
    String situationFamiliale,

    @JsonProperty("nationality")
    String nationality,

    @JsonProperty("monthlyIncome")
    BigDecimal monthlyIncome,

    // Legal entity
    @JsonProperty("companyName")
    String companyName,

    @JsonProperty("sigle")
    String sigle,

    @JsonProperty("registrationNumber")
    String registrationNumber,

    @JsonProperty("principalInterlocutor")
    String principalInterlocutor,

    // Contact
    @JsonProperty("email")
    String email,

    @JsonProperty("primaryPhone")
    String primaryPhone,

    @JsonProperty("secondaryPhone")
    String secondaryPhone,

    @JsonProperty("addressStreet")
    String addressStreet,

    @JsonProperty("addressCity")
    String addressCity,

    @JsonProperty("addressPostal")
    String addressPostal,

    @JsonProperty("addressCountry")
    String addressCountry,

    // References (IDs)
    @JsonProperty("segmentId")
    Long segmentId,

    @JsonProperty("accountTypeId")
    Long accountTypeId,

    @JsonProperty("secteurActiviteId")
    Long secteurActiviteId,

    @JsonProperty("sousActiviteId")
    Long sousActiviteId,

    @JsonProperty("mappingRisqueActiviteId")
    Long mappingRisqueActiviteId,

    @JsonProperty("ifcLevelOfRisk")
    String ifcLevelOfRisk,

    // Resolved labels (names from reference tables)
    @JsonProperty("segmentName")
    String segmentName,

    @JsonProperty("accountTypeName")
    String accountTypeName,

    @JsonProperty("businessSectorName")
    String businessSectorName,

    @JsonProperty("businessActivityGroupName")
    String businessActivityGroupName,

    @JsonProperty("businessActivityName")
    String businessActivityName,

    // External references
    @JsonProperty("agenceId")
    String agenceId,

    @JsonProperty("assignedManagerId")
    UUID assignedManagerId,

    // Other
    @JsonProperty("relationAvecClient")
    String relationAvecClient,

    @JsonProperty("relationAvecClientOther")
    String relationAvecClientOther,

    @JsonProperty("accountNumber")
    String accountNumber,

    @JsonProperty("accountTypeCustomName")
    String accountTypeCustomName,

    @JsonProperty("scoring")
    String scoring,

    @JsonProperty("cycle")
    String cycle,

    @JsonProperty("cbsId")
    String cbsId,

    @JsonProperty("clientCreatedAt")
    LocalDateTime clientCreatedAt,

    @JsonProperty("clientUpdatedAt")
    LocalDateTime clientUpdatedAt,

    // ─── AGENCE DATA ─────────────────────────────────────────────

    @JsonProperty("agenceIdBranch")
    String agenceIdBranch,

    @JsonProperty("agenceLibelle")
    String agenceLibelle,

    @JsonProperty("agenceWording")
    String agenceWording,

    @JsonProperty("agenceIsActive")
    Boolean agenceIsActive,

    // ─── CREDIT HISTORY ──────────────────────────────────────────

    @JsonProperty("historiqueCredits")
    List<CreditHistoriqueItem> historiqueCredits,

    @JsonProperty("nombreDemandesPassees")
    Integer nombreDemandesPassees,

    @JsonProperty("nombreDemandesApprouvees")
    Integer nombreDemandesApprouvees,

    @JsonProperty("nombreDemandesRejetees")
    Integer nombreDemandesRejetees,

    // ─── METADATA ────────────────────────────────────────────────

    @JsonProperty("isComplete")
    Boolean isComplete,

    @JsonProperty("confirmedBy")
    UUID confirmedBy,

    @JsonProperty("confirmedByName")
    String confirmedByName,

    @JsonProperty("confirmedAt")
    LocalDateTime confirmedAt,

    @JsonProperty("dataFetchedAt")
    LocalDateTime dataFetchedAt,

    @JsonProperty("agenceDataAvailable")
    Boolean agenceDataAvailable,

    @JsonProperty("warningMessage")
    String warningMessage,

    // ─── USER INPUT ──────────────────────────────────────────────

    @JsonProperty("location")
    String location,

    @JsonProperty("locationDomicile")
    String locationDomicile,

    @JsonProperty("dateVisite")
    LocalDate dateVisite,

    @JsonProperty("dateFinalisation")
    LocalDate dateFinalisation,

    // ─── DEMANDE INFO ────────────────────────────────────────────

    @JsonProperty("demandeCreatedAt")
    LocalDateTime demandeCreatedAt,

    @JsonProperty("dossierStatus")
    String dossierStatus,

    @JsonProperty("demandeId")
    Long demandeId,

    // ─── MANAGER INFO ────────────────────────────────────────────

    @JsonProperty("assignedManagerName")
    String assignedManagerName,

    @JsonProperty("assignedManagerEmail")
    String assignedManagerEmail,

    @JsonProperty("assignedManagerRole")
    String assignedManagerRole
) {}
