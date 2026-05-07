/**
 * useCrediWiseRoles — role introspection hook
 *
 * Security model:
 *   Roles are read from the VERIFIED JWT access token that Keycloak issued and
 *   that keycloak-js cryptographically validated (signature + expiry) during init.
 *   The `user.roles` array is built in extractUser() from:
 *     - realm_access.roles      (realm-level roles, e.g. SUPER_ADMIN)
 *     - resource_access.crediwise-backend.roles  (client-scoped roles, G-021)
 *   Keycloak infrastructure roles (offline_access, uma_authorization, etc.)
 *   are filtered out so only CrediWise app roles appear.
 *
 * NOTE: This is UI-level access control — it controls what the user SEES.
 *   Every backend endpoint enforces the same role set server-side via @RolesAllowed.
 *   An attacker who modifies React state or localStorage cannot gain actual access
 *   to the API because the backend independently validates the JWT.
 *
 * Usage:
 *   const { hasRole, hasAnyRole, hasAllRoles, roles } = useCrediWiseRoles();
 *   if (hasRole('SUPER_ADMIN')) { ... }
 *   if (hasAnyRole(['CRO', 'BRANCH_DM'])) { ... }
 */
import { useMemo } from 'react';
import { useAuth } from '@/context/auth';

export interface CrediWiseRolesResult {
  /** Full set of effective roles for this user. */
  roles: string[];
  /** True while the auth state is still initializing (token not yet available). */
  isLoading: boolean;
  /** Returns true if the user has the specified role. */
  hasRole: (role: string) => boolean;
  /** Returns true if the user has at least one of the specified roles. */
  hasAnyRole: (roles: string[]) => boolean;
  /** Returns true if the user has ALL of the specified roles. */
  hasAllRoles: (roles: string[]) => boolean;
}

export function useCrediWiseRoles(): CrediWiseRolesResult {
  const { user, isLoading } = useAuth();

  const roles = useMemo(() => user?.roles ?? [], [user]);

  const hasRole = useMemo(
    () => (role: string) => roles.includes(role),
    [roles]
  );

  const hasAnyRole = useMemo(
    () => (required: string[]) => required.some((r) => roles.includes(r)),
    [roles]
  );

  const hasAllRoles = useMemo(
    () => (required: string[]) => required.every((r) => roles.includes(r)),
    [roles]
  );

  return { roles, isLoading, hasRole, hasAnyRole, hasAllRoles };
}
