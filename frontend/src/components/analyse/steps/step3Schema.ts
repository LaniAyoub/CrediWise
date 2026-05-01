import { z } from 'zod';

export const SITUATIONS_FAMILIALES = ['MARIE', 'CELIBATAIRE', 'DIVORCE', 'SEPARE', 'VEUF', 'AUTRE'] as const;
export const SITUATIONS_LOGEMENT = ['PROPRIETAIRE', 'LOCATAIRE', 'COLOCATAIRE', 'HEBERGE_FAMILLE', 'AUTRE'] as const;
export const NOTES_CENTRALE_RISQUE = ['A', 'B', 'C', 'D', 'E'] as const;
const NOTES_RISQUE = NOTES_CENTRALE_RISQUE;

export const referenceFamilialeSchema = z.object({
  id: z.number().nullable().optional(),
  prenom: z.string().min(1, 'Prénom requis'),
  nom: z.string().min(1, 'Nom requis'),
  telephone: z.string().min(8, 'Téléphone invalide').max(20),
  lienParente: z.string().min(1, 'Lien requis'),
});

export const enqueteMoraliteSchema = z.object({
  id: z.number().nullable().optional(),
  lienAvecClient: z.string().min(1, 'Lien requis'),
  contact: z.string().min(8).max(20),
  nomComplet: z.string().min(1, 'Nom requis'),
  amplitude: z.string().nullable().optional(),
  opinion: z.string().min(1, 'Opinion requise'),
});

export const pretCoursSchema = z.object({
  id: z.number().nullable().optional(),
  nomInstitution: z.string().min(1, 'Institution requise'),
  objet: z.string().min(1, 'Objet requis'),
  dureeEnMois: z.number().int().min(1),
  montantInitial: z.number().min(0),
  encoursSolde: z.number().min(0),
  montantEcheance: z.number().min(0),
  nombreEcheancesRestantes: z.number().int().min(0),
  nombreEcheancesRetard: z.number().int().min(0),
  joursRetardMax: z.number().int().min(0),
});

export const compteBancaireSchema = z.object({
  id: z.number().nullable().optional(),
  banqueImf: z.string().min(1, 'Banque/IMF requise'),
  typeCompte: z.string().min(1, 'Type de compte requis'),
  solde: z.number().nullable().optional(),
});

export const step3Schema = z.object({
  situationFamiliale: z.enum(SITUATIONS_FAMILIALES).nullable().optional(),
  situationLogement: z.enum(SITUATIONS_LOGEMENT).nullable().optional(),
  dureeSejour: z.number().int().min(0).nullable().optional(),
  ancienneteQuartier: z.number().int().min(0).nullable().optional(),
  nombrePersonnesCharge: z.number().int().min(0).nullable().optional(),
  nombreEnfants: z.number().int().min(0).nullable().optional(),
  referenceFamiliales: z.array(referenceFamilialeSchema),
  enquetesMoralite: z.array(enqueteMoraliteSchema),
  avisComite: z.string().nullable().optional(),
  nombreCreditsAnterieurs: z.number().int().min(0).nullable().optional(),
  noteCentraleRisque: z.enum(NOTES_RISQUE).nullable().optional(),
  estGarant: z.boolean().nullable().optional(),
  pretsCours: z.array(pretCoursSchema),
  analyseCredit: z.string().nullable().optional(),
  comptesBancaires: z.array(compteBancaireSchema),
  analyseComptes: z.string().nullable().optional(),
});

export type Step3FormValues = z.infer<typeof step3Schema>;

export const SITUATION_FAMILIALE_LABELS: Record<(typeof SITUATIONS_FAMILIALES)[number], string> = {
  MARIE: 'Marié(e)',
  CELIBATAIRE: 'Célibataire',
  DIVORCE: 'Divorcé(e)',
  SEPARE: 'Séparé(e)',
  VEUF: 'Veuf / Veuve',
  AUTRE: 'Autre',
};

export const SITUATION_LOGEMENT_LABELS: Record<(typeof SITUATIONS_LOGEMENT)[number], string> = {
  PROPRIETAIRE: 'Propriétaire',
  LOCATAIRE: 'Locataire',
  COLOCATAIRE: 'Colocataire',
  HEBERGE_FAMILLE: 'Hébergé en famille',
  AUTRE: 'Autre',
};

export const NOTE_RISQUE_CONFIG: Record<(typeof NOTES_RISQUE)[number], { label: string; color: string }> = {
  A: { label: 'A — Très bon', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  B: { label: 'B — Bon', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  C: { label: 'C — Moyen', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  D: { label: 'D — Faible', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  E: { label: 'E — Très faible', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};
