package org.acme.security;

import io.quarkus.security.UnauthorizedException;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.time.Instant;
import java.util.Map;

/**
 * Maps UnauthorizedException to a safe 401 response.
 * No stack trace, no token content, no internal URLs in the body.
 */
@Provider
public class UnauthorizedExceptionMapper implements ExceptionMapper<UnauthorizedException> {

    @Inject
    jakarta.inject.Provider<JsonWebToken> jwtProvider;

    @Context
    UriInfo uriInfo;

    @Override
    public Response toResponse(UnauthorizedException exception) {
        String sub = resolveSub();
        String endpoint = uriInfo != null ? uriInfo.getPath() : "unknown";

        SecurityAuditObserver.logAuthorizationFailure(sub, endpoint, "UnauthorizedException", null);

        return Response.status(Response.Status.UNAUTHORIZED)
                .type(MediaType.APPLICATION_JSON)
                .entity(Map.of(
                    "error", "Unauthorized",
                    "message", "Authentication required",
                    "timestamp", Instant.now().toString()
                ))
                .build();
    }

    private String resolveSub() {
        try {
            JsonWebToken jwt = jwtProvider.get();
            return jwt != null ? jwt.getSubject() : null;
        } catch (Exception e) {
            return null;
        }
    }
}
