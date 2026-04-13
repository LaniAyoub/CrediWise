package org.acme.resource;

import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.dto.*;
import org.acme.entity.Gestionnaire;
import org.acme.exception.GestionnaireNotFoundException;
import org.acme.repository.GestionnaireRepository;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.time.Instant;
import java.util.UUID;

@Path("/api/profile")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Profile", description = "Manage your own profile")
@SecurityRequirement(name = "bearerAuth")
@RolesAllowed({"SUPER_ADMIN", "TECH_USER", "CRO", "BRANCH_DM", "HEAD_OFFICE_DM", "RISK_ANALYST", "FRONT_OFFICE", "READ_ONLY"})
public class ProfileResource {

    @Inject
    GestionnaireRepository gestionnaireRepository;

    @Inject
    JsonWebToken jwt;

    private Gestionnaire getCurrentUser() {
        String subject = jwt.getSubject();
        if (subject == null) throw new WebApplicationException("Unauthorized", 401);
        UUID id;
        try {
            id = UUID.fromString(subject);
        } catch (IllegalArgumentException e) {
            throw new WebApplicationException("Unauthorized", 401);
        }
        return gestionnaireRepository.findByIdOptional(id)
                .orElseThrow(() -> new GestionnaireNotFoundException("User not found"));
    }

    @GET
    public Response getProfile() {
        Gestionnaire user = getCurrentUser();
        AgenceResponseDTO agence = null;
        if (user.getAgence() != null) {
            agence = AgenceResponseDTO.builder()
                    .idBranch(user.getAgence().getIdBranch())
                    .libelle(user.getAgence().getLibelle())
                    .wording(user.getAgence().getWording())
                    .active(user.getAgence().getIsActive())
                    .build();
        }
        GestionnaireResponseDTO response = GestionnaireResponseDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .cin(user.getCin())
                .numTelephone(user.getNumTelephone())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .dateOfBirth(user.getDateOfBirth())
                .address(user.getAddress())
                .role(user.getRole())
                .active(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .agence(agence)
                .build();
        return Response.ok(response).build();
    }

    @PUT
    @Transactional
    public Response updateProfile(@Valid ProfileUpdateDTO dto) {
        Gestionnaire user = getCurrentUser();

        if (dto.getFirstName() != null && !dto.getFirstName().isBlank()) {
            user.setFirstName(dto.getFirstName());
        }
        if (dto.getLastName() != null && !dto.getLastName().isBlank()) {
            user.setLastName(dto.getLastName());
        }
        if (dto.getNumTelephone() != null && !dto.getNumTelephone().isBlank()) {
            user.setNumTelephone(dto.getNumTelephone());
        }
        if (dto.getAddress() != null) {
            user.setAddress(dto.getAddress());
        }
        if (dto.getDateOfBirth() != null) {
            user.setDateOfBirth(dto.getDateOfBirth());
        }
        user.setUpdatedBy(user.getId());

        return Response.ok().entity(java.util.Map.of("message", "Profile updated successfully")).build();
    }

    @PUT
    @Path("/password")
    @Transactional
    public Response changePassword(@Valid PasswordChangeDTO dto) {
        Gestionnaire user = getCurrentUser();

        if (!BcryptUtil.matches(dto.getCurrentPassword(), user.getPassword())) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(ApiErrorResponse.builder()
                            .timestamp(Instant.now())
                            .status(400)
                            .error("Bad Request")
                            .message("Current password is incorrect")
                            .build())
                    .build();
        }

        user.setPassword(BcryptUtil.bcryptHash(dto.getNewPassword()));
        user.setUpdatedBy(user.getId());

        return Response.ok().entity(java.util.Map.of("message", "Password changed successfully")).build();
    }
}
