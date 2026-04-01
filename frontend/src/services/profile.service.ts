import api from './api';
import type { Gestionnaire } from '@/types/gestionnaire.types';

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  numTelephone?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export const profileService = {
  getProfile: () => api.get<Gestionnaire>('/api/profile'),
  updateProfile: (data: ProfileUpdateRequest) => api.put('/api/profile', data),
  changePassword: (data: PasswordChangeRequest) => api.put('/api/profile/password', data),
};
