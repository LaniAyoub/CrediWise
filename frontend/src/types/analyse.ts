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
  situationFamiliale?: string | null;
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
  // Optional aliases used by StepClientView
  isComplete?: boolean;
  warningMessage?: string | null;
  agenceDataAvailable?: boolean;
  agenceLibelle?: string | null;
  assignedManagerName?: string | null;
  cycle?: number | null;
  segmentName?: string | null;
  demandeCreatedAt?: string | null;
  nombreDemandesPassees?: number;
  nombreDemandesApprouvees?: number;
  nombreDemandesRejetees?: number;
  historiqueCredits?: CreditHistoriqueItem[];
}

export interface StepDepense {
  id: number | null;
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
  // Demande field aliases used by StepObjetCreditView
  loanPurpose?: string | null;
  durationMonths?: number | null;
  productName?: string | null;
  assetType?: string | null;
  monthlyRepaymentCapacity?: number | null;
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
  // Alias used by StepObjetCreditView form mapping
  financementAutre?: StepFinancement[];
  // Confirmation
  isConfirmed: boolean;
  isComplete?: boolean;
  confirmedAt: string | null;
  confirmedByName: string | null;
  lastEditedAt: string | null;
  lastEditedByName: string | null;
}

export interface StepObjetCreditRequest {
  pertinenceProjet?: string | null;
  depenses: { description: string; cout: number }[];
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
  idAmplitude?: string | null;
  amplitude: string;
  opinion: string;
}

export interface PretEnCours {
  id?: number | null;
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

// Form-facing type used by step3Schema, LoanModal, LoansTable (matches Zod schema — no nulls)
export interface PretCoursDto {
  id?: number | null;
  nomInstitution: string;
  objet: string;
  dureeEnMois: number;
  montantInitial: number;
  encoursSolde: number;
  montantEcheance: number;
  nombreEcheancesRestantes: number;
  nombreEcheancesRetard: number;
  joursRetardMax: number;
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
  // Aliases used by StepRisqueClientView (form field names)
  referenceFamiliales?: ReferencePersonne[];
  enquetesMoralite?: EnqueteMoralite[];
  nombreCreditsAnterieurs: number | null;
  noteCentraleRisque: string | null;
  estGarant: boolean | null;
  avisComite: string | null;
  pretsCours: PretCoursDto[];
  analyseCredit: string | null;
  comptesBancaires: CompteBancaire[];
  analyseComptes: string | null;
  isConfirmed: boolean;
  isComplete?: boolean;
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
  enquetes?: { lienAvecClient: string; contact: string; nomComplet: string; idAmplitude?: string; amplitude: string; opinion: string }[];
  referenceFamiliales?: { prenom: string; nom: string; telephone: string; lienParente: string }[];
  enquetesMoralite?: { lienAvecClient: string; contact: string; nomComplet: string; idAmplitude?: string; amplitude?: string; opinion: string }[];
  nombreCreditsAnterieurs?: number | null;
  noteCentraleRisque?: string | null;
  estGarant?: boolean | null;
  avisComite?: string | null;
  pretsCours?: Partial<PretCoursDto>[];
  analyseCredit?: string | null;
  comptesBancaires?: { banqueImf: string; typeCompte: string; solde?: number | null }[];
  analyseComptes?: string | null;
}

export interface PointDeVente {
  id?: number | null;
  type: string;
  propriete: string;
  joursOuverture: string;
  horaireOuverture: string;
  surface: number | null;
  emplacement: string;
}

// Alias used by StepRisqueCommercialView (form-state type)
export type PointDeVenteDto = PointDeVente;

export interface StepRisqueCommercialData {
  dossierId: number;
  nbAnneesExperienceEmploye: number | null;
  nbAnneesExperienceManager: number | null;
  autresActivites: boolean | null;
  venteACredit: boolean | null;
  pointsDeVente: PointDeVente[];
  descriptionActiviteAnalyse: string | null;
  
  ifcLevelOfRisk?: string | null;
  listeExclusionAdvans: boolean | null;
  regleAlcoolTabac: string | null;
  regleMedicamentsNonReglementes: string | null;
  travailForceOuEnfants: boolean | null;
  risqueSanteSecuriteEmployes: boolean | null;
  impactNegatifEnvironnement: boolean | null;
  activiteVulnerableClimat: boolean | null;
  activiteZoneExposeeClimat: boolean | null;
  exigencesLegalesSpecifiques: string | null;
  clientConformite: boolean | null;

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

  listeExclusionAdvans?: boolean | null;
  regleAlcoolTabac?: string | null;
  regleMedicamentsNonReglementes?: string | null;
  travailForceOuEnfants?: boolean | null;
  risqueSanteSecuriteEmployes?: boolean | null;
  impactNegatifEnvironnement?: boolean | null;
  activiteVulnerableClimat?: boolean | null;
  activiteZoneExposeeClimat?: boolean | null;
  exigencesLegalesSpecifiques?: string | null;
  clientConformite?: boolean | null;
}

export interface StepRisqueFinancierData {
  dossierId: number;
  notes: string | null;
  isConfirmed: boolean;
  confirmedAt: string | null;
  confirmedByName: string | null;
  lastEditedAt: string | null;
  lastEditedByName: string | null;
}

export interface StepRisqueFinancierRequest {
  notes?: string | null;
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

// ── Scoring ───────────────────────────────────────────────────────────────────
export type DecisionType = 'ACCEPTE' | 'A_ETUDIER' | 'REFUSE';

export interface ScoringResult {
  demandeId: number | null;
  clientId: string | null;
  scoredAt: string | null;
  // DRG sub-decisions
  drgAge: DecisionType;
  drgAnciennete: DecisionType;
  drgBudget: DecisionType;
  drgFichage: DecisionType;
  drgOffre: DecisionType;
  decisionDRG: DecisionType;
  // DSS score
  scoreBrut: number;
  scoreAjuste: number;
  decisionDSS: DecisionType;
  // Final
  decisionSysteme: DecisionType;
  // Breakdown — only available when freshly computed, not when loaded from DB
  scoreDetails?: Record<string, number>;
}

export interface ScoringRequestPayload {
  demandeId: number | null;
  clientId?: string | null;
  dateOfBirth: string;
  requestDate: string;
  bankingEntryDate?: string | null;
  maritalStatus?: string | null;
  monthlyIncome: number;
  requestedAmount: number;
  durationMonths: number;
  interestRate?: number | null;
  hasSavingsAccount?: boolean | null;
  bankingRestriction: boolean;
  legalIssueOrAccountBlocked: boolean;
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
