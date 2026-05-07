package org.acme.resource;

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
import java.util.UUID;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

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

    /**
     * Look up the current user from the Keycloak JWT.
     *
     * Strategy (in order):
     *  1. email claim  → find by email
     *  2. preferred_username claim → find by email (Keycloak sets this to the username/email)
     *  3. sub claim (always present) → find by keycloak_id (UUID set on first successful lookup)
     *
     * When a gestionnaire is found via email/preferred_username, their keycloak_id is
     * saved opportunistically so that future requests can fall through to strategy 3 even
     * when email/preferred_username are absent (e.g. protocol mapper not configured).
     */
    @Transactional
    Gestionnaire getCurrentUser() {
        String sub = jwt.getSubject();
        UUID keycloakUUID = null;
        try {
            if (sub != null && !sub.isBlank()) keycloakUUID = UUID.fromString(sub);
        } catch (IllegalArgumentException ignored) { }

        // Strategy 1 & 2 — look up by email / preferred_username
        String email = jwt.getClaim("email");
        if (email == null || email.isBlank()) {
            email = jwt.getClaim("preferred_username");
        }
        if (email != null && !email.isBlank()) {
            final String resolvedEmail = email;
            Gestionnaire g = gestionnaireRepository.findByEmail(resolvedEmail)
                    .orElseThrow(() -> new GestionnaireNotFoundException("User not found: " + resolvedEmail));
            // Opportunistically persist keycloak_id so sub-based lookup works next time
            if (g.getKeycloakId() == null && keycloakUUID != null) {
                g.setKeycloakId(keycloakUUID);
            }
            return g;
        }

        // Strategy 3 — email/preferred_username absent; try sub UUID as keycloak_id
        if (keycloakUUID != null) {
            final UUID fkId = keycloakUUID;
            return gestionnaireRepository.findByKeycloakId(fkId)
                    .orElseThrow(() -> new GestionnaireNotFoundException(
                            "User not found (keycloak_id=" + fkId + "). " +
                            "Configure the Keycloak 'username' protocol mapper or " +
                            "populate keycloak_id manually for this gestionnaire."));
        }

        throw new WebApplicationException("Cannot identify user from token", 401);
    }

    @GET
    @Transactional
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

    // Password change is now handled by Keycloak Account Management UI.
    // Users can change passwords at: {keycloak-url}/realms/crediwise/account
}
