package org.acme.service;

import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import org.acme.client.AnalyseServiceClient;
import org.acme.dto.*;
import org.acme.entity.Demande;
import org.acme.entity.enums.DemandeStatut;
import org.acme.exception.DemandeNotFoundException;
import org.acme.grpc.ClientGrpcClient;
import org.acme.grpc.ClientResponse;
import org.acme.grpc.GestionnaireGrpcClient;
import org.acme.grpc.GestionnaireResponse;
import org.acme.repository.DemandeRepository;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@QuarkusTest
class DemandeServiceTest {

    @InjectMock
    DemandeRepository demandeRepository;

    @InjectMock
    GestionnaireGrpcClient gestionnaireGrpcClient;

    @InjectMock
    ClientGrpcClient clientGrpcClient;

    @InjectMock
    AnalyseServiceClient analyseServiceClient;

    @InjectMock
    JsonWebToken jwt;

    @Inject
    DemandeService demandeService;

    private static final Long DEMANDE_ID = 1L;
    private static final UUID CLIENT_ID = UUID.randomUUID();

    // ── Helpers ──────────────────────────────────────────────────────────────

    private GestionnaireResponse gestionnaire(String firstName, String lastName) {
        return GestionnaireResponse.newBuilder()
                .setFound(true)
                .setFirstName(firstName)
                .setLastName(lastName)
                .setAgenceId("AG01")
                .setAgenceLibelle("Agence Tunis")
                .build();
    }

    private GestionnaireResponse gestionnaireNotFound() {
        return GestionnaireResponse.newBuilder().setFound(false).build();
    }

    private ClientResponse clientFound() {
        return ClientResponse.newBuilder()
                .setFound(true)
                .setClientType("PHYSICAL")
                .setFirstName("Ahmed")
                .setLastName("Ben Ali")
                .setDateOfBirth("")
                .setNationalId("12345678")
                .setGender("MALE")
                .setMaritalStatus("SINGLE")
                .setNationality("Tunisienne")
                .setMonthlyIncome("3000.000")
                .setEmail("ahmed@test.com")
                .setPrimaryPhone("+21698000001")
                .setScoring("")
                .setCycle("0")
                .setSegment("PME")
                .setAccountType("Courant")
                .setBusinessSector("")
                .setBusinessActivity("")
                .setCompanyName("")
                .setSigle("")
                .setRegistrationNumber("")
                .setPrincipalInterlocutor("")
                .build();
    }

    private ClientResponse clientNotFound() {
        return ClientResponse.newBuilder().setFound(false).build();
    }

    private DemandeCreateRequest validCreateRequest() {
        DemandeCreateRequest req = new DemandeCreateRequest();
        req.setClientId(CLIENT_ID);
        req.setLoanPurpose("Achat véhicule");
        req.setRequestedAmount(new BigDecimal("15000.000"));
        req.setDurationMonths(24);
        req.setBankingRestriction(false);
        req.setLegalIssueOrAccountBlocked(false);
        return req;
    }

    private Demande draftDemande() {
        Demande d = new Demande();
        d.id = DEMANDE_ID;
        d.clientId = CLIENT_ID;
        d.status = DemandeStatut.DRAFT;
        d.loanPurpose = "Achat véhicule";
        d.requestedAmount = new BigDecimal("15000.000");
        d.durationMonths = 24;
        d.bankingRestriction = false;
        d.legalIssueOrAccountBlocked = false;
        d.guarantors = new java.util.ArrayList<>();
        d.guarantees = new java.util.ArrayList<>();
        return d;
    }

    private Demande demandeWithStatus(DemandeStatut status) {
        Demande d = draftDemande();
        d.status = status;
        return d;
    }

    // =========================================================================
    // CREATE
    // =========================================================================

    @Test
    void create_gestionnaireNotFound_throwsBadRequest() {
        when(jwt.getSubject()).thenReturn("unknown-uuid");
        when(gestionnaireGrpcClient.getGestionnaire("unknown-uuid"))
                .thenReturn(gestionnaireNotFound());

        assertThatThrownBy(() -> demandeService.create(validCreateRequest()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Gestionnaire not found");
    }

    @Test
    void create_clientNotFound_throwsBadRequest() {
        when(jwt.getSubject()).thenReturn("gestionnaire-uuid");
        when(gestionnaireGrpcClient.getGestionnaire("gestionnaire-uuid"))
                .thenReturn(gestionnaire("Sana", "Makhlouf"));
        when(clientGrpcClient.getClient(CLIENT_ID.toString())).thenReturn(clientNotFound());

        assertThatThrownBy(() -> demandeService.create(validCreateRequest()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Client not found");
    }

    @Test
    void create_withGuarantors_persistsGuarantors() {
        when(jwt.getSubject()).thenReturn("g-uuid");
        when(gestionnaireGrpcClient.getGestionnaire("g-uuid")).thenReturn(gestionnaire("A", "B"));
        when(clientGrpcClient.getClient(CLIENT_ID.toString())).thenReturn(clientFound());
        doNothing().when(demandeRepository).persist(any(Demande.class));

        DemandeCreateRequest req = validCreateRequest();
        GuarantorDto g = new GuarantorDto();
        g.name = "Karim Jebali";
        g.amplitudeId = "AMP-001";
        g.clientRelationship = "Frère";
        req.setGuarantors(List.of(g));

        DemandeResponse result = demandeService.create(req);

        assertThat(result.getGuarantors()).hasSize(1);
        assertThat(result.getGuarantors().get(0).name).isEqualTo("Karim Jebali");
    }

    // =========================================================================
    // GET BY ID
    // =========================================================================

    @Test
    void getById_existingDemande_returnsDTO() {
        when(demandeRepository.findByIdOptional(DEMANDE_ID))
                .thenReturn(Optional.of(draftDemande()));

        DemandeResponse result = demandeService.getById(DEMANDE_ID);

        assertThat(result.getId()).isEqualTo(DEMANDE_ID);
        assertThat(result.getStatus()).isEqualTo(DemandeStatut.DRAFT);
    }

    @Test
    void getById_missingDemande_throwsDemandeNotFound() {
        when(demandeRepository.findByIdOptional(DEMANDE_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> demandeService.getById(DEMANDE_ID))
                .isInstanceOf(DemandeNotFoundException.class)
                .hasMessageContaining("Demande not found");
    }

    // =========================================================================
    // LIST
    // =========================================================================

    @Test
    void listAll_returnsMappedDTOs() {
        when(demandeRepository.findAllPaged(0, 20)).thenReturn(List.of(draftDemande()));

        List<DemandeResponse> result = demandeService.listAll(0, 20);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(DEMANDE_ID);
    }

    @Test
    void listByClientId_returnsFilteredList() {
        when(demandeRepository.findByClientId(CLIENT_ID, 0, 20))
                .thenReturn(List.of(draftDemande()));

        List<DemandeResponse> result = demandeService.listByClientId(CLIENT_ID, 0, 20);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getClientId()).isEqualTo(CLIENT_ID);
    }

    // =========================================================================
    // UPDATE (DRAFT only)
    // =========================================================================

    @Test
    void update_draftDemande_updatesFields() {
        when(demandeRepository.findByIdOptional(DEMANDE_ID))
                .thenReturn(Optional.of(draftDemande()));

        DemandeUpdateRequest req = new DemandeUpdateRequest();
        req.loanPurpose = "Achat immobilier";
        req.requestedAmount = new BigDecimal("50000.000");

        DemandeResponse result = demandeService.update(DEMANDE_ID, req);

        assertThat(result.getLoanPurpose()).isEqualTo("Achat immobilier");
        assertThat(result.getRequestedAmount()).isEqualByComparingTo("50000.000");
    }

    @Test
    void update_nonDraftDemande_throwsBadRequest() {
        when(demandeRepository.findByIdOptional(DEMANDE_ID))
                .thenReturn(Optional.of(demandeWithStatus(DemandeStatut.ANALYSE)));

        assertThatThrownBy(() -> demandeService.update(DEMANDE_ID, new DemandeUpdateRequest()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only DRAFT demandes can be updated");
    }

    @Test
    void update_missingDemande_throwsDemandeNotFound() {
        when(demandeRepository.findByIdOptional(DEMANDE_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> demandeService.update(DEMANDE_ID, new DemandeUpdateRequest()))
                .isInstanceOf(DemandeNotFoundException.class);
    }

    // =========================================================================
    // SUBMIT
    // =========================================================================

    @Test
    void submit_draftWithNoProduct_statusBecomesCheckBeforeCommittee() {
        when(demandeRepository.findByIdOptional(DEMANDE_ID))
                .thenReturn(Optional.of(draftDemande())); // productId = null

        StartAnalysisResponse result = demandeService.submit(DEMANDE_ID, null);

        assertThat(result.demandeStatus()).isEqualTo(DemandeStatut.CHECK_BEFORE_COMMITTEE.toString());
        assertThat(result.dossierId()).isNull();
    }

    @Test
    void submit_draftWithAnalyseProduct_createsDossier() {
        Demande d = draftDemande();
        d.productId = "101";
        d.createdAt = java.time.LocalDateTime.now();
        when(demandeRepository.findByIdOptional(DEMANDE_ID)).thenReturn(Optional.of(d));
        when(analyseServiceClient.createDossier(any(), any(), any(), any(), any())).thenReturn(42L);

        StartAnalysisResponse result = demandeService.submit(DEMANDE_ID, null);

        assertThat(result.demandeStatus()).isEqualTo(DemandeStatut.ANALYSE.toString());
        assertThat(result.dossierId()).isEqualTo(42L);
    }

    @Test
    void submit_nonDraftDemande_throwsBadRequest() {
        when(demandeRepository.findByIdOptional(DEMANDE_ID))
                .thenReturn(Optional.of(demandeWithStatus(DemandeStatut.ANALYSE)));

        assertThatThrownBy(() -> demandeService.submit(DEMANDE_ID, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Can only submit from DRAFT status");
    }

    // =========================================================================
    // UPDATE STATUT
    // =========================================================================

    @Test
    void updateStatut_readyToDisburse_toDisburse_incrementsClientCycle() {
        Demande demande = demandeWithStatus(DemandeStatut.READY_TO_DISBURSE);
        when(demandeRepository.findByIdOptional(DEMANDE_ID)).thenReturn(Optional.of(demande));
        when(clientGrpcClient.incrementClientCycle(CLIENT_ID.toString())).thenReturn(true);

        DemandeResponse result = demandeService.updateStatut(DEMANDE_ID, DemandeStatut.DISBURSE);

        assertThat(result.getStatus()).isEqualTo(DemandeStatut.DISBURSE);
        verify(clientGrpcClient).incrementClientCycle(CLIENT_ID.toString());
    }

    @Test
    void updateStatut_readyToDisburse_toDisburse_cycleIncrementFails_doesNotThrow() {
        Demande demande = demandeWithStatus(DemandeStatut.READY_TO_DISBURSE);
        when(demandeRepository.findByIdOptional(DEMANDE_ID)).thenReturn(Optional.of(demande));
        when(clientGrpcClient.incrementClientCycle(CLIENT_ID.toString())).thenReturn(false);

        // cycle increment failure is logged as a warning — it does not throw
        assertThatNoException().isThrownBy(
                () -> demandeService.updateStatut(DEMANDE_ID, DemandeStatut.DISBURSE));
    }

    @Test
    void updateStatut_draft_toRejected_doesNotIncrementCycle() {
        when(demandeRepository.findByIdOptional(DEMANDE_ID))
                .thenReturn(Optional.of(draftDemande()));

        DemandeResponse result = demandeService.updateStatut(DEMANDE_ID, DemandeStatut.REJECTED);

        assertThat(result.getStatus()).isEqualTo(DemandeStatut.REJECTED);
        verify(clientGrpcClient, never()).incrementClientCycle(any());
    }

    @Test
    void updateStatut_invalidTransition_throwsBadRequest() {
        // DISBURSE → DRAFT is invalid
        when(demandeRepository.findByIdOptional(DEMANDE_ID))
                .thenReturn(Optional.of(demandeWithStatus(DemandeStatut.DISBURSE)));

        assertThatThrownBy(() -> demandeService.updateStatut(DEMANDE_ID, DemandeStatut.DRAFT))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid status transition");
    }

    // =========================================================================
    // DELETE
    // =========================================================================

    @Test
    void delete_draftDemande_callsRepositoryDelete() {
        Demande draft = draftDemande();
        when(demandeRepository.findByIdOptional(DEMANDE_ID)).thenReturn(Optional.of(draft));
        doNothing().when(demandeRepository).delete(draft);

        assertThatNoException().isThrownBy(() -> demandeService.delete(DEMANDE_ID));
        verify(demandeRepository).delete(draft);
    }

    @Test
    void delete_nonDraftDemande_throwsBadRequest() {
        when(demandeRepository.findByIdOptional(DEMANDE_ID))
                .thenReturn(Optional.of(demandeWithStatus(DemandeStatut.ANALYSE)));

        assertThatThrownBy(() -> demandeService.delete(DEMANDE_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only DRAFT demandes can be deleted");
    }

    @Test
    void delete_missingDemande_throwsDemandeNotFound() {
        when(demandeRepository.findByIdOptional(DEMANDE_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> demandeService.delete(DEMANDE_ID))
                .isInstanceOf(DemandeNotFoundException.class);
    }
}
