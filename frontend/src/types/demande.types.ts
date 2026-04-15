export type DemandeStatut = "DRAFT" | "SUBMITTED" | "VALIDATED" | "REJECTED";

export interface GuarantorDto {
  id?: string;
  name?: string;
  amplitudeId?: string;
  clientRelationship?: string;
}

export interface GuaranteeDto {
  id?: string;
  owner?: string;
  type?: string;
  estimatedValue?: number;
}

export interface Demande {
  id: number;
  clientId: string;
  clientType?: string;
  status: DemandeStatut;

  firstName?: string;
  lastName?: string;
  companyName?: string;
  managerName?: string;
  branchName?: string;

  loanPurpose?: string;
  requestedAmount?: number;
  durationMonths?: number;
  productId?: string;
  productName?: string;
  assetType?: string;
  monthlyRepaymentCapacity?: number;
  applicationChannel?: string;
  bankingRestriction?: boolean;
  legalIssueOrAccountBlocked?: boolean;
  consentText?: string;

  guarantors?: GuarantorDto[];
  guarantees?: GuaranteeDto[];

  requestDate?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
  deletedAt?: string;
}

export interface DemandeCreateRequest {
  clientId: string;
  loanPurpose: string;
  requestedAmount: number;
  durationMonths: number;
  productId?: string;
  assetType?: string;
  monthlyRepaymentCapacity?: number;
  applicationChannel?: string;
  bankingRestriction: boolean;
  legalIssueOrAccountBlocked: boolean;
  consentText?: string;
  guarantors?: GuarantorDto[];
  guarantees?: GuaranteeDto[];
}

export interface DemandeUpdateRequest {
  loanPurpose?: string;
  requestedAmount?: number;
  durationMonths?: number;
  productId?: string;
  assetType?: string;
  monthlyRepaymentCapacity?: number;
  applicationChannel?: string;
  bankingRestriction?: boolean;
  legalIssueOrAccountBlocked?: boolean;
  consentText?: string;
  guarantors?: GuarantorDto[];
  guarantees?: GuaranteeDto[];
}

export interface DemandeListParams {
  page?: number;
  size?: number;
  clientId?: string;
  statut?: DemandeStatut;
}
