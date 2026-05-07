package org.acme.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.acme.dto.AgenceResponseDTO;
import org.acme.dto.GestionnaireCreateDTO;
import org.acme.dto.GestionnaireResponseDTO;
import org.acme.dto.GestionnaireUpdateDTO;
import org.acme.entity.Agence;
import org.acme.entity.Gestionnaire;
import org.acme.entity.Role;
import org.acme.exception.AgenceNotFoundException;
import org.acme.exception.GestionnaireAlreadyExistsException;
import org.acme.exception.GestionnaireNotFoundException;
import org.acme.exception.RoleNotFoundException;
import org.acme.repository.AgenceRepository;
import org.acme.repository.GestionnaireRepository;
import org.acme.repository.RoleRepository;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class GestionnaireService {

    private final GestionnaireRepository gestionnaireRepository;
    private final AgenceRepository agenceRepository;
    private final RoleRepository roleRepository;

    public GestionnaireService(GestionnaireRepository gestionnaireRepository, AgenceRepository agenceRepository,RoleRepository roleRepository) {
        this.gestionnaireRepository = gestionnaireRepository;
        this.agenceRepository = agenceRepository;
        this.roleRepository = roleRepository;
    }


    @Transactional
    public GestionnaireResponseDTO create(GestionnaireCreateDTO dto, UUID actorId) {
        if (gestionnaireRepository.existsByEmail(dto.getEmail())) {
            throw new GestionnaireAlreadyExistsException("Email already used: " + dto.getEmail());
        }
        if (gestionnaireRepository.existsByCin(dto.getCin())) {
            throw new GestionnaireAlreadyExistsException("CIN already used: " + dto.getCin());
        }

        Agence agence = agenceRepository.findByIdOptional(dto.getAgenceId())
                .orElseThrow(() -> new AgenceNotFoundException("Agence not found: " + dto.getAgenceId()));

        Role role = roleRepository.findByCode(dto.getRole())
                .orElseThrow(() -> new RoleNotFoundException("Role not found or inactive: " + dto.getRole()));

        if (!Boolean.TRUE.equals(role.getIsActive())) {
            throw new RoleNotFoundException("Role not found or inactive: " + dto.getRole());
        }

        Gestionnaire gestionnaire = new Gestionnaire();
        gestionnaire.setEmail(dto.getEmail());
        gestionnaire.setCin(dto.getCin());
        gestionnaire.setNumTelephone(dto.getNumTelephone());
        gestionnaire.setFirstName(dto.getFirstName());
        gestionnaire.setLastName(dto.getLastName());
        gestionnaire.setDateOfBirth(dto.getDateOfBirth());
        gestionnaire.setAddress(dto.getAddress());
        // Password field removed (Keycloak is the sole identity provider)
        gestionnaire.setRole(dto.getRole());
        gestionnaire.setAgence(agence);
        gestionnaire.setIsActive(Boolean.TRUE);
        gestionnaire.setCreatedBy(actorId);
        gestionnaire.setUpdatedBy(actorId);

        gestionnaireRepository.persist(gestionnaire);
        return toResponse(gestionnaire);
    }

    @Transactional
    public List<GestionnaireResponseDTO> listAll() {
        return gestionnaireRepository.listAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public GestionnaireResponseDTO update(UUID id, GestionnaireUpdateDTO dto, UUID actorId) {
        Gestionnaire gestionnaire = gestionnaireRepository.findByIdOptional(id)
                .orElseThrow(() -> new GestionnaireNotFoundException("Gestionnaire not found: " + id));

        if (dto.getNumTelephone() != null) {
            gestionnaire.setNumTelephone(dto.getNumTelephone());
        }
        if (dto.getFirstName() != null) {
            gestionnaire.setFirstName(dto.getFirstName());
        }
        if (dto.getLastName() != null) {
            gestionnaire.setLastName(dto.getLastName());
        }
        if (dto.getDateOfBirth() != null) {
            gestionnaire.setDateOfBirth(dto.getDateOfBirth());
        }
        if (dto.getAddress() != null) {
            gestionnaire.setAddress(dto.getAddress());
        }
        if (dto.getRole() != null) {
            Role role = roleRepository.findByCode(dto.getRole())
                    .orElseThrow(() -> new RoleNotFoundException("Role not found or inactive: " + dto.getRole()));

            if (!Boolean.TRUE.equals(role.getIsActive())) {
                throw new RoleNotFoundException("Role not found or inactive: " + dto.getRole());
            }
            gestionnaire.setRole(dto.getRole());
        }
        if (dto.getActive() != null) {
            gestionnaire.setIsActive(dto.getActive());
        }

        gestionnaire.setUpdatedBy(actorId);
        return toResponse(gestionnaire);
    }

    @Transactional
    public GestionnaireResponseDTO moveToAgence(UUID id, String agenceId, UUID actorId) {
        Gestionnaire gestionnaire = gestionnaireRepository.findByIdOptional(id)
                .orElseThrow(() -> new GestionnaireNotFoundException("Gestionnaire not found: " + id));

        Agence agence = agenceRepository.findByIdOptional(agenceId)
                .orElseThrow(() -> new AgenceNotFoundException("Agence not found: " + agenceId));

        gestionnaire.setAgence(agence);
        gestionnaire.setUpdatedBy(actorId);
        return toResponse(gestionnaire);
    }

    @Transactional
    public void delete(UUID id) {
        Gestionnaire gestionnaire = gestionnaireRepository.findByIdOptional(id)
                .orElseThrow(() -> new GestionnaireNotFoundException("Gestionnaire not found: " + id));
        gestionnaireRepository.delete(gestionnaire);
    }

    private GestionnaireResponseDTO toResponse(Gestionnaire g) {
        AgenceResponseDTO agence = null;
        if (g.getAgence() != null) {
            agence = AgenceResponseDTO.builder()
                    .idBranch(g.getAgence().getIdBranch())
                    .libelle(g.getAgence().getLibelle())
                    .wording(g.getAgence().getWording())
                    .active(g.getAgence().getIsActive())
                    .build();
        }

        return GestionnaireResponseDTO.builder()
                .id(g.getId())
                .email(g.getEmail())
                .cin(g.getCin())
                .numTelephone(g.getNumTelephone())
                .firstName(g.getFirstName())
                .lastName(g.getLastName())
                .dateOfBirth(g.getDateOfBirth())
                .address(g.getAddress())
                .role(g.getRole())
                .active(g.getIsActive())
                .createdAt(g.getCreatedAt())
                .updatedAt(g.getUpdatedAt())
                .agence(agence)
                .build();
    }
}

