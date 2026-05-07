package org.acme.security;

import io.quarkus.security.spi.runtime.AuthenticationFailureEvent;
import io.quarkus.security.spi.runtime.AuthorizationFailureEvent;
import io.quarkus.security.spi.runtime.SecurityEvent;
import io.quarkus.vertx.http.runtime.security.HttpSecurityUtils;
import io.vertx.ext.web.RoutingContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import org.jboss.logging.Logger;

import java.time.Instant;

/**
 * Observes Quarkus security events and logs structured audit entries.
 * Covers G-008: structured 401/403 logging with sub + endpoint + timestamp.
 *
 * NEVER logs token content — only the subject claim identifier.
 */
@ApplicationScoped
public class SecurityAuditObserver {

    private static final Logger LOG = Logger.getLogger(SecurityAuditObserver.class);

    public void onAuthenticationFailure(@Observes AuthenticationFailureEvent event) {
        RoutingContext rc = extractRoutingContext(event);
        String endpoint = rc != null ? rc.request().method() + " " + rc.request().path() : "unknown";
        String clientIp = rc != null ? rc.request().remoteAddress().host() : "unknown";
        String sub = extractSub(event);

        LOG.warnf(
            "{\"event\":\"AUTHENTICATION_FAILURE\",\"sub\":\"%s\",\"endpoint\":\"%s\",\"clientIp\":\"%s\",\"timestamp\":\"%s\",\"reason\":\"%s\"}",
            sub, endpoint, clientIp, Instant.now().toString(),
            event.getAuthenticationFailure() != null ? event.getAuthenticationFailure().getClass().getSimpleName() : "unknown"
        );
    }

    public void onAuthorizationFailure(@Observes AuthorizationFailureEvent event) {
        RoutingContext rc = extractRoutingContext(event);
        String endpoint = rc != null ? rc.request().method() + " " + rc.request().path() : "unknown";
        String clientIp = rc != null ? rc.request().remoteAddress().host() : "unknown";
        String sub = "anonymous";
        if (event.getSecurityIdentity() != null && event.getSecurityIdentity().getPrincipal() != null) {
            sub = event.getSecurityIdentity().getPrincipal().getName();
        }

        LOG.warnf(
            "{\"event\":\"AUTHORIZATION_FAILURE\",\"sub\":\"%s\",\"endpoint\":\"%s\",\"clientIp\":\"%s\",\"timestamp\":\"%s\",\"reason\":\"%s\"}",
            sub, endpoint, clientIp, Instant.now().toString(),
            event.getAuthorizationFailure() != null ? event.getAuthorizationFailure().getClass().getSimpleName() : "forbidden"
        );
    }

    private RoutingContext extractRoutingContext(SecurityEvent event) {
        if (event.getEventProperties() == null) return null;
        Object rc = event.getEventProperties().get(HttpSecurityUtils.ROUTING_CONTEXT_ATTRIBUTE);
        return rc instanceof RoutingContext ? (RoutingContext) rc : null;
    }

    private String extractSub(AuthenticationFailureEvent event) {
        if (event.getSecurityIdentity() != null && event.getSecurityIdentity().getPrincipal() != null) {
            return event.getSecurityIdentity().getPrincipal().getName();
        }
        return "anonymous";
    }
}
