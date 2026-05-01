// Client types aligned with backend Client microservice DTOs

// ── Enums ──────────────────────────────────────────────────────────────────
export type ClientType = 'PHYSICAL' | 'LEGAL';

export type ClientStatus = 'PROSPECT' | 'ACTIVE';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type SituationFamiliale =
  | 'OTHER'
  | 'SINGLE'
  | 'DIVORCED'
  | 'MARRIED'
  | 'SEPARATED'
  | 'WIDOWER';

export type RelationAvecClient = 'SUPPLIER' | 'CLIENT' | 'NEIGHBOUR' | 'OTHER';

// ── Response DTO ────────────────────────────────────────────────────────────
export interface Client {
  id: string;
  clientType: ClientType;
  status: ClientStatus;

  // Physical person
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;       // ISO date string
  nationalId?: string;
  taxIdentifier?: string;
  gender?: Gender;
  situationFamiliale?: SituationFamiliale;
  nationality?: string;
  monthlyIncome?: number;

  // Legal entity
  companyName?: string;
  sigle?: string;
  registrationNumber?: string;
  principalInterlocutor?: string;

  // Contact
  email?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  addressStreet?: string;
  addressCity?: string;
  addressPostal?: string;
  addressCountry?: string;

  // Local references (with resolved names)
  segmentId?: number;
  segmentLibelle?: string;
  accountTypeId?: number;
  accountTypeLibelle?: string;
  secteurActiviteId?: number;
  secteurActiviteLibelle?: string;
  activiteId?: number;
  activiteLibelle?: string;
  sousActiviteId?: number;
  sousActiviteLibelle?: string;
  mappingRisqueActiviteId?: number;
  ifcLevelOfRisk?: string;

  // External references (resolved via gRPC)
  agenceId?: string;
  agenceLibelle?: string;
  assignedManagerId?: string;
  managerFullName?: string;

  // Other
  relationAvecClient?: RelationAvecClient;
  relationAvecClientOther?: string;
  accountNumber?: string;
  accountTypeCustomName?: string;
  scoring?: string;
  cycle?: number;
  cbsId?: string;
  attributes?: Record<string, unknown>;

  // Audit
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// ── Create Request ──────────────────────────────────────────────────────────
export interface ClientCreateRequest {
  clientType: ClientType;

  // Physical person
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationalId?: string;
  taxIdentifier?: string;
  gender?: Gender;
  situationFamiliale?: SituationFamiliale;
  nationality?: string;
  monthlyIncome?: number;

  // Legal entity
  companyName?: string;
  sigle?: string;
  registrationNumber?: string;
  principalInterlocutor?: string;

  // Contact
  email?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  addressStreet?: string;
  addressCity?: string;
  addressPostal?: string;
  addressCountry?: string;

  // Local references
  segmentId?: number;
  accountTypeId?: number;
  secteurActiviteId?: number;
  activiteId?: number;
  sousActiviteId?: number;
  mappingRisqueActiviteId?: number;

  // External references
  agenceId?: string;
  assignedManagerId?: string;

  // Other
  relationAvecClient?: RelationAvecClient;
  relationAvecClientOther?: string;
  accountNumber?: string;
  accountTypeCustomName?: string;
  scoring?: string;
  cycle?: number;
  cbsId?: string;
  attributes?: Record<string, unknown>;
}

// ── Update Request ──────────────────────────────────────────────────────────
export interface ClientUpdateRequest {
  status?: ClientStatus;

  // Physical person
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationalId?: string;
  taxIdentifier?: string;
  gender?: Gender;
  situationFamiliale?: SituationFamiliale;
  nationality?: string;
  monthlyIncome?: number;

  // Legal entity
  companyName?: string;
  sigle?: string;
  registrationNumber?: string;
  principalInterlocutor?: string;

  // Contact
  email?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  addressStreet?: string;
  addressCity?: string;
  addressPostal?: string;
  addressCountry?: string;

  // Local references
  segmentId?: number;
  accountTypeId?: number;
  secteurActiviteId?: number;
  activiteId?: number;
  sousActiviteId?: number;
  mappingRisqueActiviteId?: number;

  // External references
  agenceId?: string;
  assignedManagerId?: string;

  // Other
  relationAvecClient?: RelationAvecClient;
  relationAvecClientOther?: string;
  accountNumber?: string;
  accountTypeCustomName?: string;
  scoring?: string;
  cycle?: number;
  cbsId?: string;
  attributes?: Record<string, unknown>;
}

// ── Smart search result (lightweight, no gRPC enrichment) ───────────────────
export interface ClientSearchResult {
  id: string;
  clientType: ClientType;
  status: ClientStatus;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  nationalId?: string;
  primaryPhone?: string;
  email?: string;
  cbsId?: string;
  agenceId?: string;
}

// ── List query params ────────────────────────────────────────────────────────
export interface ClientListParams {
  page?: number;
  size?: number;
  status?: ClientStatus;
  agenceId?: string;
}
