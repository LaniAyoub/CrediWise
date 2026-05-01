package org.acme.service;

import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import org.acme.dto.AgenceCreateDTO;
import org.acme.dto.AgenceUpdateDTO;
import org.acme.entity.Agence;
import org.acme.exception.AgenceAlreadyExistsException;
import org.acme.exception.AgenceNotFoundException;
import org.acme.repository.AgenceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@QuarkusTest
class AgenceServiceTest {

    @Inject
    AgenceService agenceService;

    @InjectMock
    AgenceRepository agenceRepository;

    private Agence agence;

    @BeforeEach
    void setUp() {
        agence = new Agence("001", "Agence Tunis", "Siège social", true);
    }

    @Test
    void create_shouldSucceed() {
        AgenceCreateDTO dto = new AgenceCreateDTO();
        dto.setIdBranch("002");
        dto.setLibelle("Agence Sfax");
        dto.setWording("Succursale Sfax");

        when(agenceRepository.existsById("002")).thenReturn(false);

        var result = agenceService.create(dto, null);

        assertNotNull(result);
        assertEquals("002", result.getIdBranch());
        verify(agenceRepository).persist(any(Agence.class));
    }

    @Test
    void create_shouldThrowAlreadyExists() {
        AgenceCreateDTO dto = new AgenceCreateDTO();
        dto.setIdBranch("001");

        when(agenceRepository.existsById("001")).thenReturn(true);

        assertThrows(AgenceAlreadyExistsException.class,
                () -> agenceService.create(dto, null));
    }

    @Test
    void listAll_shouldReturnList() {
        when(agenceRepository.listAll()).thenReturn(List.of(agence));

        var result = agenceService.listAll();
        assertEquals(1, result.size());
    }

    @Test
    void getById_shouldReturnAgence() {
        when(agenceRepository.findByIdOptional("001")).thenReturn(Optional.of(agence));

        var result = agenceService.getById("001");
        assertEquals("001", result.getIdBranch());
    }

    @Test
    void getById_shouldThrowNotFound() {
        when(agenceRepository.findByIdOptional("999")).thenReturn(Optional.empty());
        assertThrows(AgenceNotFoundException.class, () -> agenceService.getById("999"));
    }

    @Test
    void update_shouldSucceed() {
        AgenceUpdateDTO dto = new AgenceUpdateDTO();
        dto.setLibelle("Nouveau libellé");
        dto.setIsActive(false);

        when(agenceRepository.findByIdOptional("001")).thenReturn(Optional.of(agence));

        var result = agenceService.update("001", dto, null);
        assertEquals("Nouveau libellé", result.getLibelle());
        assertFalse(result.getActive());
    }
}