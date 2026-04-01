package org.acme.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import org.acme.dto.AgenceCreateDTO;
import org.acme.dto.AgenceResponseDTO;
import org.acme.dto.AgenceUpdateDTO;
import org.acme.entity.Agence;
import org.acme.exception.AgenceAlreadyExistsException;
import org.acme.exception.AgenceNotFoundException;
import org.acme.repository.AgenceRepository;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class AgenceService {

    private final AgenceRepository agenceRepository;

    public AgenceService(AgenceRepository agenceRepository) {
        this.agenceRepository = agenceRepository;
    }

    @Transactional
    public AgenceResponseDTO create(AgenceCreateDTO dto, UUID actorId) {
        if (dto.getIdBranch() == null || dto.getIdBranch().isBlank()) {
            throw new BadRequestException("idBranch is required");
        }
        if (agenceRepository.existsById(dto.getIdBranch())) {
            throw new AgenceAlreadyExistsException("Agence already exists: " + dto.getIdBranch());
        }

        Agence agence = new Agence();
        agence.setIdBranch(dto.getIdBranch());
        agence.setLibelle(dto.getLibelle());
        agence.setWording(dto.getWording());
        agence.setIsActive(dto.getIsActive() == null ? Boolean.TRUE : dto.getIsActive());
        agenceRepository.persist(agence);
        return toResponse(agence);
    }

    public List<AgenceResponseDTO> listAll() {
        return agenceRepository.listAll().stream().map(this::toResponse).toList();
    }

    public AgenceResponseDTO getById(String id) {
        Agence agence = agenceRepository.findByIdOptional(id)
                .orElseThrow(() -> new AgenceNotFoundException("Agence not found: " + id));
        return toResponse(agence);
    }

    @Transactional
    public AgenceResponseDTO update(String id, AgenceUpdateDTO dto, UUID actorId) {
        Agence agence = agenceRepository.findByIdOptional(id)
                .orElseThrow(() -> new AgenceNotFoundException("Agence not found: " + id));

        if (dto.getLibelle() != null) {
            agence.setLibelle(dto.getLibelle());
        }
        if (dto.getWording() != null) {
            agence.setWording(dto.getWording());
        }
        if (dto.getIsActive() != null) {
            agence.setIsActive(dto.getIsActive());
        }

        return toResponse(agence);
    }

    private AgenceResponseDTO toResponse(Agence agence) {
        return AgenceResponseDTO.builder()
                .idBranch(agence.getIdBranch())
                .libelle(agence.getLibelle())
                .wording(agence.getWording())
                .active(agence.getIsActive())
                .build();
    }
}

