import { createContext, useContext } from 'react';
import type { User, KeycloakTokenParsed } from '@/types/auth.types';

/**
 * Roles that are internal Keycloak infrastructure — not CrediWise app roles.
 * Filtered out everywhere we build the user's effective role set.
 */
const KC_INTERNAL_ROLES = new Set([
  'default-roles-crediwise',
  'offline_access',
  'uma_authorization',
  'app-user',
  'app-admin',
]);

export interface AuthContextType {
  user: User | null;
  /**
   * Raw JWT access token — held in React state (memory) ONLY.
   *
   * Security rationale: tokens in localStorage are readable by ANY JavaScript
   * on the page, including injected scripts from XSS. Memory storage means an
   * injected script would need to extract the value from a React fiber, which is
   * much harder and not persistent across page reloads (no exfiltration at rest).
   *
   * Token survival across page reload: Keycloak's session cookie (HttpOnly,
   * SameSite=Lax, set by the Keycloak server) keeps the SSO session alive.
   * On reload the silent SSO check iframe silently re-acquires a fresh token
   * from Keycloak without a visible redirect.
   */
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Build the effective role set for a token.
 * Sources (union, deduped):
 *   1. realm_access.roles   — standard Keycloak realm roles
 *   2. resource_access.crediwise-backend.roles — client-scoped roles (G-021)
 *   3. realm_roles           — custom mapper output (legacy support)
 *
 * Filters out Keycloak infrastructure roles (offline_access etc.) so that
 * RoleGuard only needs to reason about CrediWise app roles.
 */
export function extractRoles(tokenParsed: KeycloakTokenParsed): string[] {
  const seen = new Set<string>();
  const add = (r: string) => {
    if (!KC_INTERNAL_ROLES.has(r)) seen.add(r);
  };

  tokenParsed.realm_access?.roles?.forEach(add);
  tokenParsed.resource_access?.['crediwise-backend']?.roles?.forEach(add);
  // realm_roles custom mapper — kept for backward compatibility
  tokenParsed.realm_roles?.forEach(add);

  return [...seen];
}

/**
 * Extract User from Keycloak parsed token.
 * Custom claim mappers in the Keycloak realm provide:
 *   - role (single realm role mapper — primary role)
 *   - realm_roles (all realm roles as array)
 *   - agenceId (user attribute mapper)
 *   - resource_access.crediwise-backend.roles (client-scoped roles)
 * Standard OIDC profile scope provides given_name, family_name.
 */
export function extractUser(tokenParsed: KeycloakTokenParsed, idTokenParsed?: KeycloakTokenParsed): User {
  const roles = extractRoles(tokenParsed);

  // Primary role: prefer the explicit 'role' custom mapper claim,
  // then fall back to the first role in the effective set.
  const role =
    (tokenParsed.role && !KC_INTERNAL_ROLES.has(tokenParsed.role)
      ? tokenParsed.role
      : null) ?? roles[0] ?? '';

  // given_name / family_name may only be in the ID token (profile scope default).
  // Fall back to idTokenParsed when the access token doesn't carry them.
  const firstName = tokenParsed.given_name || idTokenParsed?.given_name || '';
  const lastName = tokenParsed.family_name || idTokenParsed?.family_name || '';

  return {
    id: tokenParsed.sub || tokenParsed.preferred_username || tokenParsed.email || '',
    email: tokenParsed.email || tokenParsed.preferred_username || '',
    firstName,
    lastName,
    role,
    roles,
    agenceId: tokenParsed.agenceId,
  };
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
