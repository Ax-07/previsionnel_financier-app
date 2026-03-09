import { z } from "zod/v4";

// ── Listes de référence ──────────────────────────────────────────────────────

export const HYPOTHESES_DIVERS = [
  { value: "LIMITE", label: "Limite" },
  { value: "BASSE", label: "Basse" },
  { value: "NORMAL", label: "Normale" },
  { value: "HAUTE", label: "Haute" },
  { value: "COMMUNE", label: "Commune" },
] as const;

export const TYPES_DIVERS_FLUX = [
  { value: "REMBOURSEMENT_CC", label: "Remboursements C/C" },
  { value: "DIVIDENDE", label: "Dividendes" },
  { value: "DEBLOCAGE_PARTICIPATION", label: "Déblocages participation" },
  { value: "ENCAISSEMENT", label: "Encaissements" },
  { value: "DECAISSEMENT", label: "Décaissements" },
] as const;

export const TYPES_OPERATION_CAPITAL = [
  { value: "AUGMENTATION_INCORPORATION", label: "Augmentation par incorporation de réserves" },
  { value: "REDUCTION", label: "Réduction de capital" },
] as const;

export const PERIODICITES_PRET = [
  { value: "MENSUELLE", label: "Mensuelle" },
  { value: "TRIMESTRIELLE", label: "Trimestrielle" },
  { value: "ANNUELLE", label: "Annuelle" },
] as const;

// ── Schemas Zod ──────────────────────────────────────────────────────────────

/** Flux daté sur 3 exercices — remboursements C/C, dividendes, déblocages, encaissements, décaissements */
export const diversFluxDateSchema = z.object({
  id: z.string().optional(),
  actif: z.boolean().default(true),
  libelle: z.string().min(1, "Requis").max(255),
  hypothese: z.string().optional(),
  type: z.enum([
    "REMBOURSEMENT_CC",
    "DIVIDENDE",
    "DEBLOCAGE_PARTICIPATION",
    "ENCAISSEMENT",
    "DECAISSEMENT",
  ]),
  dateN: z.string().optional(),
  montantN: z.number().min(0, "≥ 0"),
  dateN1: z.string().optional(),
  montantN1: z.number().min(0, "≥ 0"),
  dateN2: z.string().optional(),
  montantN2: z.number().min(0, "≥ 0"),
  ordre: z.number().int().default(0),
});

export type DiversFluxDateRow = z.infer<typeof diversFluxDateSchema>;

/** Opérations en capital : augmentation par incorporation de réserves et réduction */
export const diversOperationCapitalSchema = z.object({
  id: z.string().optional(),
  actif: z.boolean().default(true),
  libelle: z.string().min(1, "Requis").max(255),
  hypothese: z.string().optional(),
  type: z.enum(["AUGMENTATION_INCORPORATION", "REDUCTION"]),
  date: z.string().optional(),
  montantN: z.number().min(0, "≥ 0"),
  montantN1: z.number().min(0, "≥ 0"),
  montantN2: z.number().min(0, "≥ 0"),
  ordre: z.number().int().default(0),
});

export type DiversOperationCapitalRow = z.infer<typeof diversOperationCapitalSchema>;

/** Prêt inter-entreprises avec calcul d'échéance */
export const diversPretSchema = z.object({
  id: z.string().optional(),
  actif: z.boolean().default(true),
  libelle: z.string().min(1, "Requis").max(255),
  hypothese: z.string().optional(),
  dateDebut: z.string().optional(),
  capital: z.number().min(0, "≥ 0"),
  taux: z.number().min(0, "≥ 0").max(100, "≤ 100"),
  dureeMois: z.number().int().min(1, "≥ 1"),
  periodicite: z.enum(["MENSUELLE", "TRIMESTRIELLE", "ANNUELLE"]).default("MENSUELLE"),
  ordre: z.number().int().default(0),
});

export type DiversPretRow = z.infer<typeof diversPretSchema>;

// ── Helpers calcul prêt ──────────────────────────────────────────────────────

/**
 * Calcule l'échéance périodique d'un prêt amortissable.
 * @param capital  — capital emprunté
 * @param tauxAnnuel — taux annuel en %
 * @param dureeMois — durée en mois
 * @param periodicite — fréquence des remboursements
 * @returns { echeance, coutTotal }
 */
export function calculerEcheancePret(
  capital: number,
  tauxAnnuel: number,
  dureeMois: number,
  periodicite: "MENSUELLE" | "TRIMESTRIELLE" | "ANNUELLE"
): { echeance: number; coutTotal: number } {
  if (capital <= 0 || tauxAnnuel <= 0 || dureeMois <= 0) {
    return { echeance: 0, coutTotal: 0 };
  }

  const periodesParAn =
    periodicite === "MENSUELLE" ? 12 : periodicite === "TRIMESTRIELLE" ? 4 : 1;
  const tauxPeriodique = tauxAnnuel / 100 / periodesParAn;
  const nPeriodes = Math.ceil((dureeMois / 12) * periodesParAn);

  if (tauxPeriodique === 0) {
    const echeance = capital / nPeriodes;
    return { echeance, coutTotal: 0 };
  }

  const echeance =
    capital * (tauxPeriodique / (1 - Math.pow(1 + tauxPeriodique, -nPeriodes)));
  const coutTotal = echeance * nPeriodes - capital;

  return {
    echeance: Math.round(echeance * 100) / 100,
    coutTotal: Math.round(coutTotal * 100) / 100,
  };
}
