import api from "./api";
import type {
  Demande,
  DemandeCreateRequest,
  DemandeListParams,
  DemandeStatut,
  DemandeUpdateRequest,
} from "@/types/demande.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEMANDE_API_BASE_URL = (import.meta as any).env.VITE_DEMANDE_API_URL || "http://localhost:8083";

export const demandeService = {
  getAll: (params?: DemandeListParams) => {
    return api.get<Demande[]>("/api/demandes", { baseURL: DEMANDE_API_BASE_URL, params });
  },

  getById: (id: number) => {
    return api.get<Demande>(`/api/demandes/${id}`, { baseURL: DEMANDE_API_BASE_URL });
  },

  create: (payload: DemandeCreateRequest) => {
    return api.post<Demande>("/api/demandes", payload, { baseURL: DEMANDE_API_BASE_URL });
  },

  update: (id: number, payload: DemandeUpdateRequest) => {
    return api.put<Demande>(`/api/demandes/${id}`, payload, { baseURL: DEMANDE_API_BASE_URL });
  },

  submit: (id: number) => {
    return api.post<Demande>(`/api/demandes/${id}/submit`, {}, { baseURL: DEMANDE_API_BASE_URL });
  },

  updateStatus: (id: number, status: Extract<DemandeStatut, "VALIDATED" | "REJECTED">) => {
    return api.patch<Demande>(
      `/api/demandes/${id}/statut`,
      { status },
      { baseURL: DEMANDE_API_BASE_URL }
    );
  },

  remove: (id: number) => {
    return api.delete(`/api/demandes/${id}`, { baseURL: DEMANDE_API_BASE_URL });
  },
};
