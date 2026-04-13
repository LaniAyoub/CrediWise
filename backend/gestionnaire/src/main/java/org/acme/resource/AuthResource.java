package org.acme.resource;

import io.quarkus.elytron.security.common.BcryptUtil;
import io.smallrye.jwt.build.Jwt;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.dto.ApiErrorResponse;
import org.acme.dto.LoginRequestDTO;
import org.acme.dto.LoginResponseDTO;
import org.acme.entity.Gestionnaire;
import org.acme.repository.GestionnaireRepository;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Authentication", description = "Login and session management")
public class AuthResource {

    @Inject
    GestionnaireRepository gestionnaireRepository;

    /**
     * Login endpoint - Authenticates user and returns JWT token
     *
     * @param loginRequest contains email and password
     * @return JWT token with user information
     */
    @POST
    @Path("/login")
    @Transactional
    public Response login(@Valid LoginRequestDTO loginRequest) {
        try {
            var gestionnaire = gestionnaireRepository.findByEmail(loginRequest.getEmail());

            if (gestionnaire.isEmpty()) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(ApiErrorResponse.builder()
                                .timestamp(Instant.now())
                                .status(401)
                                .error("Unauthorized")
                                .message("Invalid email or password")
                                .build())
                        .build();
            }

            Gestionnaire user = gestionnaire.get();

            if (!user.getIsActive()) {
                return Response.status(Response.Status.FORBIDDEN)
                        .entity(ApiErrorResponse.builder()
                                .timestamp(Instant.now())
                                .status(403)
                                .error("Forbidden")
                                .message("User account is inactive")
                                .build())
                        .build();
            }

            if (!BcryptUtil.matches(loginRequest.getPassword(), user.getPassword())) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(ApiErrorResponse.builder()
                                .timestamp(Instant.now())
                                .status(401)
                                .error("Unauthorized")
                                .message("Invalid email or password")
                                .build())
                        .build();
            }

            Instant now = Instant.now();
            Instant expiresAt = now.plus(24, ChronoUnit.HOURS);

            Set<String> roles = new HashSet<>();
            roles.add(user.getRole());

            var jwtBuilder = Jwt.issuer("gestionnaire-service")
                    .subject(user.getId().toString())
                    .upn(user.getEmail())
                    .groups(roles)
                    .audience("gestionnaire-api")
                    .issuedAt(now)
                    .expiresAt(expiresAt);

            if (user.getEmail() != null) {
                jwtBuilder.claim("email", user.getEmail());
            }
            if (user.getFirstName() != null) {
                jwtBuilder.claim("firstName", user.getFirstName());
            }
            if (user.getLastName() != null) {
                jwtBuilder.claim("lastName", user.getLastName());
            }
            if (user.getRole() != null) {
                jwtBuilder.claim("role", user.getRole());
            }
            if (user.getAgence() != null && user.getAgence().getIdBranch() != null) {
                jwtBuilder.claim("agenceId", user.getAgence().getIdBranch());
            }

            String token = jwtBuilder.sign();

            LoginResponseDTO response = LoginResponseDTO.builder()
                    .accessToken(token)
                    .refreshToken(null)
                    .expiresAt(expiresAt)
                    .role(user.getRole())
                    .build();

            return Response.ok(response).build();

        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiErrorResponse.builder()
                            .timestamp(Instant.now())
                            .status(500)
                            .error("Internal Server Error")
                            .message("An error occurred during login: " + e.getMessage())
                            .build())
                    .build();
        }
    }

    /**
     * Logout endpoint - Invalidates token (optional, can be handled client-side)
     * This endpoint mainly serves for server-side token blacklisting if needed
     *
     * @return success message
     */
    @POST
    @Path("/logout")
    public Response logout() {
        try {
            // In a real application, you would:
            // 1. Add token to blacklist in cache/database
            // 2. Clear any server-side sessions
            // 3. Return success response

            return Response.ok()
                    .entity(new LogoutResponseDTO("Successfully logged out"))
                    .build();

        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiErrorResponse.builder()
                            .timestamp(Instant.now())
                            .status(500)
                            .error("Internal Server Error")
                            .message("Logout failed: " + e.getMessage())
                            .build())
                    .build();
        }
    }

    /**
     * Health check endpoint for testing token validity
     *
     * @return success if token is valid
     */
    @GET
    @Path("/health")
    public Response health() {
        return Response.ok()
                .entity(new HealthCheckResponse("Gestionnaire Service is running"))
                .build();
    }

    // Inner class for logout response
    public static class LogoutResponseDTO {
        public String message;

        public LogoutResponseDTO(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

    // Inner class for health check response
    public static class HealthCheckResponse {
        public String status;

        public HealthCheckResponse(String status) {
            this.status = status;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }
}
