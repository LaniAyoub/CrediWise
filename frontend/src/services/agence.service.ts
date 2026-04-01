import api from './api';
import type { Agence, AgenceCreateRequest, AgenceUpdateRequest } from '@/types/agence.types';

export const agenceService = {
  getAll: () => {
    return api.get<Agence[]>('/api/agences');
  },

  getById: (id: string) => {
    return api.get<Agence>(`/api/agences/${id}`);
  },

  create: (data: AgenceCreateRequest) => {
    return api.post<Agence>('/api/agences', data);
  },

  update: (id: string, data: AgenceUpdateRequest) => {
    return api.put<Agence>(`/api/agences/${id}`, data);
  },
};
