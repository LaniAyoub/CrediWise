import api from './api';
import type {
  Client,
  ClientCreateRequest,
  ClientUpdateRequest,
  ClientListParams,
  ClientSearchResult,
} from '@/types/client.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CLIENT_API_BASE_URL = (import.meta as any).env.VITE_CLIENT_API_URL || 'http://localhost:8082';

export const clientService = {
  /**
   * GET /api/clients
   * List all clients with optional pagination and filters.
   */
  getAll: (params?: ClientListParams) => {
    return api.get<Client[]>('/api/clients', { baseURL: CLIENT_API_BASE_URL, params });
  },

  /**
   * GET /api/clients/{id}
   * Get a single client by UUID.
   */
  getById: (id: string) => {
    return api.get<Client>(`/api/clients/${id}`, { baseURL: CLIENT_API_BASE_URL });
  },

  /**
   * GET /api/clients/search?q=...&limit=12
   * Smart fuzzy search across name, CIN, phone, email, cbsId.
   * Returns ranked lightweight results for the dropdown.
   */
  smartSearch: (q: string, limit = 12) => {
    return api.get<ClientSearchResult[]>('/api/clients/search', {
      baseURL: CLIENT_API_BASE_URL,
      params: { q, limit },
    });
  },

  /**
   * GET /api/clients/search?national_id=...&primary_phone=...
   * Legacy exact-match search kept for backwards compatibility.
   */
  search: (query: { national_id?: string; primary_phone?: string }) => {
    return api.get<Client>('/api/clients/search', { baseURL: CLIENT_API_BASE_URL, params: query });
  },

  /**
   * POST /api/clients
   * Create a new client. Roles: SUPER_ADMIN, CRO, FRONT_OFFICE.
   */
  create: (data: ClientCreateRequest) => {
    return api.post<Client>('/api/clients', data, { baseURL: CLIENT_API_BASE_URL });
  },

  /**
   * PUT /api/clients/{id}
   * Update an existing client. Roles: SUPER_ADMIN, CRO, FRONT_OFFICE.
   */
  update: (id: string, data: ClientUpdateRequest) => {
    return api.put<Client>(`/api/clients/${id}`, data, { baseURL: CLIENT_API_BASE_URL });
  },

  /**
   * DELETE /api/clients/{id}
   * Delete a client. Role: SUPER_ADMIN only.
   */
  delete: (id: string) => {
    return api.delete(`/api/clients/${id}`, { baseURL: CLIENT_API_BASE_URL });
  },
};
