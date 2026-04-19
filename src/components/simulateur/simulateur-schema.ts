import { z } from "zod/v4";
import { PARAMS_2026 } from "@/lib/paie/params/2026";

/** Heures légales mensuelles (35h × 52/12) — source unique : PARAMS_2026 */
export const HEURES_LEGALES = PARAMS_2026.heuresLegalesMensuelles;

/** Regex ISO date YYYY-MM-DD */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Regex ISO mois YYYY-MM */
const ISO_MONTH_RE = /^\d{4}-\d{2}$/;

export const simulateurSchema = z.object({
  // Salarié
  statut: z.enum(["cadre", "non_cadre"]),
  typeContrat: z.enum(["CDI", "CDD", "apprentissage", "contrat_pro", "stage"]),
  heuresContrat: z.number().min(1).max(300),
  brutMensuel: z.number().min(0),
  netCible: z.number().min(0).optional(),
  primesSoumises: z.number().min(0).optional(),
  heuresSupplementaires: z.number().min(0).optional(),
  avantagesEnNature: z.number().min(0).optional(),
  tauxPAS: z.number().min(0).max(50).optional(),
  // Absences & proratisation
  absencesNonRemunerees: z.number().min(0).optional(),
  dateEntree: z.union([z.literal(""), z.string().regex(ISO_DATE_RE, "Format attendu : YYYY-MM-DD")]).optional(),
  dateSortie: z.union([z.literal(""), z.string().regex(ISO_DATE_RE, "Format attendu : YYYY-MM-DD")]).optional(),
  moisReference: z.union([z.literal(""), z.string().regex(ISO_MONTH_RE, "Format attendu : YYYY-MM")]).optional(),
  // Régime Alsace-Moselle
  alsaceMoselle: z.boolean().optional(),
  // Apprentissage
  anneeApprenti: z.enum(["1", "2", "3"]).optional(),
  ageApprenti: z.number().min(15).max(35).optional(),
  dateDebutAvantMars2025: z.boolean().optional(),
  // Entreprise
  effectif: z.number().min(1),
  tauxATMP: z.number().min(0).max(100),
  tauxMobilite: z.number().min(0).max(30).optional(),
  // Convention collective
  conventionCode: z.string().optional(),
  // Mutuelle obligatoire (complémentaire santé)
  mutuelleActive: z.boolean().optional(),
  mutuelleMontant: z.number().min(0).optional(),
  mutuellePartEmployeur: z.number().min(50).max(100).optional(),
  // Paramètres réglementaires
  millesime: z.string(),
});

export type FormValues = z.infer<typeof simulateurSchema>;
