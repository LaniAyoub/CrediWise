import api from './api';
import type { LoginRequest, LoginResponse } from '@/types/auth.types';

export const authService = {
  login: (credentials: LoginRequest) => {
    return api.post<LoginResponse>('/api/auth/login', credentials);
  },

  logout: () => {
    return api.post('/api/auth/logout');
  },

  healthCheck: () => {
    return api.get('/api/auth/health');
  },
};
