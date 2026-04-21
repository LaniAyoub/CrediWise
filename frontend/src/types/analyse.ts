export type DossierStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ANALYSE'
  | 'CHECK_BEFORE_COMMITTEE'
  | 'CREDIT_RISK_ANALYSIS'
  | 'COMMITTEE'
  | 'WAITING_CLIENT_APPROVAL'
  | 'READY_TO_DISBURSE'
  | 'DISBURSE'
  | 'REJECTED';

export interface CreditHistoriqueItem {
  demandeId: number;
  status: string;
  requestedAmount: string;
  durationMonths: number;
  productName: string;
  loanPurpose: string;
  managerName: string;
  applicationChannel: string;
  bankingRestriction: boolean;
  legalIssueOrAccountBlocked: boolean;
  guarantorsCount: number;
  guaranteesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StepClientData {
  // Client fields
  clientId: string;
  clientType: string;
  status: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  nationalId: string;
  taxIdentifier: string | null;
  gender: string;
  maritalStatus: string;
  nationality: string;
  monthlyIncome: number | null;
  companyName: string;
  sigle: string;
  registrationNumber: string;
  principalInterlocutor: string;
  email: string;
  primaryPhone: string;
  secondaryPhone: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressPostal: string | null;
  addressCountry: string | null;
  accountNumber: string | null;
  segmentId: string | null;
  accountTypeId: string | null;
  secteurActiviteId: string | null;
  sousActiviteId: string | null;
  mappingRisqueActiviteId: string | null;
  ifcLevelOfRisk: string | null;
  segmentName: string | null;
  accountTypeName: string | null;
  businessSectorName: string | null;
  businessActivityName: string | null;
  agenceId: string | null;
  assignedManagerId: string;
  relationAvecClient: string | null;
  relationAvecClientOther: string | null;
  accountTypeCustomName: string | null;
  scoring: string;
  cycle: number;
  cbsId: string | null;
  clientCreatedAt: string;
  clientUpdatedAt: string;

  // Agence fields
  agenceIdBranch: string | null;
  agenceLibelle: string | null;
  agenceWording: string | null;
  agenceIsActive: boolean | null;

  // Credit history
  historiqueCredits: CreditHistoriqueItem[];
  nombreDemandesPassees: number;
  nombreDemandesApprouvees: number;
  nombreDemandesRejetees: number;

  // Metadata
  isComplete: boolean;
  confirmedBy: string | null;
  confirmedByName: string | null;
  confirmedAt: string | null;
  dataFetchedAt: string | null;
  agenceDataAvailable: boolean;
  warningMessage: string | null;

  // User Input
  location: string | null;

  // Demande Info
  demandeCreatedAt: string | null;
  dossierStatus: string | null;

  // Manager Info
  assignedManagerName: string | null;
  assignedManagerEmail: string | null;
  assignedManagerRole: string | null;
}

export interface AnalyseDossier {
  id: number;
  demandeId: number;
  clientId: string;
  gestionnaireId: string;
  status: DossierStatus;
  currentStep: number;
  demandeCreatedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  completedAt: string | null;
}

// ═══ STEP 2: OBJET DU CRÉDIT ═══

export type CategorieDepense =
  | 'TERRAIN_BATIMENT'
  | 'EQUIPEMENT'
  | 'AMENAGEMENT'
  | 'VEHICULE'
  | 'INFORMATIQUE'
  | 'STOCK_MARCHANDISES'
  | 'FONDS_DE_ROULEMENT'
  | 'FRAIS_DEMARRAGE'
  | 'AUTRE';

export interface DepenseProjetDto {
  id?: number;
  categorie: CategorieDepense;
  description: string;
  cout: number;
}

export interface FinancementAutreDto {
  id?: number;
  description: string;
  montant: number;
}

export interface StepObjetCreditData {
  // Section A (read-only snapshot from demande):
  loanPurpose: string | null;
  requestedAmount: number | null;
  durationMonths: number | null;
  productId: string | null;
  productName: string | null;
  monthlyRepaymentCapacity: number | null;

  // Section D (Project relevance):
  pertinenceProjet: string | null;

  // Section B (Project expenses):
  depenses: DepenseProjetDto[];
  totalCostExpenses: number;

  // Section C (Other financing):
  financementAutre: FinancementAutreDto[];
  totalOtherFinancing: number;

  // Balance calculation:
  isBalanced: boolean;
  balanceMessage: string | null;

  // Metadata:
  isComplete: boolean;
  confirmedBy: string | null;
  confirmedByName: string | null;
  confirmedAt: string | null;
  dataFetchedAt: string | null;

  // Dossier context:
  dossierId: number;
  demandeId: number;
  dossierStatus: string;
  demandeCreatedAt: string | null;
}

export interface StepObjetCreditRequest {
  pertinenceProjet?: string;
  depenses: DepenseProjetDto[];
  financementAutre: FinancementAutreDto[];
}
