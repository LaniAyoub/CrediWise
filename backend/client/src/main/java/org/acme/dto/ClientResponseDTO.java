package org.acme.dto;

import lombok.Builder;
import lombok.Getter;
import org.acme.entity.enums.ClientStatus;
import org.acme.entity.enums.ClientType;
import org.acme.entity.enums.Gender;
import org.acme.entity.enums.RelationAvecClient;
import org.acme.entity.enums.SituationFamiliale;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@Builder
public class ClientResponseDTO {

    private UUID id;
    private ClientType clientType;
    private ClientStatus status;

    // ── Physical person ──────────────────────────────
    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private String nationalId;
    private String taxIdentifier;
    private Gender gender;
    private SituationFamiliale situationFamiliale;
    private String nationality;
    private BigDecimal monthlyIncome;

    // ── Legal entity ─────────────────────────────────
    private String companyName;
    private String sigle;
    private String registrationNumber;
    private String principalInterlocutor;

    // ── Contact ──────────────────────────────────────
    private String email;
    private String primaryPhone;
    private String secondaryPhone;
    private String addressStreet;
    private String addressCity;
    private String addressPostal;
    private String addressCountry;

    // ── Local references (with resolved names) ───────
    private Long segmentId;
    private String segmentLibelle;
    private Long accountTypeId;
    private String accountTypeLibelle;
    private Long secteurActiviteId;
    private String secteurActiviteLibelle;
    private Long sousActiviteId;
    private String sousActiviteLibelle;
    private Long mappingRisqueActiviteId;
    private String ifcLevelOfRisk;
    private String ifcLevelOfRiskFr;

    // ── External references (resolved via gRPC) ──────
    private String agenceId;
    private String agenceLibelle;
    private UUID assignedManagerId;
    private String managerFullName;

    // ── Other ────────────────────────────────────────
    private RelationAvecClient relationAvecClient;
    private String scoring;
    private String cycle;
    private String cbsId;
    private Map<String, Object> attributes;

    // ── Audit ────────────────────────────────────────
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
}
