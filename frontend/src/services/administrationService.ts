import api from './api';
import type { RegleAffichage, RegleAffichageRequest, ProductOption } from '@/types/regleAffichage.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ANALYSE_API = (import.meta as any).env.VITE_ANALYSE_API_URL || 'http://localhost:8084';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEMANDE_API = (import.meta as any).env.VITE_DEMANDE_API_URL || 'http://localhost:8083';

export const administrationService = {
  // ── Règles d'affichage ────────────────────────────────────────────────────

  /** Returns only active rules. */
  listRegles: () =>
    api.get<RegleAffichage[]>('/analyses/regles', { baseURL: ANALYSE_API }),

  /** Get any rule by ID — includes inactive ones (for staleness checks). */
  getRegle: (id: number) =>
    api.get<RegleAffichage>(`/analyses/regles/${id}`, { baseURL: ANALYSE_API }),

  createRegle: (data: RegleAffichageRequest) =>
    api.post<RegleAffichage>('/analyses/regles', data, { baseURL: ANALYSE_API }),

  /**
   * Edit a rule: soft-deletes the current version, creates version+1.
   * Returns the new rule row (with new id).
   */
  updateRegle: (id: number, data: RegleAffichageRequest) =>
    api.put<RegleAffichage>(`/analyses/regles/${id}`, data, { baseURL: ANALYSE_API }),

  deleteRegle: (id: number) =>
    api.delete(`/analyses/regles/${id}`, { baseURL: ANALYSE_API }),

  // ── Applied-rule tracking ─────────────────────────────────────────────────

  /**
   * Record which rule was applied when a dossier was opened.
   * Only writes if the ruleId has changed (idempotent on backend).
   */
  applyRuleToDossier: (dossierId: number, ruleId: number, ruleVersion: number) =>
    api.patch(
      `/analyses/dossiers/${dossierId}/applied-rule`,
      { ruleId, ruleVersion },
      { baseURL: ANALYSE_API }
    ),

  // ── Products (from nouvelle_demande service) ──────────────────────────────
  listProducts: () =>
    api.get<ProductOption[]>('/api/products', { baseURL: DEMANDE_API }),
};
