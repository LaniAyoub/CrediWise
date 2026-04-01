// Agence types aligned with backend DTOs

export interface Agence {
  idBranch: string;
  libelle: string;
  wording: string;
  active: boolean;
}

export interface AgenceCreateRequest {
  idBranch: string;
  libelle: string;
  wording?: string;
  isActive?: boolean;
}

export interface AgenceUpdateRequest {
  libelle?: string;
  wording?: string;
  isActive?: boolean;
}
