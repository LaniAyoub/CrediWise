package org.acme.security;

import io.quarkus.logging.Log;
import io.quarkus.security.UnauthorizedException;
import io.vertx.ext.web.RoutingContext;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.time.Instant;
import java.util.Map;

/**
 * Maps {@link UnauthorizedException} (Quarkus 401) to a safe JSON response.
 * <p>
 * Never leaks stack traces, token content, or internal URLs.
 */
@Provider
public class UnauthorizedExceptionMapper implements ExceptionMapper<UnauthorizedException> {

    @Inject
    JsonWebToken jwt;

    @Inject
    RoutingContext routingContext;

    @Override
    public Response toResponse(UnauthorizedException exception) {
        String sub = safeSub();
        String endpoint = safeEndpoint();

        Log.warnf("401 Unauthorized: sub=%s endpoint=%s", sub, endpoint);

        return Response.status(Response.Status.UNAUTHORIZED)
                .type(MediaType.APPLICATION_JSON)
                .entity(Map.of(
                        "timestamp", Instant.now().toString(),
                        "status", 401,
                        "error", "Unauthorized",
                        "message", "Authentication required"
                ))
                .build();
    }

    private String safeSub() {
        try {
            return jwt != null && jwt.getSubject() != null ? jwt.getSubject() : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }

    private String safeEndpoint() {
        try {
            return routingContext != null && routingContext.request() != null
                    ? routingContext.request().method().name() + " " + routingContext.request().path()
                    : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }
}
