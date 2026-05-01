import api from './api';
import type { AnalyseDossier, StepClientData, StepObjetCreditData, StepObjetCreditRequest, StepRisqueClientData, StepRisqueClientRequest, StepRisqueCommercialData, StepRisqueCommercialRequest } from '@/types/analyse';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ANALYSE_API_BASE_URL = (import.meta as any).env.VITE_ANALYSE_API_URL || 'http://localhost:8084';

export const analyseService = {
  getDossierList: () => {
    return api.get<AnalyseDossier[]>(
      `/analyses/dossiers`,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  creerDossier: (demandeId: number, clientId?: string, demandeStatus?: string, demandeCreatedAt?: string) => {
    let url = `/analyses/dossiers?demandeId=${demandeId}`;
    if (clientId) {
      url += `&clientId=${clientId}`;
    }
    if (demandeStatus) {
      url += `&demandeStatus=${encodeURIComponent(demandeStatus)}`;
    }
    if (demandeCreatedAt) {
      url += `&demandeCreatedAt=${encodeURIComponent(demandeCreatedAt)}`;
    }
    return api.post<AnalyseDossier>(
      url,
      {},
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  getDossier: (dossierId: number) => {
    return api.get<AnalyseDossier>(
      `/analyses/dossiers/${dossierId}`,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  previewStep1: (dossierId: number) => {
    return api.get<StepClientData>(
      `/analyses/dossiers/${dossierId}/steps/1/preview`,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  saveStep1: (dossierId: number, payload: { location?: string | null; locationDomicile?: string | null; dateVisite?: string | null; dateFinalisation?: string | null }) => {
    return api.post<StepClientData>(
      `/analyses/dossiers/${dossierId}/steps/1/sauvegarder`,
      payload,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  confirmerStep1: (dossierId: number, payload: { location?: string | null; locationDomicile?: string | null; dateVisite?: string | null; dateFinalisation?: string | null }) => {
    return api.post<StepClientData>(
      `/analyses/dossiers/${dossierId}/steps/1/confirmer`,
      payload,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  getStep1: (dossierId: number) => {
    return api.get<StepClientData>(
      `/analyses/dossiers/${dossierId}/steps/1`,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  previewStep2: (dossierId: number) => {
    return api.get<StepObjetCreditData>(
      `/analyses/dossiers/${dossierId}/steps/2/preview`,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  saveStep2: (dossierId: number, data: StepObjetCreditRequest) => {
    return api.post<StepObjetCreditData>(
      `/analyses/dossiers/${dossierId}/steps/2/sauvegarder`,
      data,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  confirmStep2: (dossierId: number, data: StepObjetCreditRequest) => {
    return api.post<StepObjetCreditData>(
      `/analyses/dossiers/${dossierId}/steps/2/confirmer`,
      data,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  getStep2: (dossierId: number) => {
    return api.get<StepObjetCreditData>(
      `/analyses/dossiers/${dossierId}/steps/2`,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  previewStep3: (dossierId: number) => {
    return api.get<StepRisqueClientData>(
      `/analyses/dossiers/${dossierId}/steps/3/preview`,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  saveStep3: (dossierId: number, data: StepRisqueClientRequest) => {
    return api.post<StepRisqueClientData>(
      `/analyses/dossiers/${dossierId}/steps/3/sauvegarder`,
      data,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  confirmStep3: (dossierId: number, data: StepRisqueClientRequest) => {
    return api.post<StepRisqueClientData>(
      `/analyses/dossiers/${dossierId}/steps/3/confirmer`,
      data,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  getStep3: (dossierId: number) => {
    return api.get<StepRisqueClientData>(
      `/analyses/dossiers/${dossierId}/steps/3`,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  previewStep4: (dossierId: number) => {
    return api.get<StepRisqueCommercialData>(
      `/analyses/dossiers/${dossierId}/steps/4/preview`,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  saveStep4: (dossierId: number, data: StepRisqueCommercialRequest) => {
    return api.post<StepRisqueCommercialData>(
      `/analyses/dossiers/${dossierId}/steps/4/sauvegarder`,
      data,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  confirmStep4: (dossierId: number, data: StepRisqueCommercialRequest) => {
    return api.post<StepRisqueCommercialData>(
      `/analyses/dossiers/${dossierId}/steps/4/confirmer`,
      data,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  getStep4: (dossierId: number) => {
    return api.get<StepRisqueCommercialData>(
      `/analyses/dossiers/${dossierId}/steps/4`,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },
};

export const handleAnalyseError = (error: unknown): string => {
  const err = error as { response?: { status: number; data?: { message?: string } } };
  const status = err.response?.status;
  const message = err.response?.data?.message;

  switch (status) {
    case 404:
      return 'Dossier introuvable';
    case 403:
      return 'Accès non autorisé';
    case 409:
      return 'Un dossier existe déjà pour cette demande';
    case 503:
      return 'Service indisponible — veuillez réessayer';
    default:
      return message || 'Erreur lors du chargement';
  }
};
