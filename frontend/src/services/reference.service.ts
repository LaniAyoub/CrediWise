import api from "./api";

const CLIENT_API_BASE_URL =
  import.meta.env.VITE_CLIENT_API_URL || "http://localhost:8082";

export interface ReferenceItem {
  id: number;
  libelle: string;
}

export const referenceService = {
  /**
   * GET /api/segments
   * Get all segments
   */
  async getSegments(): Promise<ReferenceItem[]> {
    const response = await api.get<ReferenceItem[]>("/api/segments", {
      baseURL: CLIENT_API_BASE_URL,
    });
    return response.data;
  },

  /**
   * GET /api/account-types
   * Get all account types
   */
  async getAccountTypes(): Promise<ReferenceItem[]> {
    const response = await api.get<ReferenceItem[]>("/api/account-types", {
      baseURL: CLIENT_API_BASE_URL,
    });
    return response.data;
  },

  /**
   * GET /api/secteur-activites
   * Get all secteur d'activités
   */
  async getSecteurActivites(): Promise<ReferenceItem[]> {
    const response = await api.get<ReferenceItem[]>("/api/secteur-activites", {
      baseURL: CLIENT_API_BASE_URL,
    });
    return response.data;
  },

  /**
   * GET /api/sous-activites
   * Get all sous-activités
   */
  async getSousActivites(): Promise<ReferenceItem[]> {
    const response = await api.get<ReferenceItem[]>("/api/sous-activites", {
      baseURL: CLIENT_API_BASE_URL,
    });
    return response.data;
  },

  /**
   * GET /api/activites?secteurActiviteId=:id
   * Get activités by secteur d'activité
   */
  async getActivitesBySecteur(
    secteurActiviteId: number
  ): Promise<ReferenceItem[]> {
    const response = await api.get<ReferenceItem[]>("/api/activites", {
      baseURL: CLIENT_API_BASE_URL,
      params: { secteurActiviteId },
    });
    return response.data;
  },

  /**
   * GET /api/sous-activites?secteurActiviteId=:id
   * Get sous-activités by secteur d'activité
   */
  async getSousActivitesBySecteur(
    secteurActiviteId: number
  ): Promise<ReferenceItem[]> {
    const response = await api.get<ReferenceItem[]>("/api/sous-activites", {
      baseURL: CLIENT_API_BASE_URL,
      params: { secteurActiviteId },
    });
    return response.data;
  },

  /**
   * GET /api/sous-activites?activiteId=:id
   * Get sous-activités by activite
   */
  async getSousActivitesByActivite(
    activiteId: number
  ): Promise<ReferenceItem[]> {
    const response = await api.get<ReferenceItem[]>("/api/sous-activites", {
      baseURL: CLIENT_API_BASE_URL,
      params: { activiteId },
    });
    return response.data;
  },
};
