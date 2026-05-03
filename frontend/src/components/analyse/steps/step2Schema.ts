import { z } from 'zod';

const CATEGORIES = [
  'TERRAIN_BATIMENT',
  'EQUIPEMENT',
  'AMENAGEMENT',
  'VEHICULE',
  'INFORMATIQUE',
  'STOCK_MARCHANDISES',
  'FONDS_DE_ROULEMENT',
  'FRAIS_DEMARRAGE',
  'AUTRE',
] as const;

export const depenseRowSchema = z.object({
  id: z.number().optional(),
  description: z
    .string()
    .min(1, 'Description requise')
    .max(500, 'Description trop longue'),
  cout: z
    .number()
    .min(0, 'Le coût ne peut pas être négatif'),
});

export const financementRowSchema = z.object({
  id: z.number().optional(),
  description: z
    .string()
    .min(1, 'Description requise')
    .max(500, 'Description trop longue'),
  montant: z
    .number()
    .min(0, 'Le montant ne peut pas être négatif'),
});

export const step2Schema = z.object({
  pertinenceProjet: z
    .string()
    .max(2000, 'Texte trop long (max 2000 caractères)')
    .optional(),
  depenses: z
    .array(depenseRowSchema)
    .min(1, 'Au moins une dépense de projet est requise'),
  financementAutre: z.array(financementRowSchema),
});

export type Step2FormValues = z.infer<typeof step2Schema>;

// Category labels for display
export const CATEGORIE_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  TERRAIN_BATIMENT: 'Terrain / Bâtiment',
  EQUIPEMENT: 'Équipement / Matériel',
  AMENAGEMENT: 'Aménagement / Travaux',
  VEHICULE: 'Véhicule / Transport',
  INFORMATIQUE: 'Informatique / Technologie',
  STOCK_MARCHANDISES: 'Stock / Marchandises',
  FONDS_DE_ROULEMENT: 'Fonds de roulement',
  FRAIS_DEMARRAGE: 'Frais de démarrage',
  AUTRE: 'Autre',
};
