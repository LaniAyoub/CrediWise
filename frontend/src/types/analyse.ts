export type DossierStatus =
  | 'DRAFT'
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
  businessSectorName: string | null;
  businessActivityGroupName: string | null;
  businessActivityName: string | null;
  age: number | null;
  // Demande fields
  demandeId: number;
  loanPurpose: string | null;
  requestedAmount: number | null;
  durationMonths: number | null;
  productName: string | null;
  applicationChannel: string | null;
  bankingRestriction: boolean;
  legalIssueOrAccountBlocked: boolean;
  // General info
  agenceName: string | null;
  agenceId: string | null;
  managerName: string | null;
  cycleNumber: number | null;
  segment: string | null;
  dateDemande: string | null;
  // Editable fields
  location: string | null;
  locationDomicile: string | null;
  dateVisite: string | null;
  dateFinalisation: string | null;
  // Confirmation
  isConfirmed: boolean;
  confirmedAt: string | null;
  confirmedByName: string | null;
  lastEditedAt: string | null;
  lastEditedByName: string | null;
  dossierStatus: string | null;
  // Credit history
  creditHistory: CreditHistoriqueItem[];
}

export interface StepDepense {
  id: number | null;
  categorie: string;
  description: string;
  cout: number;
}

export interface StepFinancement {
  id: number | null;
  description: string;
  montant: number;
}

export interface StepObjetCreditData {
  dossierId: number;
  // Section A (from demande)
  objetCredit: string | null;
  montantDemande: number | null;
  dureeEnMois: number | null;
  typeProduit: string | null;
  productId: string | null;
  capaciteRemboursement: number | null;
  requestedAmount: number | null;
  // Section D
  pertinenceProjet: string | null;
  // Section B
  depenses: StepDepense[];
  // Section C
  autresFinancements: StepFinancement[];
  // Computed
  coutTotal: number;
  totalAutresFinancements: number;
  isBalanced: boolean;
  ecart: number;
  // Confirmation
  isConfirmed: boolean;
  confirmedAt: string | null;
  confirmedByName: string | null;
  lastEditedAt: string | null;
  lastEditedByName: string | null;
}

export interface StepObjetCreditRequest {
  pertinenceProjet?: string | null;
  depenses: { categorie: string; description: string; cout: number }[];
  autresFinancements: { description: string; montant: number }[];
}

export interface ReferencePersonne {
  id: number | null;
  prenom: string;
  nom: string;
  telephone: string;
  lienParente: string;
}

export interface EnqueteMoralite {
  id: number | null;
  lienAvecClient: string;
  contact: string;
  nomComplet: string;
  amplitude: string;
  opinion: string;
}

export interface PretEnCours {
  id: number | null;
  nomInstitution: string;
  objetPret: string;
  dureeEnMois: number | null;
  montantInitial: number | null;
  encoursSolde: number | null;
  montantEcheance: number | null;
  echeancesRestantes: number | null;
  echeancesRetard: number | null;
  joursRetardMax: number | null;
}

export interface CompteBancaire {
  id: number | null;
  banqueImf: string;
  typeCompte: string;
  solde: number | null;
}

export interface StepRisqueClientData {
  dossierId: number;
  situationFamiliale: string | null;
  situationFamilialeAutre: string | null;
  situationLogement: string | null;
  situationLogementAutre: string | null;
  dureeSejour: number | null;
  ancienneteQuartier: number | null;
  nombrePersonnesCharge: number | null;
  nombreEnfants: number | null;
  references: ReferencePersonne[];
  enquetes: EnqueteMoralite[];
  nombreCreditsAnterieurs: number | null;
  noteCentraleRisque: string | null;
  estGarant: boolean | null;
  avisComite: string | null;
  pretsCours: PretEnCours[];
  analyseCredit: string | null;
  comptesBancaires: CompteBancaire[];
  analyseComptes: string | null;
  isConfirmed: boolean;
  confirmedAt: string | null;
  confirmedByName: string | null;
  lastEditedAt: string | null;
  lastEditedByName: string | null;
}

export interface StepRisqueClientRequest {
  situationFamiliale?: string | null;
  situationFamilialeAutre?: string | null;
  situationLogement?: string | null;
  situationLogementAutre?: string | null;
  dureeSejour?: number | null;
  ancienneteQuartier?: number | null;
  nombrePersonnesCharge?: number | null;
  nombreEnfants?: number | null;
  references?: { prenom: string; nom: string; telephone: string; lienParente: string }[];
  enquetes?: { lienAvecClient: string; contact: string; nomComplet: string; amplitude: string; opinion: string }[];
  nombreCreditsAnterieurs?: number | null;
  noteCentraleRisque?: string | null;
  estGarant?: boolean | null;
  avisComite?: string | null;
  pretsCours?: {
    nomInstitution: string; objetPret: string; dureeEnMois?: number | null;
    montantInitial?: number | null; encoursSolde?: number | null; montantEcheance?: number | null;
    echeancesRestantes?: number | null; echeancesRetard?: number | null; joursRetardMax?: number | null;
  }[];
  analyseCredit?: string | null;
  comptesBancaires?: { banqueImf: string; typeCompte: string; solde?: number | null }[];
  analyseComptes?: string | null;
}

export interface PointDeVente {
  id: number | null;
  type: string;
  propriete: string;
  joursOuverture: string;
  horaireOuverture: string;
  surface: number | null;
  emplacement: string;
}

export interface StepRisqueCommercialData {
  dossierId: number;
  nbAnneesExperienceEmploye: number | null;
  nbAnneesExperienceManager: number | null;
  autresActivites: boolean | null;
  venteACredit: boolean | null;
  pointsDeVente: PointDeVente[];
  descriptionActiviteAnalyse: string | null;
  isConfirmed: boolean;
  confirmedAt: string | null;
  confirmedByName: string | null;
  lastEditedAt: string | null;
  lastEditedByName: string | null;
}

export interface StepRisqueCommercialRequest {
  nbAnneesExperienceEmploye?: number | null;
  nbAnneesExperienceManager?: number | null;
  autresActivites?: boolean | null;
  venteACredit?: boolean | null;
  pointsDeVente?: {
    type: string; propriete: string; joursOuverture: string;
    horaireOuverture: string; surface?: number | null; emplacement: string;
  }[];
  descriptionActiviteAnalyse?: string | null;
}

export interface StepChecklistData {
  dossierId: number;
  identityVerified: boolean;
  incomeVerified: boolean;
  businessVisitDone: boolean;
  creditHistoryChecked: boolean;
  guaranteesVerified: boolean;
  legalCheckDone: boolean;
  riskAssessmentDone: boolean;
  applicationFormComplete: boolean;
  observations: string | null;
  isConfirmed: boolean;
  confirmedAt: string | null;
  confirmedByName: string | null;
  lastEditedAt: string | null;
  lastEditedByName: string | null;
}

export interface StepChecklistRequest {
  identityVerified: boolean;
  incomeVerified: boolean;
  businessVisitDone: boolean;
  creditHistoryChecked: boolean;
  guaranteesVerified: boolean;
  legalCheckDone: boolean;
  riskAssessmentDone: boolean;
  applicationFormComplete: boolean;
  observations: string | null;
}

export interface AnalyseDossier {
  id: number;
  demandeId: number;
  clientId: string;
  gestionnaireId: string;
  status: DossierStatus;
  currentStep: number;
  createdAt: string;
  updatedAt: string | null;
  completedAt: string | null;
  demandeCreatedAt: string | null;
  appliedRuleId: number | null;
  appliedRuleVersion: number | null;
}
