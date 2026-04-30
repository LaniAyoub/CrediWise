import api from './api';
import type { LoginRequest, LoginResponse } from '@/types/auth.types';

export const authService = {
  login: (credentials: LoginRequest) => {
    return api.post<LoginResponse>('/api/auth/login', credentials);
  },

  logout: (sessionDurationMs?: number) => {
    return api.post('/api/auth/logout', { sessionDurationMs });
  },

  healthCheck: () => {
    return api.get('/api/auth/health');
  },
};
