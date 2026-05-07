// Gestionnaire types aligned with backend DTOs

import type { Agence } from './agence.types';

export interface Gestionnaire {
  id: string;
  email: string;
  cin: string;
  numTelephone: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  agence: Agence | null;
}

export interface GestionnaireCreateRequest {
  email: string;
  cin: string;
  numTelephone: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  address?: string;
  role: string;
  agenceId: string;
}

export interface GestionnaireUpdateRequest {
  numTelephone?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  role?: string;
  active?: boolean;
}

export interface GestionnaireAgenceUpdateRequest {
  agenceId: string;
}
