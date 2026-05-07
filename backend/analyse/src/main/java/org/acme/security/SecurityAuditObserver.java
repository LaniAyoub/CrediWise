package org.acme.security;

import io.quarkus.logging.Log;
import io.quarkus.security.AuthenticationFailedException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;

import java.time.Instant;

/**
 * Structured security audit log for authentication and authorization failures.
 * Logs JSON: { event, sub, endpoint, timestamp, clientIp }
 * Never logs token content.
 */
@ApplicationScoped
public class SecurityAuditObserver {

    /**
     * Observes authentication failures (bad/expired/missing token).
     */
    public void onAuthenticationFailure(@Observes AuthenticationFailedException event) {
        Log.warnf("{\"event\":\"AUTHENTICATION_FAILED\",\"reason\":\"%s\",\"timestamp\":\"%s\"}",
                sanitize(event.getMessage()), Instant.now());
    }

    /**
     * Structured log helper for authorization failures.
     * Called from UnauthorizedExceptionMapper and GrpcSecurityInterceptor.
     */
    public static void logAuthorizationFailure(String sub, String endpoint, String reason, String clientIp) {
        Log.warnf(
            "{\"event\":\"AUTHORIZATION_FAILED\",\"sub\":\"%s\",\"endpoint\":\"%s\",\"reason\":\"%s\",\"clientIp\":\"%s\",\"timestamp\":\"%s\"}",
            sub != null ? sub : "anonymous",
            endpoint != null ? endpoint : "unknown",
            sanitize(reason),
            clientIp != null ? clientIp : "unknown",
            Instant.now()
        );
    }

    /**
     * Structured log helper for authentication failures with request context.
     */
    public static void logAuthenticationFailure(String endpoint, String reason, String clientIp) {
        Log.warnf(
            "{\"event\":\"AUTHENTICATION_FAILED\",\"endpoint\":\"%s\",\"reason\":\"%s\",\"clientIp\":\"%s\",\"timestamp\":\"%s\"}",
            endpoint != null ? endpoint : "unknown",
            sanitize(reason),
            clientIp != null ? clientIp : "unknown",
            Instant.now()
        );
    }

    private static String sanitize(String value) {
        if (value == null) return "";
        return value.replace("\"", "'").replace("\n", " ").replace("\r", "");
    }
}
