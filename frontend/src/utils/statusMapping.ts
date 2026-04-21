import type { DemandeStatut } from "@/types/demande.types";
import type { DossierStatus } from "@/types/analyse";

/**
 * Strict mapping between backend status enum values and frontend i18n keys.
 * Backend returns raw enum values (e.g., "ANALYSE"), which are mapped to translation keys.
 * This ensures:
 * 1. Single source of truth (backend enum)
 * 2. Consistent i18n key naming
 * 3. Type-safe status handling
 */
export const STATUS_TO_I18N_KEY: Record<DemandeStatut | DossierStatus, string> = {
  DRAFT: "dossier.status.draft",
  SUBMITTED: "dossier.status.submitted",
  ANALYSE: "dossier.status.analyse",
  CHECK_BEFORE_COMMITTEE: "dossier.status.check_before_committee",
  CREDIT_RISK_ANALYSIS: "dossier.status.credit_risk_analysis",
  COMMITTEE: "dossier.status.committee",
  WAITING_CLIENT_APPROVAL: "dossier.status.waiting_client_approval",
  READY_TO_DISBURSE: "dossier.status.ready_to_disburse",
  DISBURSE: "dossier.status.disburse",
  REJECTED: "dossier.status.rejected",
};

/**
 * Get the i18n translation key for a given status.
 * @param status - Backend status enum value (e.g., "ANALYSE")
 * @returns i18n key (e.g., "dossier.status.analyse")
 */
export const getStatusKey = (status: DemandeStatut | DossierStatus): string => {
  return STATUS_TO_I18N_KEY[status] || "dossier.status.draft";
};

/**
 * Get all available status options.
 * Useful for dropdowns, filters, etc.
 */
export const getAllStatuses = (): (DemandeStatut | DossierStatus)[] => {
  return Object.keys(STATUS_TO_I18N_KEY) as (DemandeStatut | DossierStatus)[];
};

/**
 * Get color variant for status badge/display.
 * Maps statuses to Tailwind color classes.
 */
export const getStatusColor = (
  status: DemandeStatut | DossierStatus
): {
  bg: string;
  text: string;
  border: string;
} => {
  const colorMap: Record<
    DemandeStatut | DossierStatus,
    { bg: string; text: string; border: string }
  > = {
    DRAFT: {
      bg: "bg-gray-100 dark:bg-gray-800",
      text: "text-gray-700 dark:text-gray-300",
      border: "border-gray-300 dark:border-gray-600",
    },
    SUBMITTED: {
      bg: "bg-blue-100 dark:bg-blue-900",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-300 dark:border-blue-600",
    },
    ANALYSE: {
      bg: "bg-amber-100 dark:bg-amber-900",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-300 dark:border-amber-600",
    },
    CHECK_BEFORE_COMMITTEE: {
      bg: "bg-purple-100 dark:bg-purple-900",
      text: "text-purple-700 dark:text-purple-300",
      border: "border-purple-300 dark:border-purple-600",
    },
    CREDIT_RISK_ANALYSIS: {
      bg: "bg-orange-100 dark:bg-orange-900",
      text: "text-orange-700 dark:text-orange-300",
      border: "border-orange-300 dark:border-orange-600",
    },
    COMMITTEE: {
      bg: "bg-indigo-100 dark:bg-indigo-900",
      text: "text-indigo-700 dark:text-indigo-300",
      border: "border-indigo-300 dark:border-indigo-600",
    },
    WAITING_CLIENT_APPROVAL: {
      bg: "bg-cyan-100 dark:bg-cyan-900",
      text: "text-cyan-700 dark:text-cyan-300",
      border: "border-cyan-300 dark:border-cyan-600",
    },
    READY_TO_DISBURSE: {
      bg: "bg-emerald-100 dark:bg-emerald-900",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-300 dark:border-emerald-600",
    },
    DISBURSE: {
      bg: "bg-green-100 dark:bg-green-900",
      text: "text-green-700 dark:text-green-300",
      border: "border-green-300 dark:border-green-600",
    },
    REJECTED: {
      bg: "bg-red-100 dark:bg-red-900",
      text: "text-red-700 dark:text-red-300",
      border: "border-red-300 dark:border-red-600",
    },
  };

  return colorMap[status] || colorMap.DRAFT;
};
