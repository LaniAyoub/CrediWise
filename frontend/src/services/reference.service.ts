import api from "./api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CLIENT_API_BASE_URL =
  (import.meta as any).env.VITE_CLIENT_API_URL || "http://localhost:8082";

export interface ReferenceItem {
  id: number;
  libelle: string;
}

export const referenceService = {
  getSegments: () =>
    api.get<ReferenceItem[]>("/api/clients/references/segments", {
      baseURL: CLIENT_API_BASE_URL,
    }),

  getAccountTypes: () =>
    api.get<ReferenceItem[]>("/api/clients/references/account-types", {
      baseURL: CLIENT_API_BASE_URL,
    }),

  getSecteurActivites: () =>
    api.get<ReferenceItem[]>("/api/clients/references/secteur-activites", {
      baseURL: CLIENT_API_BASE_URL,
    }),

  getSousActivites: () =>
    api.get<ReferenceItem[]>("/api/clients/references/sous-activites", {
      baseURL: CLIENT_API_BASE_URL,
    }),

  getSousActivitesBySecteur: (secteurActiviteId: number) =>
    api.get<ReferenceItem[]>("/api/clients/references/sous-activites", {
      baseURL: CLIENT_API_BASE_URL,
      params: { secteurActiviteId },
    }),
};
