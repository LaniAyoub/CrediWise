import { createContext, useContext } from 'react';
import type { User, JwtPayload } from '@/types/auth.types';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Decode JWT token payload (base64)
export function decodeToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// Extract User from JWT payload
export function extractUser(payload: JwtPayload): User {
  return {
    id: payload.sub,
    email: payload.email || payload.upn,
    firstName: payload.firstName || '',
    lastName: payload.lastName || '',
    role: payload.role || (payload.groups?.[0] ?? ''),
    agenceId: payload.agenceId,
  };
}

// Check if token is expired
export function isTokenExpired(payload: JwtPayload): boolean {
  return Date.now() >= payload.exp * 1000;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
