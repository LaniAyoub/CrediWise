// Auth types aligned with backend DTOs

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string;
  role: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  agenceId?: string;
}

export interface JwtPayload {
  sub: string;         // user ID
  upn: string;         // email
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  agenceId?: string;
  groups: string[];
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}
