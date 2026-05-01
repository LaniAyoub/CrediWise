/**
 * Roles that are allowed to write in the analysis (analyse) section.
 * All other roles get read-only access.
 */
export const ANALYSE_EDITOR_ROLES = ['SUPER_ADMIN', 'CRO', 'BRANCH_DM'] as const;

export function canEditAnalyse(role: string | undefined): boolean {
  if (!role) return false;
  return (ANALYSE_EDITOR_ROLES as readonly string[]).includes(role);
}
