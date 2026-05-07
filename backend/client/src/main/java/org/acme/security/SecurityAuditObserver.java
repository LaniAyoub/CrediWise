package org.acme.security;

import io.quarkus.logging.Log;
import io.quarkus.security.spi.runtime.AuthenticationFailureEvent;
import io.quarkus.security.spi.runtime.AuthorizationFailureEvent;
import io.vertx.ext.web.RoutingContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.time.Instant;

/**
 * Observes Quarkus security events and emits structured JSON audit logs
 * for every authentication failure (401) and authorization failure (403).
 *
 * Never logs token content — only sub, endpoint, timestamp, and client IP.
 */
@ApplicationScoped
public class SecurityAuditObserver {

    @Inject
    JsonWebToken jwt;

    @Inject
    RoutingContext routingContext;

    public void onAuthenticationFailure(@Observes AuthenticationFailureEvent event) {
        String endpoint = safeEndpoint();
        String clientIp = safeClientIp();

        Log.warnf(
                "{\"event\":\"AUTHENTICATION_FAILURE\",\"sub\":null,\"endpoint\":\"%s\",\"timestamp\":\"%s\",\"clientIp\":\"%s\"}",
                endpoint, Instant.now(), clientIp
        );
    }

    public void onAuthorizationFailure(@Observes AuthorizationFailureEvent event) {
        String sub = safeSub();
        String endpoint = safeEndpoint();
        String clientIp = safeClientIp();

        Log.warnf(
                "{\"event\":\"AUTHORIZATION_FAILURE\",\"sub\":\"%s\",\"endpoint\":\"%s\",\"timestamp\":\"%s\",\"clientIp\":\"%s\"}",
                sub, endpoint, Instant.now(), clientIp
        );
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

    private String safeClientIp() {
        try {
            if (routingContext == null || routingContext.request() == null) return "unknown";
            String forwarded = routingContext.request().getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",")[0].trim();
            }
            return routingContext.request().remoteAddress() != null
                    ? routingContext.request().remoteAddress().host()
                    : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }
}
