import api from "./api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CLIENT_API_BASE_URL =
  (import.meta as any).env.VITE_CLIENT_API_URL || "http://localhost:8082";

export interface ReferenceItem {
  id: number;
  libelle: string;
}

export const referenceService = {
  /**
   * GET /api/segments
   * Get all segments
   */
  getSegments: () => {
    return api.get<ReferenceItem[]>("/api/segments", {
      baseURL: CLIENT_API_BASE_URL,
    });
  },

  /**
   * GET /api/account-types
   * Get all account types
   */
  getAccountTypes: () => {
    return api.get<ReferenceItem[]>("/api/account-types", {
      baseURL: CLIENT_API_BASE_URL,
    });
  },

  /**
   * GET /api/secteur-activites
   * Get all secteur d'activités
   */
  getSecteurActivites: () => {
    return api.get<ReferenceItem[]>("/api/secteur-activites", {
      baseURL: CLIENT_API_BASE_URL,
    });
  },

  /**
   * GET /api/sous-activites
   * Get all sous-activités
   */
  getSousActivites: () => {
    return api.get<ReferenceItem[]>("/api/sous-activites", {
      baseURL: CLIENT_API_BASE_URL,
    });
  },

  /**
   * GET /api/sous-activites?secteurActiviteId=:id
   * Get sous-activités by secteur d'activité
   */
  getSousActivitesBySecteur: (secteurActiviteId: number) => {
    return api.get<ReferenceItem[]>("/api/sous-activites", {
      baseURL: CLIENT_API_BASE_URL,
      params: { secteurActiviteId },
    });
  },
};
