/**
 * RoleGuard — role-based route and component protection
 *
 * Security design:
 *   - Checks against `user.roles` (the FULL set of roles from the JWT),
 *     not just `user.role` (the single primary role). A user with multiple
 *     roles (e.g. both FRONT_OFFICE and CRO) would be incorrectly blocked
 *     by a single-role check.
 *   - While `isLoading` is true the Keycloak token has not yet been parsed;
 *     we render nothing rather than briefly flashing protected content, which
 *     would be a TOCTOU (time-of-check / time-of-use) race condition.
 *   - On role mismatch we redirect to /dashboard rather than /login, because
 *     the user IS authenticated — they just lack the required permission.
 *     Redirecting to /login would confuse users who are already logged in.
 *
 * This is UI-only enforcement — the backend @RolesAllowed annotations are the
 * authoritative access control boundary. RoleGuard only prevents accidental
 * rendering; it does not prevent a determined attacker from calling the API.
 */
import { Navigate } from 'react-router-dom';
import { useCrediWiseRoles } from '@/hooks/useCrediWiseRoles';

interface RoleGuardProps {
  /** At least one of these roles must be present for the child to render. */
  allowedRoles: string[];
  children: React.ReactNode;
  /**
   * Where to redirect on role mismatch.
   * Defaults to /dashboard (user is authed, just lacks the role).
   */
  redirectTo?: string;
}

const RoleGuard = ({
  allowedRoles,
  children,
  redirectTo = '/dashboard',
}: RoleGuardProps) => {
  const { roles, isLoading } = useCrediWiseRoles();

  // While auth is initialising, render nothing — avoids a flash of protected
  // content before the token has been parsed and roles populated.
  if (isLoading) {
    return null;
  }

  // Check the full role set, not just the primary role.
  const permitted = allowedRoles.some((required) => roles.includes(required));

  if (!permitted) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
