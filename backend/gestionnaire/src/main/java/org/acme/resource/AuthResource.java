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
import org.acme.service.AuthEventService;
import org.eclipse.microprofile.jwt.JsonWebToken;
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

    @Inject GestionnaireRepository gestionnaireRepository;
    @Inject AuthEventService        authEventService;
    @Inject JsonWebToken            jwt;

    // ------------------------------------------------------------------
    // POST /api/auth/login
    // ------------------------------------------------------------------
    @POST
    @Path("/login")
    @Transactional
    public Response login(@Valid LoginRequestDTO loginRequest) {
        try {
            var found = gestionnaireRepository.findByEmail(loginRequest.getEmail());

            if (found.isEmpty()) {
                authEventService.recordLogin(failedLogin(null, "User not found"));
                return unauthorized("Invalid email or password");
            }

            Gestionnaire user = found.get();

            if (!user.getIsActive()) {
                authEventService.recordLogin(failedLogin(user, "Account inactive"));
                return forbidden("User account is inactive");
            }

            if (!BcryptUtil.matches(loginRequest.getPassword(), user.getPassword())) {
                authEventService.recordLogin(failedLogin(user, "Invalid password"));
                return unauthorized("Invalid email or password");
            }

            Instant now       = Instant.now();
            Instant expiresAt = now.plus(24, ChronoUnit.HOURS);
            String  sessionId = UUID.randomUUID().toString();

            Set<String> roles = new HashSet<>();
            roles.add(user.getRole());

            var jwtBuilder = Jwt.issuer("gestionnaire-service")
                    .subject(user.getId().toString())
                    .upn(user.getEmail())
                    .groups(roles)
                    .audience("gestionnaire-api")
                    .issuedAt(now)
                    .expiresAt(expiresAt)
                    .claim("sessionId", sessionId);

            if (user.getEmail() != null)     jwtBuilder.claim("email",     user.getEmail());
            if (user.getFirstName() != null) jwtBuilder.claim("firstName", user.getFirstName());
            if (user.getLastName() != null)  jwtBuilder.claim("lastName",  user.getLastName());
            if (user.getRole() != null)      jwtBuilder.claim("role",      user.getRole());
            if (user.getAgence() != null && user.getAgence().getIdBranch() != null)
                jwtBuilder.claim("agenceId", user.getAgence().getIdBranch());

            String token = jwtBuilder.sign();

            // Record successful login
            var data = new AuthEventService.LoginEventData();
            data.userId    = user.getId();
            data.username  = user.getEmail();
            data.userRole  = user.getRole();
            data.agencyId  = user.getAgence() != null ? user.getAgence().getIdBranch() : null;
            data.agencyName= user.getAgence() != null ? user.getAgence().getLibelle()  : null;
            data.success   = true;
            data.sessionId = sessionId;
            authEventService.recordLogin(data);

            return Response.ok(LoginResponseDTO.builder()
                    .accessToken(token)
                    .refreshToken(null)
                    .expiresAt(expiresAt)
                    .role(user.getRole())
                    .build()).build();

        } catch (Exception e) {
            return serverError("An error occurred during login: " + e.getMessage());
        }
    }

    // ------------------------------------------------------------------
    // POST /api/auth/logout
    // ------------------------------------------------------------------
    @POST
    @Path("/logout")
    public Response logout() {
        try {
            var data = new AuthEventService.LogoutEventData();
            try {
                data.userId    = UUID.fromString(jwt.getSubject());
                data.username  = jwt.getName();
                data.userRole  = jwt.getClaim("role");
                data.agencyId  = jwt.getClaim("agenceId");
                data.sessionId = jwt.getClaim("sessionId");
            } catch (Exception ignored) {
                // JWT absent or expired — still record the logout
            }
            authEventService.recordLogout(data);

            return Response.ok(new LogoutResponseDTO("Successfully logged out")).build();

        } catch (Exception e) {
            return serverError("Logout failed: " + e.getMessage());
        }
    }

    // ------------------------------------------------------------------
    // GET /api/auth/health
    // ------------------------------------------------------------------
    @GET
    @Path("/health")
    public Response health() {
        return Response.ok(new HealthCheckResponse("Gestionnaire Service is running")).build();
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private AuthEventService.LoginEventData failedLogin(Gestionnaire user, String reason) {
        var d = new AuthEventService.LoginEventData();
        if (user != null) {
            d.userId    = user.getId();
            d.username  = user.getEmail();
            d.userRole  = user.getRole();
            d.agencyId  = user.getAgence() != null ? user.getAgence().getIdBranch() : null;
            d.agencyName= user.getAgence() != null ? user.getAgence().getLibelle()  : null;
        }
        d.success       = false;
        d.failureReason = reason;
        return d;
    }

    private Response unauthorized(String msg) {
        return Response.status(Response.Status.UNAUTHORIZED)
                .entity(ApiErrorResponse.builder().timestamp(Instant.now())
                        .status(401).error("Unauthorized").message(msg).build()).build();
    }

    private Response forbidden(String msg) {
        return Response.status(Response.Status.FORBIDDEN)
                .entity(ApiErrorResponse.builder().timestamp(Instant.now())
                        .status(403).error("Forbidden").message(msg).build()).build();
    }

    private Response serverError(String msg) {
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(ApiErrorResponse.builder().timestamp(Instant.now())
                        .status(500).error("Internal Server Error").message(msg).build()).build();
    }

    // ---- inner DTOs ----

    public static class LogoutResponseDTO {
        public String message;
        public LogoutResponseDTO(String m) { this.message = m; }
        public String getMessage() { return message; }
        public void setMessage(String m) { this.message = m; }
    }

    public static class HealthCheckResponse {
        public String status;
        public HealthCheckResponse(String s) { this.status = s; }
        public String getStatus() { return status; }
        public void setStatus(String s) { this.status = s; }
    }
}
