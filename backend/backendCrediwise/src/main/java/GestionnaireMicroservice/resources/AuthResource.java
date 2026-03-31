package GestionnaireMicroservice.resources;

import GestionnaireMicroservice.dto.LoginRequest;
import GestionnaireMicroservice.services.AuthService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    AuthService authService;

    @POST
    @Path("/login")
    public Response login(LoginRequest request) {
        if (request.email == null || request.password == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Email et password obligatoires").build();
        }

        try {
            String token = authService.login(request.email, request.password);

            // Retourner le token dans un objet JSON
            return Response.ok(Map.of("token", token)).build();

        } catch (RuntimeException e) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(Map.of("error", e.getMessage())).build();
        }
    }
}