/* eslint-disable react-refresh/only-export-components */
/**
 * DEPRECATED: This file is kept for backward compatibility only.
 * All imports have been updated to use the barrel export from './index.tsx'
 *
 * Import from '@/context' or '@/context/index' instead:
 *   import { AuthProvider, useAuth } from '@/context';
 *
 * The actual implementations are in:
 *   - auth.ts (context, types, useAuth hook)
 *   - AuthProvider.tsx (provider component)
 *   - index.tsx (barrel export)
 */

export { AuthContext, type AuthContextType, useAuth } from './auth';
export { AuthProvider } from './AuthProvider';
