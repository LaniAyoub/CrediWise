package org.acme.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import org.acme.dto.ClientCreateDTO;
import org.acme.dto.ClientResponseDTO;
import org.acme.dto.ClientUpdateDTO;
import org.acme.entity.*;
import org.acme.entity.Activite;
import org.acme.entity.enums.ClientStatus;
import org.acme.entity.enums.RelationAvecClient;
import org.acme.exception.ClientAlreadyExistsException;
import org.acme.exception.ClientNotFoundException;
import org.acme.grpc.AgenceResponse;
import org.acme.grpc.GestionnaireGrpcClient;
import org.acme.grpc.GestionnaireResponse;
import org.acme.repository.ClientRepository;

import java.util.List;
import java.util.UUID;
import java.util.logging.Logger;

@ApplicationScoped
public class ClientService {
    private static final long ACCOUNT_TYPE_OTHER_ID = 4L;
    private static final Logger LOGGER = Logger.getLogger(ClientService.class.getName());

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
        System.out.println("ClientService.create() dto.getClientType() = " + dto.getClientType());
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
        client.setId(UUID.randomUUID());
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

    @Transactional
    public ClientResponseDTO getById(UUID id) {
        Client client = clientRepository.findByIdOptional(id)
                .orElseThrow(() -> new ClientNotFoundException("Client not found: " + id));
        return enrichAndMap(client);
    }

    @Transactional
    public List<ClientResponseDTO> listAll(int page, int size) {
        return clientRepository.findAllPaged(page, size).stream()
                .map(this::enrichAndMap)
                .toList();
    }

    @Transactional
    public List<ClientResponseDTO> listByStatus(ClientStatus status, int page, int size) {
        return clientRepository.findByStatus(status, page, size).stream()
                .map(this::enrichAndMap)
                .toList();
    }

    @Transactional
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
        client.setRelationAvecClientOther(dto.getRelationAvecClientOther());
        client.setAccountNumber(dto.getAccountNumber());
        client.setAccountTypeCustomName(dto.getAccountTypeCustomName());
        client.setScoring(dto.getScoring());
        String cycleValue = dto.getCycle();
        int parsedCycle = 0;
        if (cycleValue != null && !cycleValue.isBlank()) {
            try { parsedCycle = Integer.parseInt(cycleValue.trim()); } catch (NumberFormatException ignored) {}
        }
        client.setCycle(parsedCycle);
        client.setCbsId(dto.getCbsId());
        client.setAttributes(dto.getAttributes());
        client.setAgenceId(dto.getAgenceId());
        client.setAssignedManagerId(dto.getAssignedManagerId());
        if (dto.getSegmentId() != null) {
            Segment segment = Segment.findById(dto.getSegmentId());
            if (segment == null) {
                throw new BadRequestException("Segment not found: " + dto.getSegmentId());
            }
            client.setSegment(segment);
        } else if (dto.getSegmentLibelle() != null && !dto.getSegmentLibelle().isBlank()) {
            Segment segment = clientRepository.findSegmentByLibelle(dto.getSegmentLibelle())
                    .orElseThrow(() -> new BadRequestException("Segment not found: " + dto.getSegmentLibelle()));
            client.setSegment(segment);
        }
        if (dto.getAccountTypeId() != null) {
            AccountType accountType = AccountType.findById(dto.getAccountTypeId());
            if (accountType == null) {
                throw new BadRequestException("Account type not found: " + dto.getAccountTypeId());
            }
            client.setAccountType(accountType);
        } else if (dto.getAccountTypeLibelle() != null && !dto.getAccountTypeLibelle().isBlank()) {
            AccountType accountType = clientRepository.findAccountTypeByLibelle(dto.getAccountTypeLibelle())
                    .orElseThrow(() -> new BadRequestException("Account type not found: " + dto.getAccountTypeLibelle()));
            client.setAccountType(accountType);
        }
        if (dto.getSecteurActiviteId() != null) {
            SecteurActivite secteur = SecteurActivite.findById(dto.getSecteurActiviteId());
            if (secteur == null) {
                throw new BadRequestException("Business sector not found: " + dto.getSecteurActiviteId());
            }
            client.setSecteurActivite(secteur);
        } else if (dto.getSecteurActiviteLibelle() != null && !dto.getSecteurActiviteLibelle().isBlank()) {
            SecteurActivite secteur = clientRepository.findSecteurActiviteByLibelle(dto.getSecteurActiviteLibelle())
                    .orElseThrow(() -> new BadRequestException("Business sector not found: " + dto.getSecteurActiviteLibelle()));
            client.setSecteurActivite(secteur);
        }
        if (dto.getActiviteId() != null) {
            Activite activite = Activite.findById(dto.getActiviteId());
            if (activite == null) {
                throw new BadRequestException("Activity group not found: " + dto.getActiviteId());
            }
            client.setActivite(activite);
        }
        if (dto.getSousActiviteId() != null) {
            SousActivite sousActivite = SousActivite.findById(dto.getSousActiviteId());
            if (sousActivite == null) {
                throw new BadRequestException("Business activity not found: " + dto.getSousActiviteId());
            }
            client.setSousActivite(sousActivite);
            // Auto-set activite from sous_activite if not explicitly provided
            if (dto.getActiviteId() == null && sousActivite.getActivite() != null) {
                client.setActivite(sousActivite.getActivite());
            }
        } else if (dto.getSousActiviteLibelle() != null && !dto.getSousActiviteLibelle().isBlank()) {
            SousActivite sousActivite = clientRepository.findSousActiviteByLibelle(dto.getSousActiviteLibelle())
                    .orElseThrow(() -> new BadRequestException("Business activity not found: " + dto.getSousActiviteLibelle()));
            client.setSousActivite(sousActivite);
            if (dto.getActiviteId() == null && sousActivite.getActivite() != null) {
                client.setActivite(sousActivite.getActivite());
            }
        }
        if (dto.getMappingRisqueActiviteId() != null) {
            MappingRisqueActivite risk = MappingRisqueActivite.findById(dto.getMappingRisqueActiviteId());
            if (risk == null) {
                throw new BadRequestException("MappingRisqueActivite not found: " + dto.getMappingRisqueActiviteId());
            }
            client.setRiskLevel(risk);
            LOGGER.info("Assigned explicit MappingRisqueActivite id=" + risk.getId() + " to client");
        } else if (client.getSecteurActivite() != null && client.getSousActivite() != null) {
            MappingRisqueActivite risk = MappingRisqueActivite.find(
                    "secteurActivite.id = ?1 and sousActivite.id = ?2",
                    client.getSecteurActivite().getId(),
                    client.getSousActivite().getId())
                    .firstResult();

            if (risk != null) {
                client.setRiskLevel(risk);
                LOGGER.info("Assigned MappingRisqueActivite id=" + risk.getId() + " by secteur+SousActivite");
            } else if (client.getSousActivite() != null) {
                risk = MappingRisqueActivite.find("sousActivite.id = ?1", client.getSousActivite().getId())
                        .firstResult();
                if (risk != null) {
                    client.setRiskLevel(risk);
                    LOGGER.info("Assigned MappingRisqueActivite id=" + risk.getId() + " by sousActivite fallback");
                } else {
                    LOGGER.info("No MappingRisqueActivite found for secteurId=" + client.getSecteurActivite().getId() +
                            " sousActiviteId=" + client.getSousActivite().getId());
                }
            }
        }

        validateExtraBusinessRules(client);
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
        if (dto.getRelationAvecClientOther() != null) client.setRelationAvecClientOther(dto.getRelationAvecClientOther());
        if (dto.getAccountNumber() != null) client.setAccountNumber(dto.getAccountNumber());
        if (dto.getAccountTypeCustomName() != null) client.setAccountTypeCustomName(dto.getAccountTypeCustomName());
        if (dto.getScoring() != null) client.setScoring(dto.getScoring());
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
        if (dto.getActiviteId() != null) {
            client.setActivite(Activite.findById(dto.getActiviteId()));
        }
        if (dto.getSousActiviteId() != null) {
            SousActivite sa = SousActivite.findById(dto.getSousActiviteId());
            client.setSousActivite(sa);
            if (dto.getActiviteId() == null && sa != null && sa.getActivite() != null) {
                client.setActivite(sa.getActivite());
            }
        }
        if (dto.getMappingRisqueActiviteId() != null) {
            MappingRisqueActivite risk = MappingRisqueActivite.findById(dto.getMappingRisqueActiviteId());
            if (risk == null) {
                throw new BadRequestException("MappingRisqueActivite not found: " + dto.getMappingRisqueActiviteId());
            }
            client.setRiskLevel(risk);
            LOGGER.info("Assigned explicit MappingRisqueActivite id=" + risk.getId() + " to client (update)");
        } else if (client.getSecteurActivite() != null && client.getSousActivite() != null) {
            MappingRisqueActivite risk = MappingRisqueActivite.find(
                    "secteurActivite.id = ?1 and sousActivite.id = ?2",
                    client.getSecteurActivite().getId(),
                    client.getSousActivite().getId())
                    .firstResult();

            if (risk != null) {
                client.setRiskLevel(risk);
                LOGGER.info("Assigned MappingRisqueActivite id=" + risk.getId() + " by secteur+SousActivite (update)");
            } else if (client.getSousActivite() != null) {
                risk = MappingRisqueActivite.find("sousActivite.id = ?1", client.getSousActivite().getId())
                        .firstResult();
                if (risk != null) {
                    client.setRiskLevel(risk);
                    LOGGER.info("Assigned MappingRisqueActivite id=" + risk.getId() + " by sousActivite fallback (update)");
                } else {
                    LOGGER.info("No MappingRisqueActivite found for secteurId=" + (client.getSecteurActivite() != null ? client.getSecteurActivite().getId() : null) +
                            " sousActiviteId=" + (client.getSousActivite() != null ? client.getSousActivite().getId() : null) + " (update)");
                }
            }
        }
        if (dto.getSegmentLibelle() != null && !dto.getSegmentLibelle().isBlank()) {
            client.setSegment(clientRepository.findSegmentByLibelle(dto.getSegmentLibelle())
                    .orElseThrow(() -> new BadRequestException("Segment not found: " + dto.getSegmentLibelle())));
        }
        if (dto.getAccountTypeLibelle() != null && !dto.getAccountTypeLibelle().isBlank()) {
            client.setAccountType(clientRepository.findAccountTypeByLibelle(dto.getAccountTypeLibelle())
                    .orElseThrow(() -> new BadRequestException("Account type not found: " + dto.getAccountTypeLibelle())));
        }
        if (dto.getSecteurActiviteLibelle() != null && !dto.getSecteurActiviteLibelle().isBlank()) {
            client.setSecteurActivite(clientRepository.findSecteurActiviteByLibelle(dto.getSecteurActiviteLibelle())
                    .orElseThrow(() -> new BadRequestException("Business sector not found: " + dto.getSecteurActiviteLibelle())));
        }
        if (dto.getSousActiviteLibelle() != null && !dto.getSousActiviteLibelle().isBlank()) {
            client.setSousActivite(clientRepository.findSousActiviteByLibelle(dto.getSousActiviteLibelle())
                    .orElseThrow(() -> new BadRequestException("Business activity not found: " + dto.getSousActiviteLibelle())));
        }

        validateExtraBusinessRules(client);
    }

    private void validateExtraBusinessRules(Client client) {
        if (client.getAccountNumber() != null && !client.getAccountNumber().matches("\\d{20}")) {
            throw new BadRequestException("Account number must contain exactly 20 numeric digits");
        }

        if (RelationAvecClient.OTHER.equals(client.getRelationAvecClient())) {
            if (client.getRelationAvecClientOther() == null || client.getRelationAvecClientOther().isBlank()) {
                throw new BadRequestException("Please provide relation details when relation is OTHER");
            }
        } else {
            client.setRelationAvecClientOther(null);
        }

        boolean isOtherAccountType = client.getAccountType() != null
                && ACCOUNT_TYPE_OTHER_ID == client.getAccountType().getId();
        if (isOtherAccountType) {
            if (client.getAccountTypeCustomName() == null || client.getAccountTypeCustomName().isBlank()) {
                throw new BadRequestException("Please provide a custom account type name when account type is OTHER");
            }
        } else {
            client.setAccountTypeCustomName(null);
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
                .activiteId(c.getActivite() != null ? c.getActivite().getId() : null)
                .activiteLibelle(c.getActivite() != null ? c.getActivite().getLibelle() : null)
                .sousActiviteId(c.getSousActivite() != null ? c.getSousActivite().getId() : null)
                .sousActiviteLibelle(c.getSousActivite() != null ? c.getSousActivite().getLibelle() : null)
                .mappingRisqueActiviteId(c.getRiskLevel() != null ? c.getRiskLevel().getId() : null)
                .ifcLevelOfRisk(c.getSousActivite() != null ? c.getSousActivite().getIfcLevelOfRisk() : null)
                .agenceId(c.getAgenceId())
                .agenceLibelle(agenceLibelle)
                .assignedManagerId(c.getAssignedManagerId())
                .managerFullName(managerFullName)
                .relationAvecClient(c.getRelationAvecClient())
                .relationAvecClientOther(c.getRelationAvecClientOther())
                .accountNumber(c.getAccountNumber())
                .accountTypeCustomName(c.getAccountTypeCustomName())
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
