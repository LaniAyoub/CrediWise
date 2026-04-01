import api from './api';
import type {
  Gestionnaire,
  GestionnaireCreateRequest,
  GestionnaireUpdateRequest,
  GestionnaireAgenceUpdateRequest,
} from '@/types/gestionnaire.types';

export const gestionnaireService = {
  getAll: () => {
    return api.get<Gestionnaire[]>('/api/gestionnaires');
  },

  create: (data: GestionnaireCreateRequest) => {
    return api.post<Gestionnaire>('/api/gestionnaires', data);
  },

  update: (id: string, data: GestionnaireUpdateRequest) => {
    return api.put<Gestionnaire>(`/api/gestionnaires/${id}`, data);
  },

  delete: (id: string) => {
    return api.delete(`/api/gestionnaires/${id}`);
  },

  moveToAgence: (id: string, data: GestionnaireAgenceUpdateRequest) => {
    return api.put<Gestionnaire>(`/api/gestionnaires/${id}/agence`, data);
  },
};
