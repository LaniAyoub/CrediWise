import api from './api';
import type { AnalyseDossier, StepClientData, StepObjetCreditData, StepObjetCreditRequest, StepRisqueClientData, StepRisqueClientRequest, StepRisqueCommercialData, StepRisqueCommercialRequest, StepRisqueFinancierData, StepRisqueFinancierRequest, ScoringResult, ScoringRequestPayload } from '@/types/analyse';

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

  previewStep5: (dossierId: number) => {
    return api.get<StepRisqueFinancierData>(
      `/analyses/dossiers/${dossierId}/steps/5/preview`,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  saveStep5: (dossierId: number, data: StepRisqueFinancierRequest) => {
    return api.post<StepRisqueFinancierData>(
      `/analyses/dossiers/${dossierId}/steps/5/sauvegarder`,
      data,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  confirmStep5: (dossierId: number, data: StepRisqueFinancierRequest) => {
    return api.post<StepRisqueFinancierData>(
      `/analyses/dossiers/${dossierId}/steps/5/confirmer`,
      data,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  getStep5: (dossierId: number) => {
    return api.get<StepRisqueFinancierData>(
      `/analyses/dossiers/${dossierId}/steps/5`,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  computeScoring: (payload: ScoringRequestPayload) => {
    // Ensure all required fields are present before sending
    const validPayload = {
      demandeId: payload.demandeId,
      clientId: payload.clientId || undefined,
      dateOfBirth: payload.dateOfBirth,
      requestDate: payload.requestDate,
      bankingEntryDate: payload.bankingEntryDate || undefined,
      maritalStatus: payload.maritalStatus || undefined,
      monthlyIncome: payload.monthlyIncome,
      requestedAmount: payload.requestedAmount,
      durationMonths: payload.durationMonths,
      interestRate: payload.interestRate || undefined,
      hasSavingsAccount: payload.hasSavingsAccount || undefined,
      bankingRestriction: payload.bankingRestriction ?? false,
      legalIssueOrAccountBlocked: payload.legalIssueOrAccountBlocked ?? false,
    };
    return api.post<ScoringResult>(
      `/api/scoring`,
      validPayload,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },

  getScoring: (demandeId: number) => {
    return api.get<ScoringResult>(
      `/api/scoring/${demandeId}`,
      { baseURL: ANALYSE_API_BASE_URL }
    );
  },
};

export const handleAnalyseError = (error: unknown): string => {
  const err = error as {
    response?: {
      status: number;
      statusText?: string;
      data?: { message?: string; error?: string }
    },
    message?: string;
    code?: string;
  };
  const status = err.response?.status;
  const message = err.response?.data?.message || err.response?.data?.error;
  const statusText = err.response?.statusText;

  // Specific status codes
  if (status === 404) {
    return 'Dossier ou ressource introuvable';
  }
  if (status === 401) {
    return 'Non authentifié — Veuillez vous reconnecter';
  }
  if (status === 403) {
    return 'Accès non autorisé';
  }
  if (status === 409) {
    return 'Un dossier existe déjà pour cette demande';
  }
  if (status === 500) {
    return message || 'Erreur serveur — Veuillez réessayer plus tard';
  }
  if (status === 503) {
    return 'Service indisponible — veuillez réessayer';
  }

  // Network/timeout errors
  if (err.code === 'ECONNABORTED') {
    return 'Requête dépassée — Veuillez réessayer';
  }
  if (!err.response) {
    return 'Erreur réseau — Vérifiez votre connexion';
  }

  // Fallback to server message or generic error
  return message || statusText || 'Erreur lors du chargement';
};
