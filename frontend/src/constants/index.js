// Messages de validation
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Ce champ est requis',
  INVALID_EMAIL: 'Email invalide',
  INVALID_PHONE: 'Numéro de téléphone invalide',
  MIN_LENGTH: 'La longueur minimale est',
  MAX_LENGTH: 'La longueur maximale est',
  MIN_AGE: 'Vous devez avoir au moins 18 ans',
};

// Rôles disponibles
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  CRO: 'CRO',
  BRANCH_DM: 'BRANCH_DM',
  HEAD_OFFICE_DM: 'HEAD_OFFICE_DM',
  RISK_ANALYST: 'RISK_ANALYST',
  FRONT_OFFICE: 'FRONT_OFFICE',
  READ_ONLY: 'READ_ONLY',
  TECH_USER: 'TECH_USER',
};

// Libellés des rôles
export const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Administrateur',
  CRO: 'Responsable Client',
  BRANCH_DM: 'Décideur Agence',
  HEAD_OFFICE_DM: 'Décideur Siège',
  RISK_ANALYST: 'Analyste de Risque',
  FRONT_OFFICE: 'Front Office',
  READ_ONLY: 'Utilisateur Lecture Seule',
  TECH_USER: 'Utilisateur Technique',
};

// Statuts
export const STATUS = {
  ACTIVE: true,
  INACTIVE: false,
};

// Expressions régulières
export const REGEX = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PHONE: /^[\d+\s\-()]{10,20}$/,
  CIN: /^[A-Z0-9]{5,20}$/i,
};

// Limites de caractères (basées sur la BD)
export const LIMITS = {
  FIRST_NAME: 100,
  LAST_NAME: 100,
  EMAIL: 255,
  CIN: 20,
  PHONE: 20,
  ADDRESS: 500,
  ROLE: 50,
};

// Messages d'erreur API
export const API_ERRORS = {
  NETWORK: 'Erreur de connexion au serveur',
  VALIDATION: 'Données invalides',
  UNAUTHORIZED: 'Accès non autorisé',
  FORBIDDEN: 'Vous n\'avez pas la permission',
  NOT_FOUND: 'Ressource non trouvée',
  CONFLICT: 'Cette ressource existe déjà',
  SERVER_ERROR: 'Erreur serveur',
};

// Écrans avec permissions
export const SCREENS = {
  HOME: 'HOME',
  NEW_APP: 'NEW_APP',
  LAF: 'LAF',
  CHECKLIST: 'CHECKLIST',
  CRA_FORM: 'CRA_FORM',
  LCM_FORM: 'LCM_FORM',
  VISIT_FORM: 'VISIT_FORM',
};

// Types de permissions
export const PERMISSION_TYPES = {
  READ: 'READ',
  WRITE: 'WRITE',
  PARTIAL_WRITE: 'PARTIAL_WRITE',
  ASSIGNED_WRITE: 'ASSIGNED_WRITE',
};
