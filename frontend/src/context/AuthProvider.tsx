import { useState, useCallback, useEffect, ReactNode } from 'react';
import type { User } from '@/types/auth.types';
import { AuthContext, decodeToken, extractUser, isTokenExpired } from './auth';

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
    setToken(newToken);
    setUser(extractUser(payload));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cw_token');
    setToken(null);
    setUser(null);
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
