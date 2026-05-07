package org.acme.config;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * Security helpers for Keycloak OIDC integration.
 *
 * Keycloak handles token validation automatically via quarkus-oidc.
 * This bean provides helper methods for endpoint-level security checks.
 *
 * Token structure (Keycloak crediwise realm):
 *   sub            = Keycloak user UUID
 *   email          = user email
 *   preferred_username = username (same as email in our setup)
 *   realm_access.roles = [SUPER_ADMIN, FRONT_OFFICE, ...]
 *   realm_roles    = realm roles array (via custom mapper)
 *   role           = primary role (single-value via custom mapper)
 *   resource_access.crediwise-backend.roles = client-scoped roles
 *   agenceId       = branch ID (via custom mapper)
 *   aud            = [crediwise-backend] (via audience mapper)
 */
@ApplicationScoped
public class SecurityConfig {

    /**
     * Extract current user ID from Keycloak JWT.
     * Returns the Keycloak subject (UUID).
     */
    public static String getCurrentUserId(JsonWebToken jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("JWT token is null");
        }
        String userId = jwt.getSubject();
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("JWT subject claim missing");
        }
        return userId;
    }

    /**
     * Extract user email from Keycloak JWT.
     */
    public static String getCurrentUserEmail(JsonWebToken jwt) {
        if (jwt == null) return null;
        Object email = jwt.getClaim("email");
        if (email != null) return email.toString();
        Object upn = jwt.getClaim("preferred_username");
        return upn != null ? upn.toString() : null;
    }

    /**
     * Extract organization/tenant (agenceId) from Keycloak JWT custom claim.
     */
    public static String getCurrentTenant(JsonWebToken jwt) {
        if (jwt == null) return null;
        Object agenceId = jwt.getClaim("agenceId");
        return agenceId != null ? agenceId.toString() : null;
    }

    /**
     * Verify IDOR: user can only access their own resources.
     */
    public static void verifyAccess(String currentUserId, String resourceOwnerId) {
        if (currentUserId == null || resourceOwnerId == null) {
            throw new jakarta.ws.rs.ForbiddenException("Access denied: invalid ownership");
        }
        if (!currentUserId.equals(resourceOwnerId)) {
            throw new jakarta.ws.rs.ForbiddenException("Access denied: you do not own this resource");
        }
    }

    /**
     * Check if user has a specific realm role.
     * Quarkus OIDC maps realm_access.roles to SecurityIdentity roles
     * which are accessible via jwt.getGroups().
     */
    public static boolean hasRole(JsonWebToken jwt, String role) {
        if (jwt == null || jwt.getGroups() == null) {
            return false;
        }
        return jwt.getGroups().contains(role);
    }

    /**
     * Safe logging helper: extract subject for audit logs.
     * NEVER log the raw token string.
     */
    public static String getSubjectForLogging(JsonWebToken jwt) {
        if (jwt == null) return "anonymous";
        String sub = jwt.getSubject();
        return sub != null ? sub : "unknown";
    }
}
