package GestionnaireMicroservice.resources;

import GestionnaireMicroservice.entities.Gestionnaires;
import GestionnaireMicroservice.repositories.GestionnaireRepository;
import io.quarkus.elytron.security.common.BcryptUtil;
import io.smallrye.jwt.build.Jwt;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    GestionnaireRepository repository;

    public static class LoginRequest {
        public String email;
        public String password;
    }

    public static class AuthResponse {
        public String token;
        public String role;
        public String email;
        public String firstName;
        public String lastName;
    }

    @POST
    @Path("/login")
    public Response login(LoginRequest request) {
        if (request.email == null || request.password == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Email et mot de passe obligatoires").build();
        }

        Gestionnaires user = repository.findByEmail(request.email).orElse(null);
        if (user == null || !BcryptUtil.matches(request.password, user.password)) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("Email ou mot de passe incorrect").build();
        }

        // Génération du JWT
        String token = Jwt.issuer("https://gestionnaire-microservice")
                .upn(user.email)                    // identifiant principal
                .groups(user.role.name())           // rôle pour @RolesAllowed
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .claim("cin", user.cin)
                .claim("agence", user.agence.idBranch)
                .sign();

        AuthResponse response = new AuthResponse();
        response.token = token;
        response.role = user.role.name();
        response.email = user.email;
        response.firstName = user.firstName;
        response.lastName = user.lastName;

        return Response.ok(response).build();
    }
}