export type Navigation = '<5k' | '>5k';

export interface RegleAffichage {
  id: number;
  conditionLabel?: string;
  pays?: string;
  productId?: string;
  productName?: string;
  /** Comparison operator for the lower bound (e.g. ">=", ">", "="). */
  opInf?: string;
  borneInf?: number;
  /** Comparison operator for the upper bound (e.g. "<=", "<", "="). */
  opSup?: string;
  borneSup?: number;
  navigation: Navigation;
  /** Incremented each time the rule is edited. v1 = original. */
  version: number;
  /** false when this rule row has been superseded by a newer edit. */
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegleAffichageRequest {
  conditionLabel?: string;
  pays?: string;
  productId?: string;
  productName?: string;
  /** Comparison operator for the lower bound (e.g. ">=", ">", "="). */
  opInf?: string;
  borneInf?: number;
  /** Comparison operator for the upper bound (e.g. "<=", "<", "="). */
  opSup?: string;
  borneSup?: number;
  navigation: Navigation;
}

export interface ProductOption {
  productId: string;
  name: string;
}
