import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { authService } from '@/services/auth.service';
import type { ReactNode } from 'react';
import type { User, JwtPayload } from '@/types/auth.types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Decode JWT token payload (base64)
function decodeToken(token: string): JwtPayload | null {
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
function extractUser(payload: JwtPayload): User {
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
function isTokenExpired(payload: JwtPayload): boolean {
  return Date.now() >= payload.exp * 1000;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('cw_token');
      if (storedToken) {
        const payload = decodeToken(storedToken);
        if (payload && !isTokenExpired(payload)) {
          setToken(storedToken);
          setUser(extractUser(payload));
        } else {
          // Token expired or invalid — clean up
          localStorage.removeItem('cw_token');
        }
      }
    } catch (error) {
      console.error('Failed to restore auth state:', error);
      localStorage.removeItem('cw_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((newToken: string) => {
    const payload = decodeToken(newToken);
    if (!payload) {
      throw new Error('Invalid token');
    }
    localStorage.setItem('cw_token', newToken);
    localStorage.setItem('cw_login_time', Date.now().toString());
    setToken(newToken);
    setUser(extractUser(payload));
  }, []);

  const logout = useCallback(() => {
    const loginTime = parseInt(localStorage.getItem('cw_login_time') || '0', 10);
    const sessionDurationMs = loginTime > 0 ? Date.now() - loginTime : undefined;
    authService.logout(sessionDurationMs).finally(() => {
      localStorage.removeItem('cw_token');
      localStorage.removeItem('cw_login_time');
      setToken(null);
      setUser(null);
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
