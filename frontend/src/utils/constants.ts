export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'CrediWise';

export const STORAGE_KEYS = {
  TOKEN: 'cw_token',
  USER: 'cw_user',
} as const;

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TECH_USER: 'TECH_USER',
  GESTIONNAIRE: 'GESTIONNAIRE',
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Session expired. Please login again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  GENERIC: 'An unexpected error occurred.',
} as const;
