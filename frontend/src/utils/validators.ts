import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const agenceSchema = z.object({
  idBranch: z.string().min(1, 'Branch ID is required').max(10),
  libelle: z.string().min(1, 'Label is required').max(100),
  wording: z.string().max(200).optional(),
  isActive: z.boolean().optional(),
});

export const gestionnaireSchema = z.object({
  email: z.string().email('Invalid email'),
  cin: z.string().min(1, 'CIN is required').max(20),
  numTelephone: z.string().min(1, 'Phone is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  password: z.string().optional(),
  role: z.string().min(1, 'Role is required'),
  agenceId: z.string().min(1, 'Agence is required'),
});
