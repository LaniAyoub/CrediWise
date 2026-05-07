// Auth types for Keycloak OIDC integration

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /**
   * Primary role — the first app-level role found (for display / simple checks).
   * For access-control decisions always use `roles` (the full set).
   */
  role: string;
  /**
   * Full set of roles for this user, union of:
   *   realm_access.roles  (realm-level roles)
   *   resource_access.crediwise-backend.roles  (client-scoped roles)
   * Used by RoleGuard and useCrediWiseRoles().
   */
  roles: string[];
  agenceId?: string;
}

export interface KeycloakTokenParsed {
  sub?: string;
  email?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  role?: string;
  agenceId?: string;
  realm_roles?: string[];
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [clientId: string]: {
      roles: string[];
    };
  };
  exp?: number;
  iat?: number;
}
