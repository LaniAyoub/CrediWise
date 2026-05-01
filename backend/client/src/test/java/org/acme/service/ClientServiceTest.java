package org.acme.service;

import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import org.acme.dto.ClientCreateDTO;
import org.acme.dto.ClientResponseDTO;
import org.acme.dto.ClientUpdateDTO;
import org.acme.entity.*;
import org.acme.entity.enums.*;
import org.acme.exception.ClientAlreadyExistsException;
import org.acme.exception.ClientNotFoundException;
import org.acme.grpc.AgenceResponse;
import org.acme.grpc.GestionnaireGrpcClient;
import org.acme.grpc.GestionnaireResponse;
import org.acme.repository.ClientRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@QuarkusTest
class ClientServiceTest {

    @InjectMock
    ClientRepository clientRepository;

    @InjectMock
    GestionnaireGrpcClient grpcClient;

    @Inject
    ClientService clientService;

    private static final UUID CLIENT_ID = UUID.randomUUID();
    private static final UUID ACTOR_ID = UUID.randomUUID();

    // ── Helpers ──────────────────────────────────────────────────────────────
    private ClientCreateDTO validCreateDTO() {
        ClientCreateDTO dto = new ClientCreateDTO();
        dto.setClientType(ClientType.PHYSICAL);
        dto.setFirstName("Ahmed");
        dto.setLastName("Ben Ali");
        dto.setEmail("ahmed@test.com");
        dto.setNationalId("12345678");
        dto.setPrimaryPhone("+21698000001");
        dto.setAccountNumber("12345678901234567890");
        dto.setRelationAvecClient(RelationAvecClient.CLIENT);
        dto.setMonthlyIncome(new BigDecimal("3000.000"));
        return dto;
    }

    private Client existingClient() {
        Client c = new Client();
        c.setId(CLIENT_ID);
        c.setClientType(ClientType.PHYSICAL);
        c.setStatus(ClientStatus.PROSPECT);
        c.setFirstName("Ahmed");
        c.setLastName("Ben Ali");
        c.setEmail("ahmed@test.com");
        c.setNationalId("12345678");
        c.setAccountNumber("12345678901234567890");
        c.setRelationAvecClient(RelationAvecClient.CLIENT);
        c.setCycle(0);
        return c;
    }

    // =========================================================================
    // CREATE – happy path
    // =========================================================================
    @Test
    void create_validDTO_returnsProspectDTO() {
        when(clientRepository.count(anyString(), any(Object[].class))).thenReturn(0L);
        doNothing().when(clientRepository).persist(any(Client.class));

        ClientResponseDTO result = clientService.create(validCreateDTO(), ACTOR_ID);

        assertThat(result.getClientType()).isEqualTo(ClientType.PHYSICAL);
        assertThat(result.getStatus()).isEqualTo(ClientStatus.PROSPECT);
        assertThat(result.getFirstName()).isEqualTo("Ahmed");
        verify(clientRepository).persist(any(Client.class));
    }

    @Test
    void create_nullCycle_defaultsToZero() {
        ClientCreateDTO dto = validCreateDTO();
        dto.setCycle(null);

        when(clientRepository.count(anyString(), any(Object[].class))).thenReturn(0L);
        doNothing().when(clientRepository).persist(any(Client.class));

        ClientResponseDTO result = clientService.create(dto, ACTOR_ID);
        assertThat(result.getCycle()).isEqualTo(0);
    }

    @Test
    void create_withValidAgence_resolvesLibelle() {
        ClientCreateDTO dto = validCreateDTO();
        dto.setAgenceId("101");

        when(clientRepository.count(anyString(), any(Object[].class))).thenReturn(0L);

        AgenceResponse agence = AgenceResponse.newBuilder()
                .setFound(true)
                .setLibelle("Agence Tunis")
                .build();
        when(grpcClient.getAgence("101")).thenReturn(agence);

        doNothing().when(clientRepository).persist(any(Client.class));

        ClientResponseDTO result = clientService.create(dto, ACTOR_ID);
        assertThat(result.getAgenceLibelle()).isEqualTo("Agence Tunis");
    }

    // =========================================================================
    // CREATE – uniqueness validation
    // =========================================================================
    @Test
    void create_duplicateEmail_throwsClientAlreadyExists() {
        when(clientRepository.count("email", "ahmed@test.com")).thenReturn(1L);

        assertThatThrownBy(() -> clientService.create(validCreateDTO(), ACTOR_ID))
                .isInstanceOf(ClientAlreadyExistsException.class)
                .hasMessageContaining("Email already used");
    }

    @Test
    void create_duplicateNationalId_throwsClientAlreadyExists() {
        when(clientRepository.count(anyString(), any(Object[].class))).thenReturn(0L);
        when(clientRepository.count("nationalId", "12345678")).thenReturn(1L);

        assertThatThrownBy(() -> clientService.create(validCreateDTO(), ACTOR_ID))
                .isInstanceOf(ClientAlreadyExistsException.class)
                .hasMessageContaining("National ID already used");
    }

    // =========================================================================
    // CREATE – gRPC validation
    // =========================================================================
    @Test
    void create_agenceNotFound_throwsBadRequest() {
        ClientCreateDTO dto = validCreateDTO();
        dto.setAgenceId("UNKNOWN");

        when(clientRepository.count(anyString(), any(Object[].class))).thenReturn(0L);

        AgenceResponse resp = AgenceResponse.newBuilder().setFound(false).build();
        when(grpcClient.getAgence("UNKNOWN")).thenReturn(resp);

        assertThatThrownBy(() -> clientService.create(dto, ACTOR_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Agence not found");
    }

    @Test
    void create_managerNotFound_throwsBadRequest() {
        ClientCreateDTO dto = validCreateDTO();
        UUID managerId = UUID.randomUUID();
        dto.setAssignedManagerId(managerId);

        when(clientRepository.count(anyString(), any(Object[].class))).thenReturn(0L);

        GestionnaireResponse resp = GestionnaireResponse.newBuilder().setFound(false).build();
        when(grpcClient.getGestionnaire(managerId.toString())).thenReturn(resp);

        assertThatThrownBy(() -> clientService.create(dto, ACTOR_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Manager not found");
    }

    // =========================================================================
    // CREATE – business rules
    // =========================================================================
    @Test
    void create_invalidAccountNumber_throwsBadRequest() {
        ClientCreateDTO dto = validCreateDTO();
        dto.setAccountNumber("123");

        when(clientRepository.count(anyString(), any(Object[].class))).thenReturn(0L);

        assertThatThrownBy(() -> clientService.create(dto, ACTOR_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Account number must contain exactly 20 numeric digits");
    }

    @Test
    void create_relationOtherWithoutDetail_throwsBadRequest() {
        ClientCreateDTO dto = validCreateDTO();
        dto.setRelationAvecClient(RelationAvecClient.OTHER);
        dto.setRelationAvecClientOther(null);

        when(clientRepository.count(anyString(), any(Object[].class))).thenReturn(0L);

        assertThatThrownBy(() -> clientService.create(dto, ACTOR_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Please provide relation details when relation is OTHER");
    }

    // =========================================================================
    // GET BY ID
    // =========================================================================
    @Test
    void getById_existingClient_returnsDTO() {
        when(clientRepository.findByIdOptional(CLIENT_ID))
                .thenReturn(Optional.of(existingClient()));

        ClientResponseDTO result = clientService.getById(CLIENT_ID);

        assertThat(result.getId()).isEqualTo(CLIENT_ID);
        assertThat(result.getFirstName()).isEqualTo("Ahmed");
    }

    @Test
    void getById_missingClient_throwsClientNotFound() {
        when(clientRepository.findByIdOptional(CLIENT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> clientService.getById(CLIENT_ID))
                .isInstanceOf(ClientNotFoundException.class)
                .hasMessageContaining("Client not found");
    }

    @Test
    void getById_grpcThrows_doesNotCrash() {
        Client c = existingClient();
        c.setAgenceId("AG99");
        when(clientRepository.findByIdOptional(CLIENT_ID)).thenReturn(Optional.of(c));
        when(grpcClient.getAgence("AG99")).thenThrow(new RuntimeException("gRPC down"));

        ClientResponseDTO result = clientService.getById(CLIENT_ID);
        assertThat(result.getAgenceLibelle()).isNull();
    }

    // =========================================================================
    // LIST
    // =========================================================================
    @Test
    void listAll_returnsAllClients() {
        when(clientRepository.findAllPaged(0, 20)).thenReturn(List.of(existingClient()));

        List<ClientResponseDTO> result = clientService.listAll(0, 20);
        assertThat(result).hasSize(1);
    }

    @Test
    void listByStatus_returnsFilteredList() {
        Client c = existingClient();
        c.setStatus(ClientStatus.ACTIVE);
        when(clientRepository.findByStatus(ClientStatus.ACTIVE, 0, 20)).thenReturn(List.of(c));

        List<ClientResponseDTO> result = clientService.listByStatus(ClientStatus.ACTIVE, 0, 20);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(ClientStatus.ACTIVE);
    }

    // =========================================================================
    // UPDATE
    // =========================================================================
    @Test
    void update_existingClient_updatesFirstName() {
        Client client = existingClient();
        when(clientRepository.findByIdOptional(CLIENT_ID)).thenReturn(Optional.of(client));
        when(clientRepository.count(anyString(), any(Object[].class))).thenReturn(0L);

        ClientUpdateDTO dto = new ClientUpdateDTO();
        dto.setFirstName("Karim");
        dto.setAccountNumber("98765432109876543210");
        dto.setRelationAvecClient(RelationAvecClient.CLIENT);

        ClientResponseDTO result = clientService.update(CLIENT_ID, dto, ACTOR_ID);

        assertThat(result.getFirstName()).isEqualTo("Karim");
    }

    @Test
    void update_missingClient_throwsClientNotFound() {
        when(clientRepository.findByIdOptional(CLIENT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> clientService.update(CLIENT_ID, new ClientUpdateDTO(), ACTOR_ID))
                .isInstanceOf(ClientNotFoundException.class);
    }

    @Test
    void update_duplicateEmail_throwsClientAlreadyExists() {
        when(clientRepository.findByIdOptional(CLIENT_ID)).thenReturn(Optional.of(existingClient()));
        when(clientRepository.count("email = ?1 and id != ?2", "taken@mail.com", CLIENT_ID))
                .thenReturn(1L);

        ClientUpdateDTO dto = new ClientUpdateDTO();
        dto.setEmail("taken@mail.com");

        assertThatThrownBy(() -> clientService.update(CLIENT_ID, dto, ACTOR_ID))
                .isInstanceOf(ClientAlreadyExistsException.class);
    }

    // =========================================================================
    // DELETE
    // =========================================================================
    @Test
    void delete_existingClient_callsRepositoryDelete() {
        Client client = existingClient();
        when(clientRepository.findByIdOptional(CLIENT_ID)).thenReturn(Optional.of(client));
        doNothing().when(clientRepository).delete(client);

        assertThatNoException().isThrownBy(() -> clientService.delete(CLIENT_ID));
        verify(clientRepository).delete(client);
    }

    @Test
    void delete_missingClient_throwsClientNotFound() {
        when(clientRepository.findByIdOptional(CLIENT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> clientService.delete(CLIENT_ID))
                .isInstanceOf(ClientNotFoundException.class);
    }
}