package org.acme.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import org.acme.dto.ClientCreateDTO;
import org.acme.dto.ClientResponseDTO;
import org.acme.dto.ClientUpdateDTO;
import org.acme.entity.*;
import org.acme.entity.enums.ClientStatus;
import org.acme.exception.ClientAlreadyExistsException;
import org.acme.exception.ClientNotFoundException;
import org.acme.grpc.AgenceResponse;
import org.acme.grpc.GestionnaireGrpcClient;
import org.acme.grpc.GestionnaireResponse;
import org.acme.repository.ClientRepository;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class ClientService {

    private final ClientRepository clientRepository;
    private final GestionnaireGrpcClient grpcClient;

    public ClientService(ClientRepository clientRepository, GestionnaireGrpcClient grpcClient) {
        this.clientRepository = clientRepository;
        this.grpcClient = grpcClient;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public ClientResponseDTO create(ClientCreateDTO dto, UUID actorId) {
        validateUniqueness(dto.getEmail(), dto.getNationalId(), dto.getCbsId(), null);

        // Validate external references via gRPC
        String agenceLibelle = null;
        if (dto.getAgenceId() != null && !dto.getAgenceId().isBlank()) {
            AgenceResponse agence = grpcClient.getAgence(dto.getAgenceId());
            if (!agence.getFound()) {
                throw new BadRequestException("Agence not found: " + dto.getAgenceId());
            }
            agenceLibelle = agence.getLibelle();
        }

        String managerFullName = null;
        if (dto.getAssignedManagerId() != null) {
            GestionnaireResponse manager = grpcClient.getGestionnaire(dto.getAssignedManagerId().toString());
            if (!manager.getFound()) {
                throw new BadRequestException("Manager not found: " + dto.getAssignedManagerId());
            }
            managerFullName = manager.getFirstName() + " " + manager.getLastName();
        }

        Client client = new Client();
        client.setClientType(dto.getClientType());
        client.setStatus(ClientStatus.PROSPECT);
        applyFields(client, dto);
        client.setCreatedBy(actorId);
        client.setUpdatedBy(actorId);

        clientRepository.persist(client);
        return toResponse(client, agenceLibelle, managerFullName);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // READ
    // ─────────────────────────────────────────────────────────────────────────

    public ClientResponseDTO getById(UUID id) {
        Client client = clientRepository.findByIdOptional(id)
                .orElseThrow(() -> new ClientNotFoundException("Client not found: " + id));
        return enrichAndMap(client);
    }

    public List<ClientResponseDTO> listAll(int page, int size) {
        return clientRepository.findAllPaged(page, size).stream()
                .map(this::enrichAndMap)
                .toList();
    }

    public List<ClientResponseDTO> listByStatus(ClientStatus status, int page, int size) {
        return clientRepository.findByStatus(status, page, size).stream()
                .map(this::enrichAndMap)
                .toList();
    }

    public List<ClientResponseDTO> listByAgence(String agenceId, int page, int size) {
        return clientRepository.findByAgenceId(agenceId, page, size).stream()
                .map(this::enrichAndMap)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public ClientResponseDTO update(UUID id, ClientUpdateDTO dto, UUID actorId) {
        Client client = clientRepository.findByIdOptional(id)
                .orElseThrow(() -> new ClientNotFoundException("Client not found: " + id));

        validateUniqueness(dto.getEmail(), dto.getNationalId(), dto.getCbsId(), id);

        // Validate external references via gRPC
        String agenceLibelle = null;
        if (dto.getAgenceId() != null && !dto.getAgenceId().isBlank()) {
            AgenceResponse agence = grpcClient.getAgence(dto.getAgenceId());
            if (!agence.getFound()) {
                throw new BadRequestException("Agence not found: " + dto.getAgenceId());
            }
            agenceLibelle = agence.getLibelle();
        } else if (client.getAgenceId() != null) {
            AgenceResponse agence = grpcClient.getAgence(client.getAgenceId());
            if (agence.getFound()) agenceLibelle = agence.getLibelle();
        }

        String managerFullName = null;
        if (dto.getAssignedManagerId() != null) {
            GestionnaireResponse manager = grpcClient.getGestionnaire(dto.getAssignedManagerId().toString());
            if (!manager.getFound()) {
                throw new BadRequestException("Manager not found: " + dto.getAssignedManagerId());
            }
            managerFullName = manager.getFirstName() + " " + manager.getLastName();
        } else if (client.getAssignedManagerId() != null) {
            GestionnaireResponse manager = grpcClient.getGestionnaire(client.getAssignedManagerId().toString());
            if (manager.getFound()) managerFullName = manager.getFirstName() + " " + manager.getLastName();
        }

        applyUpdateFields(client, dto);
        client.setUpdatedBy(actorId);

        return toResponse(client, agenceLibelle, managerFullName);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public void delete(UUID id) {
        Client client = clientRepository.findByIdOptional(id)
                .orElseThrow(() -> new ClientNotFoundException("Client not found: " + id));
        clientRepository.delete(client);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private void validateUniqueness(String email, String nationalId, String cbsId, UUID excludeId) {
        if (email != null && !email.isBlank()) {
            long count = excludeId == null
                    ? clientRepository.count("email", email)
                    : clientRepository.count("email = ?1 and id != ?2", email, excludeId);
            if (count > 0) throw new ClientAlreadyExistsException("Email already used: " + email);
        }
        if (nationalId != null && !nationalId.isBlank()) {
            long count = excludeId == null
                    ? clientRepository.count("nationalId", nationalId)
                    : clientRepository.count("nationalId = ?1 and id != ?2", nationalId, excludeId);
            if (count > 0) throw new ClientAlreadyExistsException("National ID already used: " + nationalId);
        }
        if (cbsId != null && !cbsId.isBlank()) {
            long count = excludeId == null
                    ? clientRepository.count("cbsId", cbsId)
                    : clientRepository.count("cbsId = ?1 and id != ?2", cbsId, excludeId);
            if (count > 0) throw new ClientAlreadyExistsException("CBS ID already used: " + cbsId);
        }
    }

    private void applyFields(Client client, ClientCreateDTO dto) {
        client.setFirstName(dto.getFirstName());
        client.setLastName(dto.getLastName());
        client.setDateOfBirth(dto.getDateOfBirth());
        client.setNationalId(dto.getNationalId());
        client.setTaxIdentifier(dto.getTaxIdentifier());
        client.setGender(dto.getGender());
        client.setSituationFamiliale(dto.getSituationFamiliale());
        client.setNationality(dto.getNationality());
        client.setMonthlyIncome(dto.getMonthlyIncome());
        client.setCompanyName(dto.getCompanyName());
        client.setSigle(dto.getSigle());
        client.setRegistrationNumber(dto.getRegistrationNumber());
        client.setPrincipalInterlocutor(dto.getPrincipalInterlocutor());
        client.setEmail(dto.getEmail());
        client.setPrimaryPhone(dto.getPrimaryPhone());
        client.setSecondaryPhone(dto.getSecondaryPhone());
        client.setAddressStreet(dto.getAddressStreet());
        client.setAddressCity(dto.getAddressCity());
        client.setAddressPostal(dto.getAddressPostal());
        client.setAddressCountry(dto.getAddressCountry());
        client.setRelationAvecClient(dto.getRelationAvecClient());
        client.setScoring(dto.getScoring());
        client.setCycle(dto.getCycle());
        client.setCbsId(dto.getCbsId());
        client.setAttributes(dto.getAttributes());
        client.setAgenceId(dto.getAgenceId());
        client.setAssignedManagerId(dto.getAssignedManagerId());

        if (dto.getSegmentId() != null) {
            Segment segment = Segment.findById(dto.getSegmentId());
            client.setSegment(segment);
        }
        if (dto.getAccountTypeId() != null) {
            AccountType accountType = AccountType.findById(dto.getAccountTypeId());
            client.setAccountType(accountType);
        }
        if (dto.getSecteurActiviteId() != null) {
            SecteurActivite secteur = SecteurActivite.findById(dto.getSecteurActiviteId());
            client.setSecteurActivite(secteur);
        }
        if (dto.getSousActiviteId() != null) {
            SousActivite sousActivite = SousActivite.findById(dto.getSousActiviteId());
            client.setSousActivite(sousActivite);
        }
        if (dto.getMappingRisqueActiviteId() != null) {
            MappingRisqueActivite risk = MappingRisqueActivite.findById(dto.getMappingRisqueActiviteId());
            client.setRiskLevel(risk);
        }
    }

    private void applyUpdateFields(Client client, ClientUpdateDTO dto) {
        if (dto.getStatus() != null) client.setStatus(dto.getStatus());
        if (dto.getFirstName() != null) client.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null) client.setLastName(dto.getLastName());
        if (dto.getDateOfBirth() != null) client.setDateOfBirth(dto.getDateOfBirth());
        if (dto.getNationalId() != null) client.setNationalId(dto.getNationalId());
        if (dto.getTaxIdentifier() != null) client.setTaxIdentifier(dto.getTaxIdentifier());
        if (dto.getGender() != null) client.setGender(dto.getGender());
        if (dto.getSituationFamiliale() != null) client.setSituationFamiliale(dto.getSituationFamiliale());
        if (dto.getNationality() != null) client.setNationality(dto.getNationality());
        if (dto.getMonthlyIncome() != null) client.setMonthlyIncome(dto.getMonthlyIncome());
        if (dto.getCompanyName() != null) client.setCompanyName(dto.getCompanyName());
        if (dto.getSigle() != null) client.setSigle(dto.getSigle());
        if (dto.getRegistrationNumber() != null) client.setRegistrationNumber(dto.getRegistrationNumber());
        if (dto.getPrincipalInterlocutor() != null) client.setPrincipalInterlocutor(dto.getPrincipalInterlocutor());
        if (dto.getEmail() != null) client.setEmail(dto.getEmail());
        if (dto.getPrimaryPhone() != null) client.setPrimaryPhone(dto.getPrimaryPhone());
        if (dto.getSecondaryPhone() != null) client.setSecondaryPhone(dto.getSecondaryPhone());
        if (dto.getAddressStreet() != null) client.setAddressStreet(dto.getAddressStreet());
        if (dto.getAddressCity() != null) client.setAddressCity(dto.getAddressCity());
        if (dto.getAddressPostal() != null) client.setAddressPostal(dto.getAddressPostal());
        if (dto.getAddressCountry() != null) client.setAddressCountry(dto.getAddressCountry());
        if (dto.getRelationAvecClient() != null) client.setRelationAvecClient(dto.getRelationAvecClient());
        if (dto.getScoring() != null) client.setScoring(dto.getScoring());
        if (dto.getCycle() != null) client.setCycle(dto.getCycle());
        if (dto.getCbsId() != null) client.setCbsId(dto.getCbsId());
        if (dto.getAttributes() != null) client.setAttributes(dto.getAttributes());
        if (dto.getAgenceId() != null) client.setAgenceId(dto.getAgenceId());
        if (dto.getAssignedManagerId() != null) client.setAssignedManagerId(dto.getAssignedManagerId());

        if (dto.getSegmentId() != null) {
            client.setSegment(Segment.findById(dto.getSegmentId()));
        }
        if (dto.getAccountTypeId() != null) {
            client.setAccountType(AccountType.findById(dto.getAccountTypeId()));
        }
        if (dto.getSecteurActiviteId() != null) {
            client.setSecteurActivite(SecteurActivite.findById(dto.getSecteurActiviteId()));
        }
        if (dto.getSousActiviteId() != null) {
            client.setSousActivite(SousActivite.findById(dto.getSousActiviteId()));
        }
        if (dto.getMappingRisqueActiviteId() != null) {
            client.setRiskLevel(MappingRisqueActivite.findById(dto.getMappingRisqueActiviteId()));
        }
    }

    /** Resolves external names via gRPC then builds the response DTO. */
    private ClientResponseDTO enrichAndMap(Client client) {
        String agenceLibelle = null;
        if (client.getAgenceId() != null) {
            try {
                AgenceResponse agence = grpcClient.getAgence(client.getAgenceId());
                if (agence.getFound()) agenceLibelle = agence.getLibelle();
            } catch (Exception ignored) { }
        }

        String managerFullName = null;
        if (client.getAssignedManagerId() != null) {
            try {
                GestionnaireResponse manager = grpcClient.getGestionnaire(client.getAssignedManagerId().toString());
                if (manager.getFound()) managerFullName = manager.getFirstName() + " " + manager.getLastName();
            } catch (Exception ignored) { }
        }

        return toResponse(client, agenceLibelle, managerFullName);
    }

    private ClientResponseDTO toResponse(Client c, String agenceLibelle, String managerFullName) {
        return ClientResponseDTO.builder()
                .id(c.getId())
                .clientType(c.getClientType())
                .status(c.getStatus())
                .firstName(c.getFirstName())
                .lastName(c.getLastName())
                .dateOfBirth(c.getDateOfBirth())
                .nationalId(c.getNationalId())
                .taxIdentifier(c.getTaxIdentifier())
                .gender(c.getGender())
                .situationFamiliale(c.getSituationFamiliale())
                .nationality(c.getNationality())
                .monthlyIncome(c.getMonthlyIncome())
                .companyName(c.getCompanyName())
                .sigle(c.getSigle())
                .registrationNumber(c.getRegistrationNumber())
                .principalInterlocutor(c.getPrincipalInterlocutor())
                .email(c.getEmail())
                .primaryPhone(c.getPrimaryPhone())
                .secondaryPhone(c.getSecondaryPhone())
                .addressStreet(c.getAddressStreet())
                .addressCity(c.getAddressCity())
                .addressPostal(c.getAddressPostal())
                .addressCountry(c.getAddressCountry())
                .segmentId(c.getSegment() != null ? c.getSegment().getId() : null)
                .segmentLibelle(c.getSegment() != null ? c.getSegment().getLibelle() : null)
                .accountTypeId(c.getAccountType() != null ? c.getAccountType().getId() : null)
                .accountTypeLibelle(c.getAccountType() != null ? c.getAccountType().getLibelle() : null)
                .secteurActiviteId(c.getSecteurActivite() != null ? c.getSecteurActivite().getId() : null)
                .secteurActiviteLibelle(c.getSecteurActivite() != null ? c.getSecteurActivite().getLibelle() : null)
                .sousActiviteId(c.getSousActivite() != null ? c.getSousActivite().getId() : null)
                .sousActiviteLibelle(c.getSousActivite() != null ? c.getSousActivite().getLibelle() : null)
                .mappingRisqueActiviteId(c.getRiskLevel() != null ? c.getRiskLevel().getId() : null)
                .ifcLevelOfRisk(c.getRiskLevel() != null ? c.getRiskLevel().getIfcLevelOfRisk() : null)
                .ifcLevelOfRiskFr(c.getRiskLevel() != null ? c.getRiskLevel().getIfcLevelOfRiskFr() : null)
                .agenceId(c.getAgenceId())
                .agenceLibelle(agenceLibelle)
                .assignedManagerId(c.getAssignedManagerId())
                .managerFullName(managerFullName)
                .relationAvecClient(c.getRelationAvecClient())
                .scoring(c.getScoring())
                .cycle(c.getCycle())
                .cbsId(c.getCbsId())
                .attributes(c.getAttributes())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .createdBy(c.getCreatedBy())
                .updatedBy(c.getUpdatedBy())
                .build();
    }
}
