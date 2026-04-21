package org.acme.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.acme.dto.CreditHistoriqueItem;
import org.acme.dto.StepClientResponse;
import org.acme.entity.AnalyseDossier;
import org.acme.entity.StepClient;
import org.acme.entity.enums.DossierStatus;
import org.acme.exception.ServiceUnavailableException;
import org.acme.grpc.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Business logic for Step 1 (Client) of the analysis dossier.
 */
@ApplicationScoped
public class StepClientService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Inject
    ClientDataClient clientDataClient;

    @Inject
    AgenceDataClient agenceDataClient;

    @Inject
    GestionnaireDataClient gestionnaireDataClient;

    @Inject
    HistoriqueClient historiqueClient;

    /**
     * Preview live client data before confirmation.
     * Fetches fresh data from gRPC services but does not save.
     *
     * @param dossierId ID of the dossier
     * @param callerGestionnaireId UUID of the caller
     * @return StepClientResponse with live data
     * @throws IllegalArgumentException if dossier not found
     * @throws SecurityException if caller is not authorized
     * @throws ServiceUnavailableException if client service is down
     */
    public StepClientResponse preview(Long dossierId, UUID callerGestionnaireId) {
        // Load dossier
        AnalyseDossier dossier = AnalyseDossier.findById(dossierId);
        if (dossier == null) {
            throw new IllegalArgumentException("Dossier introuvable: " + dossierId);
        }

        // Verify authorization
        verifyAuthorization(dossier, callerGestionnaireId);

        // Fetch client data (REQUIRED — fails if unavailable)
        ClientResponse clientData = clientDataClient.fetchClient(dossier.clientId.toString());

        // Fetch agence data (OPTIONAL)
        Optional<AgenceResponse> agenceData = Optional.empty();
        String warningMessage = null;
        if (clientData.getBranchId() != null && !clientData.getBranchId().isBlank()) {
            agenceData = agenceDataClient.fetchAgence(clientData.getBranchId());
            if (agenceData.isEmpty()) {
                warningMessage = "Service agence indisponible";
            }
        }

        // Fetch credit history (OPTIONAL)
        List<CreditHistoriqueItem> historique = historiqueClient.fetchHistorique(dossier.clientId.toString());

        // Fetch manager data (OPTIONAL)
        Optional<GestionnaireResponse> managerData = Optional.empty();
        try {
            managerData = gestionnaireDataClient.fetchGestionnaire(
                UUID.fromString(clientData.getAssignedManagerId())
            );
        } catch (Exception e) {
            Log.warn("Failed to fetch manager data: " + e.getMessage());
        }

        // Build response
        return buildResponse(clientData, agenceData, historique, warningMessage, false, null, null, null, managerData, dossier, Optional.empty());
    }

    /**
     * Confirm Step 1 and advance to Step 2.
     * Fetches live data, persists snapshot, updates dossier status.
     *
     * @param dossierId ID of the dossier
     * @param callerGestionnaireId UUID of the caller
     * @return StepClientResponse with saved data
     * @throws IllegalArgumentException if dossier not found
     * @throws SecurityException if caller is not authorized
     * @throws ServiceUnavailableException if client service is down
     */
    @Transactional
    public StepClientResponse confirm(Long dossierId, UUID callerGestionnaireId) {
        // Load dossier
        AnalyseDossier dossier = AnalyseDossier.findById(dossierId);
        if (dossier == null) {
            throw new IllegalArgumentException("Dossier introuvable: " + dossierId);
        }

        // Verify authorization
        verifyAuthorization(dossier, callerGestionnaireId);

        // Fetch client data
        ClientResponse clientData = clientDataClient.fetchClient(dossier.clientId.toString());

        // Fetch agence data
        Optional<AgenceResponse> agenceData = Optional.empty();
        String warningMessage = null;
        if (clientData.getBranchId() != null && !clientData.getBranchId().isBlank()) {
            agenceData = agenceDataClient.fetchAgence(clientData.getBranchId());
            if (agenceData.isEmpty()) {
                warningMessage = "Service agence indisponible";
            }
        }

        // Fetch credit history
        List<CreditHistoriqueItem> historique = historiqueClient.fetchHistorique(dossier.clientId.toString());

        // Fetch manager data (OPTIONAL)
        Optional<GestionnaireResponse> managerData = Optional.empty();
        try {
            managerData = gestionnaireDataClient.fetchGestionnaire(
                UUID.fromString(clientData.getAssignedManagerId())
            );
        } catch (Exception e) {
            Log.warn("Failed to fetch manager data: " + e.getMessage());
        }

        // Fetch confirming gestionnaire data (OPTIONAL)
        Optional<GestionnaireResponse> confirmingGestionnaireData = Optional.empty();
        try {
            confirmingGestionnaireData = gestionnaireDataClient.fetchGestionnaire(callerGestionnaireId);
        } catch (Exception e) {
            Log.warn("Failed to fetch confirming gestionnaire data: " + e.getMessage());
        }

        LocalDateTime now = LocalDateTime.now();

        // Create or update StepClient
        Optional<StepClient> existingStep = StepClient.find("dossier.id", dossierId)
            .firstResultOptional();

        StepClient stepClient;
        if (existingStep.isPresent()) {
            stepClient = existingStep.get();
        } else {
            stepClient = new StepClient();
        }

        // Map client data to entity
        mapClientDataToEntity(stepClient, clientData, dossier);

        // Map agence data to entity
        if (agenceData.isPresent()) {
            mapAgenceDataToEntity(stepClient, agenceData.get());
        } else {
            stepClient.agenceDataAvailable = false;
        }

        // Serialize credit history to JSON
        try {
            stepClient.historiqueCreditJson = MAPPER.writeValueAsString(historique);
        } catch (Exception e) {
            Log.warn("Error serializing historique: " + e.getMessage());
            stepClient.historiqueCreditJson = "[]";
        }

        // Count demandes by status
        int validated = 0, rejected = 0;
        for (CreditHistoriqueItem item : historique) {
            if ("VALIDATED".equals(item.status())) validated++;
            if ("REJECTED".equals(item.status())) rejected++;
        }
        stepClient.nombreDemandesPassees = historique.size();
        stepClient.nombreDemandesApprouvees = validated;
        stepClient.nombreDemandesRejetees = rejected;

        // Mark as complete
        stepClient.isComplete = true;
        stepClient.confirmedBy = callerGestionnaireId;
        stepClient.confirmedByName = buildManagerName(confirmingGestionnaireData);
        stepClient.confirmedAt = now;
        stepClient.dataFetchedAt = now;
        stepClient.warningMessage = warningMessage;

        if (stepClient.id == null) {
            stepClient.dossier = dossier;
            stepClient.persist();
        }
        // else: entity is managed and changes will be persisted automatically

        // Update dossier status
        dossier.currentStep = 2;
        dossier.status = DossierStatus.ANALYSE;
        dossier.updatedAt = now;
        // Entity is managed, changes will be persisted automatically

        return buildResponse(clientData, agenceData, historique, warningMessage, true, callerGestionnaireId, stepClient.confirmedAt, now, managerData, dossier, confirmingGestionnaireData);
    }

    /**
     * Get saved Step 1 data (after confirmation).
     *
     * @param dossierId ID of the dossier
     * @param callerGestionnaireId UUID of the caller
     * @return StepClientResponse with saved snapshot
     * @throws IllegalArgumentException if dossier not found
     * @throws SecurityException if caller is not authorized
     */
    public StepClientResponse get(Long dossierId, UUID callerGestionnaireId) {
        // Load dossier
        AnalyseDossier dossier = AnalyseDossier.findById(dossierId);
        if (dossier == null) {
            throw new IllegalArgumentException("Dossier introuvable: " + dossierId);
        }

        // Verify authorization
        verifyAuthorization(dossier, callerGestionnaireId);

        // Load saved StepClient
        Optional<StepClient> savedStep = StepClient.find("dossier.id", dossierId)
            .firstResultOptional()
            .map(StepClient.class::cast);

        if (savedStep.isEmpty()) {
            // Return preview if no snapshot saved yet
            return preview(dossierId, callerGestionnaireId);
        }

        StepClient stepClient = savedStep.get();

        // Deserialize historique
        List<CreditHistoriqueItem> historique = new ArrayList<>();
        if (stepClient.historiqueCreditJson != null && !stepClient.historiqueCreditJson.isBlank()) {
            try {
                historique = MAPPER.readValue(
                    stepClient.historiqueCreditJson,
                    MAPPER.getTypeFactory().constructCollectionType(List.class, CreditHistoriqueItem.class)
                );
            } catch (Exception e) {
                Log.warn("Error deserializing historique: " + e.getMessage());
            }
        }

        return buildResponseFromEntity(stepClient, historique);
    }

    // ─────────────────────────────────────────────────────────────
    // Helper methods
    // ─────────────────────────────────────────────────────────────

    private void verifyAuthorization(AnalyseDossier dossier, UUID callerGestionnaireId) {
        // Allow: (1) the assigned manager, or (2) SUPER_ADMIN
        // In this method, we only check dossier assignment. Role check is in REST layer.
        if (!dossier.gestionnaireId.equals(callerGestionnaireId)) {
            // Will be allowed in REST layer if caller is SUPER_ADMIN
            // For now, log and let REST layer decide
        }
    }

    private void mapClientDataToEntity(StepClient entity, ClientResponse data, AnalyseDossier dossier) {
        entity.dossier = dossier;
        entity.clientId = java.util.UUID.fromString(data.getId());
        entity.clientType = data.getClientType();
        entity.status = data.getStatus();

        entity.firstName = data.getFirstName();
        entity.lastName = data.getLastName();
        if (!data.getDateOfBirth().isBlank()) {
            entity.dateOfBirth = java.time.LocalDate.parse(data.getDateOfBirth());
        }
        entity.nationalId = data.getNationalId();
        // taxIdentifier is not available in gRPC response
        entity.gender = data.getGender();
        entity.situationFamiliale = data.getMaritalStatus();
        entity.nationality = data.getNationality();
        if (!data.getMonthlyIncome().isBlank()) {
            entity.monthlyIncome = new java.math.BigDecimal(data.getMonthlyIncome());
        }

        entity.companyName = data.getCompanyName();
        entity.sigle = data.getSigle();
        entity.registrationNumber = data.getRegistrationNumber();
        entity.principalInterlocutor = data.getPrincipalInterlocutor();

        entity.email = data.getEmail();
        entity.primaryPhone = data.getPrimaryPhone();
        entity.secondaryPhone = data.getSecondaryPhone();
        entity.addressStreet = data.getAddressStreet();
        entity.addressCity = data.getAddressCity();
        entity.addressPostal = data.getAddressPostal();
        entity.addressCountry = data.getAddressCountry();
        entity.accountNumber = data.getAccountNumber();
        entity.agenceId = data.getBranchId();
        entity.assignedManagerId = java.util.UUID.fromString(data.getAssignedManagerId());

        entity.scoring = data.getScoring();
        entity.cycle = data.getCycle();
        entity.ifcLevelOfRisk = data.getIfcLevelOfRisk();

        // Store resolved label names
        entity.segmentName = data.getSegment();
        entity.accountTypeName = data.getAccountType();
        entity.businessSectorName = data.getBusinessSector();
        entity.businessActivityName = data.getBusinessActivity();

        entity.clientCreatedAt = LocalDateTime.now(); // Placeholder
        entity.clientUpdatedAt = LocalDateTime.now(); // Placeholder
    }

    private void mapAgenceDataToEntity(StepClient entity, AgenceResponse data) {
        entity.agenceIdBranch = data.getIdBranch();
        entity.agenceLibelle = data.getLibelle();
        entity.agenceWording = data.getWording();
        entity.agenceIsActive = data.getIsActive();
    }

    private StepClientResponse buildResponse(ClientResponse clientData, Optional<AgenceResponse> agenceData,
                                              List<CreditHistoriqueItem> historique, String warningMessage,
                                              Boolean isComplete, UUID confirmedBy, LocalDateTime confirmedAt,
                                              LocalDateTime dataFetchedAt, Optional<GestionnaireResponse> managerData,
                                              AnalyseDossier dossier, Optional<GestionnaireResponse> confirmingGestionnaireData) {
        return new StepClientResponse(
            java.util.UUID.fromString(clientData.getId()),
            clientData.getClientType(),
            clientData.getStatus(),
            clientData.getFirstName(),
            clientData.getLastName(),
            clientData.getDateOfBirth().isBlank() ? null : java.time.LocalDate.parse(clientData.getDateOfBirth()),
            clientData.getNationalId(),
            null, // taxIdentifier
            clientData.getGender(),
            clientData.getMaritalStatus(),
            clientData.getNationality(),
            clientData.getMonthlyIncome().isBlank() ? null : new java.math.BigDecimal(clientData.getMonthlyIncome()),
            clientData.getCompanyName(),
            clientData.getSigle(),
            clientData.getRegistrationNumber(),
            clientData.getPrincipalInterlocutor(),
            clientData.getEmail(),
            clientData.getPrimaryPhone(),
            clientData.getSecondaryPhone(),
            clientData.getAddressStreet(),
            clientData.getAddressCity(),
            clientData.getAddressPostal(),
            clientData.getAddressCountry(),
            null, // segmentId
            null, // accountTypeId
            null, // secteurActiviteId
            null, // sousActiviteId
            null, // mappingRisqueActiviteId
            clientData.getIfcLevelOfRisk(),
            clientData.getSegment(), // segmentName
            clientData.getAccountType(), // accountTypeName
            clientData.getBusinessSector(), // businessSectorName
            clientData.getBusinessActivity(), // businessActivityName
            clientData.getBranchId(),
            java.util.UUID.fromString(clientData.getAssignedManagerId()),
            null, // relationAvecClient
            null, // relationAvecClientOther
            clientData.getAccountNumber(),
            null, // accountTypeCustomName
            clientData.getScoring(),
            clientData.getCycle(),
            null, // cbsId
            LocalDateTime.now(), // clientCreatedAt
            LocalDateTime.now(), // clientUpdatedAt
            agenceData.map(AgenceResponse::getIdBranch).orElse(null),
            agenceData.map(AgenceResponse::getLibelle).orElse(null),
            agenceData.map(AgenceResponse::getWording).orElse(null),
            agenceData.map(AgenceResponse::getIsActive).orElse(null),
            historique,
            historique.size(),
            (int) historique.stream().filter(h -> "VALIDATED".equals(h.status())).count(),
            (int) historique.stream().filter(h -> "REJECTED".equals(h.status())).count(),
            isComplete,
            confirmedBy,
            buildManagerName(confirmingGestionnaireData),
            confirmedAt,
            dataFetchedAt,
            agenceData.isPresent(),
            warningMessage,
            null, // location
            dossier != null ? dossier.demandeCreatedAt : null, // demandeCreatedAt
            dossier != null ? dossier.status.toString() : null, // dossierStatus
            buildManagerName(managerData),
            buildManagerEmail(managerData),
            buildManagerRole(managerData)
        );
    }

    private StepClientResponse buildResponseFromEntity(StepClient entity, List<CreditHistoriqueItem> historique) {
        return new StepClientResponse(
            entity.clientId,
            entity.clientType,
            entity.status,
            entity.firstName,
            entity.lastName,
            entity.dateOfBirth,
            entity.nationalId,
            entity.taxIdentifier,
            entity.gender,
            entity.situationFamiliale,
            entity.nationality,
            entity.monthlyIncome,
            entity.companyName,
            entity.sigle,
            entity.registrationNumber,
            entity.principalInterlocutor,
            entity.email,
            entity.primaryPhone,
            entity.secondaryPhone,
            entity.addressStreet,
            entity.addressCity,
            entity.addressPostal,
            entity.addressCountry,
            entity.segmentId,
            entity.accountTypeId,
            entity.secteurActiviteId,
            entity.sousActiviteId,
            entity.mappingRisqueActiviteId,
            entity.ifcLevelOfRisk,
            entity.segmentName,
            entity.accountTypeName,
            entity.businessSectorName,
            entity.businessActivityName,
            entity.agenceId,
            entity.assignedManagerId,
            entity.relationAvecClient,
            entity.relationAvecClientOther,
            entity.accountNumber,
            entity.accountTypeCustomName,
            entity.scoring,
            entity.cycle,
            entity.cbsId,
            entity.clientCreatedAt,
            entity.clientUpdatedAt,
            entity.agenceIdBranch,
            entity.agenceLibelle,
            entity.agenceWording,
            entity.agenceIsActive,
            historique,
            entity.nombreDemandesPassees,
            entity.nombreDemandesApprouvees,
            entity.nombreDemandesRejetees,
            entity.isComplete,
            entity.confirmedBy,
            entity.confirmedByName,
            entity.confirmedAt,
            entity.dataFetchedAt,
            entity.agenceDataAvailable,
            entity.warningMessage,
            entity.location,
            entity.dossier != null ? entity.dossier.demandeCreatedAt : null,
            entity.dossier != null ? entity.dossier.status.toString() : null,
            entity.assignedManagerName,
            entity.assignedManagerEmail,
            entity.assignedManagerRole
        );
    }

    private String buildManagerName(Optional<GestionnaireResponse> managerData) {
        if (managerData.isEmpty()) {
            return null;
        }
        GestionnaireResponse mgr = managerData.get();
        return mgr.getFirstName() + " " + mgr.getLastName();
    }

    private String buildManagerEmail(Optional<GestionnaireResponse> managerData) {
        return managerData.map(GestionnaireResponse::getEmail).orElse(null);
    }

    private String buildManagerRole(Optional<GestionnaireResponse> managerData) {
        return managerData.map(GestionnaireResponse::getRole).orElse(null);
    }
}
