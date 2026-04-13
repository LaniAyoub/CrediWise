package org.acme.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import org.acme.dto.*;
import org.acme.entity.Demande;
import org.acme.entity.Guarantee;
import org.acme.entity.Guarantor;
import org.acme.entity.enums.DemandeStatut;
import org.acme.exception.DemandeNotFoundException;
import org.acme.grpc.ClientGrpcClient;
import org.acme.grpc.GestionnaireGrpcClient;
import org.acme.repository.DemandeRepository;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@ApplicationScoped
public class DemandeService {

    @Inject
    DemandeRepository demandeRepository;

    @Inject
    GestionnaireGrpcClient gestionnaireGrpcClient;

    @Inject
    ClientGrpcClient clientGrpcClient;

    @Inject
    JsonWebToken jwt;

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public DemandeResponse create(DemandeCreateRequest req) {
        // 1. Resolve gestionnaire from JWT
        String gestionnaireId = jwt.getSubject();
        org.acme.grpc.GestionnaireResponse gestionnaire = gestionnaireGrpcClient.getGestionnaire(gestionnaireId);
        if (!gestionnaire.getFound()) {
            throw new BadRequestException("Gestionnaire not found: " + gestionnaireId);
        }

        // 2. Fetch client snapshot via gRPC
        org.acme.grpc.ClientResponse client = clientGrpcClient.getClient(req.getClientId().toString());
        if (!client.getFound()) {
            throw new BadRequestException("Client not found: " + req.getClientId());
        }

        // 3. Build Demande
        Demande demande = new Demande();
        demande.clientId = req.getClientId();
        demande.clientType = client.getClientType();
        demande.firstName = nullIfBlank(client.getFirstName());
        demande.lastName = nullIfBlank(client.getLastName());
        demande.dateOfBirth = client.getDateOfBirth().isBlank() ? null : LocalDate.parse(client.getDateOfBirth());
        demande.nationalId = nullIfBlank(client.getNationalId());
        demande.gender = nullIfBlank(client.getGender());
        demande.maritalStatus = nullIfBlank(client.getMaritalStatus());
        demande.nationality = nullIfBlank(client.getNationality());
        demande.monthlyIncome = client.getMonthlyIncome().isBlank() ? null : new BigDecimal(client.getMonthlyIncome());
        demande.companyName = nullIfBlank(client.getCompanyName());
        demande.sigle = nullIfBlank(client.getSigle());
        demande.registrationNumber = nullIfBlank(client.getRegistrationNumber());
        demande.principalInterlocutor = nullIfBlank(client.getPrincipalInterlocutor());
        demande.email = nullIfBlank(client.getEmail());
        demande.primaryPhone = nullIfBlank(client.getPrimaryPhone());
        demande.scoring = nullIfBlank(client.getScoring());
        demande.cycle = nullIfBlank(client.getCycle());
        demande.segment = nullIfBlank(client.getSegment());
        demande.accountType = nullIfBlank(client.getAccountType());
        demande.businessSector = nullIfBlank(client.getBusinessSector());
        demande.businessActivity = nullIfBlank(client.getBusinessActivity());
        demande.managerName = gestionnaire.getFirstName() + " " + gestionnaire.getLastName();
        demande.branchId = nullIfBlank(gestionnaire.getAgenceId());
        demande.branchName = nullIfBlank(gestionnaire.getAgenceLibelle());
        demande.loanPurpose = req.getLoanPurpose();
        demande.requestedAmount = req.getRequestedAmount();
        demande.durationMonths = req.getDurationMonths();
        demande.productId = req.getProductId();
        demande.productName = null; // Set if you have a local product lookup
        demande.assetType = req.getAssetType();
        demande.monthlyRepaymentCapacity = req.getMonthlyRepaymentCapacity();
        demande.applicationChannel = req.getApplicationChannel();
        demande.consentText = req.getConsentText();
        // Guarantors
        if (req.getGuarantors() != null) {
            for (GuarantorDto g : req.getGuarantors()) {
                Guarantor guarantor = new Guarantor();
                guarantor.demande = demande;
                guarantor.name = g.name;
                guarantor.amplitudeId = g.amplitudeId;
                guarantor.clientRelationship = g.clientRelationship;
                demande.guarantors.add(guarantor);
            }
        }
        // Guarantees
        if (req.getGuarantees() != null) {
            for (GuaranteeDto g : req.getGuarantees()) {
                Guarantee guarantee = new Guarantee();
                guarantee.demande = demande;
                guarantee.owner = g.getOwner();
                guarantee.type = g.getType();
                guarantee.estimatedValue = g.getEstimatedValue();
                demande.guarantees.add(guarantee);
            }
        }
        demandeRepository.persist(demande);
        return toResponse(demande);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // READ
    // ─────────────────────────────────────────────────────────────────────────

    public DemandeResponse getById(UUID id) {
        Demande demande = demandeRepository.findByIdOptional(id)
                .orElseThrow(() -> new DemandeNotFoundException("Demande not found: " + id));
        return toResponse(demande);
    }

    @Transactional
    public List<DemandeResponse> listAll(int page, int size) {
        return demandeRepository.findAllPaged(page, size)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public List<DemandeResponse> listByClientId(UUID clientId, int page, int size) {
        return demandeRepository.findByClientId(clientId, page, size)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public List<DemandeResponse> listByStatut(DemandeStatut statut, int page, int size) {
        return demandeRepository.findByStatut(statut, page, size)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE STATUT
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public DemandeResponse updateStatut(UUID id, DemandeStatut newStatut) {
        Demande demande = demandeRepository.findByIdOptional(id)
                .orElseThrow(() -> new DemandeNotFoundException("Demande not found: " + id));
        DemandeStatut previousStatut = demande.status;
        validateTransition(demande.status, newStatut);
        demande.status = newStatut;

        if (previousStatut == DemandeStatut.SUBMITTED && newStatut == DemandeStatut.VALIDATED) {
            boolean updated = clientGrpcClient.incrementClientCycle(demande.clientId.toString());
            if (!updated) {
                throw new BadRequestException("Failed to increment client cycle for client: " + demande.clientId);
            }
        }
        return toResponse(demande);
    }

    @Transactional
    public DemandeResponse submit(UUID id) {
        return updateStatut(id, DemandeStatut.SUBMITTED);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE (DRAFT only)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public DemandeResponse update(UUID id, DemandeUpdateRequest req) {
        Demande demande = demandeRepository.findByIdOptional(id)
                .orElseThrow(() -> new DemandeNotFoundException("Demande not found: " + id));
        if (demande.status != DemandeStatut.DRAFT) {
            throw new BadRequestException("Only DRAFT demandes can be updated");
        }
        // Update fields from request
        if (req.loanPurpose != null) demande.loanPurpose = req.loanPurpose;
        if (req.requestedAmount != null) demande.requestedAmount = req.requestedAmount;
        if (req.durationMonths != null) demande.durationMonths = req.durationMonths;
        if (req.productId != null) demande.productId = req.productId;
        if (req.assetType != null) demande.assetType = req.assetType;
        if (req.monthlyRepaymentCapacity != null) demande.monthlyRepaymentCapacity = req.monthlyRepaymentCapacity;
        if (req.applicationChannel != null) demande.applicationChannel = req.applicationChannel;
        if (req.consentText != null) demande.consentText = req.consentText;
        // Guarantors and guarantees update logic can be added as needed
        return toResponse(demande);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public void delete(UUID id) {
        Demande demande = demandeRepository.findByIdOptional(id)
                .orElseThrow(() -> new DemandeNotFoundException("Demande not found: " + id));
        if (demande.status != DemandeStatut.DRAFT) {
            throw new BadRequestException("Only DRAFT demandes can be deleted");
        }
        demandeRepository.delete(demande);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private void validateTransition(DemandeStatut current, DemandeStatut next) {
        boolean valid = switch (current) {
            case DRAFT -> next == DemandeStatut.SUBMITTED;
            case SUBMITTED -> next == DemandeStatut.VALIDATED || next == DemandeStatut.REJECTED;
            default -> false;
        };
        if (!valid) {
            throw new BadRequestException("Invalid status transition: " + current + " → " + next);
        }
    }

    private DemandeResponse toResponse(Demande d) {
        List<GuarantorDto> guarantorDtos = new ArrayList<>();
        if (d.guarantors != null) {
            for (Guarantor g : d.guarantors) {
                GuarantorDto dto = new GuarantorDto();
                dto.id = g.id;
                dto.name = g.name;
                dto.amplitudeId = g.amplitudeId;
                dto.clientRelationship = g.clientRelationship;
                guarantorDtos.add(dto);
            }
        }
        List<GuaranteeDto> guaranteeDtos = new ArrayList<>();
        if (d.guarantees != null) {
            for (Guarantee g : d.guarantees) {
                GuaranteeDto dto = new GuaranteeDto();
                dto.id = g.id;
                dto.owner = g.owner;
                dto.type = g.type;
                dto.estimatedValue = g.estimatedValue;
                guaranteeDtos.add(dto);
            }
        }
        return DemandeResponse.builder()
                .id(d.id)
                .clientId(d.clientId)
                .clientType(d.clientType)
                .status(d.status)
                .firstName(d.firstName)
                .lastName(d.lastName)
                .dateOfBirth(d.dateOfBirth)
                .nationalId(d.nationalId)
                .gender(d.gender)
                .maritalStatus(d.maritalStatus)
                .nationality(d.nationality)
                .monthlyIncome(d.monthlyIncome)
                .companyName(d.companyName)
                .sigle(d.sigle)
                .registrationNumber(d.registrationNumber)
                .principalInterlocutor(d.principalInterlocutor)
                .email(d.email)
                .primaryPhone(d.primaryPhone)
                .scoring(d.scoring)
                .cycle(d.cycle)
                .segment(d.segment)
                .accountType(d.accountType)
                .businessSector(d.businessSector)
                .businessActivity(d.businessActivity)
                .managerName(d.managerName)
                .branchId(d.branchId)
                .branchName(d.branchName)
                .loanPurpose(d.loanPurpose)
                .requestedAmount(d.requestedAmount)
                .durationMonths(d.durationMonths)
                .productId(d.productId)
                .productName(d.productName)
                .assetType(d.assetType)
                .monthlyRepaymentCapacity(d.monthlyRepaymentCapacity)
                .applicationChannel(d.applicationChannel)
                .consentText(d.consentText)
                .signatories(d.signatories)
                .guarantors(guarantorDtos)
                .guarantees(guaranteeDtos)
                .requestDate(d.requestDate)
                .createdAt(d.createdAt)
                .updatedAt(d.updatedAt)
                .createdBy(d.createdBy)
                .updatedBy(d.updatedBy)
                .deletedBy(d.deletedBy)
                .deletedAt(d.deletedAt)
                .build();
    }

    private String nullIfBlank(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}
