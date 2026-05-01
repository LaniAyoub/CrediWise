package org.acme.service;

import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.acme.dto.GestionnaireCreateDTO;
import org.acme.dto.GestionnaireUpdateDTO;
import org.acme.entity.Agence;
import org.acme.entity.Gestionnaire;
import org.acme.entity.Role;
import org.acme.exception.GestionnaireAlreadyExistsException;
import org.acme.repository.AgenceRepository;
import org.acme.repository.GestionnaireRepository;
import org.acme.repository.RoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@QuarkusTest
class GestionnaireServiceTest {

    @Inject
    GestionnaireService service;

    @InjectMock
    GestionnaireRepository gestionnaireRepository;

    @InjectMock
    AgenceRepository agenceRepository;

    @InjectMock
    RoleRepository roleRepository;
    private UUID id;
    private Gestionnaire gestionnaire;
    private Agence agence;

    @BeforeEach
    void setUp() {
        id = UUID.randomUUID();
        agence = new Agence("001", "Agence Test", "", true);

        gestionnaire = new Gestionnaire();
        gestionnaire.setId(id);
        gestionnaire.setEmail("test@crediwise.com");
        gestionnaire.setCin("12345678");
        gestionnaire.setAgence(agence);
    }

    @Test
    void create_shouldSucceed() {
        GestionnaireCreateDTO dto = new GestionnaireCreateDTO();
        dto.setEmail("new@crediwise.com");
        dto.setCin("87654321");
        dto.setAgenceId("001");
        dto.setRole("TECH_USER");
        dto.setFirstName("Ranim");
        dto.setLastName("ABKER");

        when(gestionnaireRepository.existsByEmail(anyString())).thenReturn(false);
        when(gestionnaireRepository.existsByCin(anyString())).thenReturn(false);
        when(agenceRepository.findByIdOptional("001")).thenReturn(Optional.of(agence));

        Role mockRole = createMockRole("TECH_USER", "Technicien", "Utilisateur technique", true);
        when(roleRepository.findByCode("TECH_USER")).thenReturn(Optional.of(mockRole));

        var result = service.create(dto, UUID.randomUUID());

        assertNotNull(result);
        verify(gestionnaireRepository).persist(any(Gestionnaire.class));
    }

    @Test
    void create_shouldThrowEmailAlreadyExists() {
        when(gestionnaireRepository.existsByEmail("test@crediwise.com")).thenReturn(true);

        var dto = new GestionnaireCreateDTO();
        dto.setEmail("test@crediwise.com");

        assertThrows(GestionnaireAlreadyExistsException.class, () -> service.create(dto, null));
    }

    @Test
    void update_shouldUpdateFieldsAndRole() {
        GestionnaireUpdateDTO dto = new GestionnaireUpdateDTO();
        dto.setFirstName("Ranim Updated");
        dto.setRole("SUPER_ADMIN");

        when(gestionnaireRepository.findByIdOptional(id)).thenReturn(Optional.of(gestionnaire));

        Role mockRole = createMockRole("SUPER_ADMIN", "Super Administrateur", "Accès total", true);
        when(roleRepository.findByCode("SUPER_ADMIN")).thenReturn(Optional.of(mockRole));

        var result = service.update(id, dto, UUID.randomUUID());

        assertEquals("Ranim Updated", result.getFirstName());
        assertEquals("SUPER_ADMIN", result.getRole());
    }

    private Role createMockRole(String code, String label, String description, Boolean isActive) {
        Role role = new Role();
        role.setCode(code);
        role.setLabel(label);
        role.setDescription(description);
        role.setIsActive(isActive);
        return role;
    }
}