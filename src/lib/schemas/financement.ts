import { z } from "zod/v4";
import { hypotheseTypeSchema } from "@/lib/schemas/hypothese";

// ── Listes de référence ──────────────────────────────────────────────────────

export const TYPES_APPORT = [
  { value: "CAPITAL",        label: "Apport en capital" },
  { value: "COMPTE_COURANT", label: "Compte courant d'associé" },
  { value: "APPORT_NATURE",  label: "Apport en nature" },
] as const;

export const PERIODICITES_EMPRUNT = [
  { value: "MENSUEL",      label: "Mensuel" },
  { value: "TRIMESTRIEL",  label: "Trimestriel" },
  { value: "SEMESTRIEL",   label: "Semestriel" },
  { value: "ANNUEL",       label: "Annuel" },
] as const;

export const TYPES_DIFFERE = [
  { value: "AUCUN",   label: "Aucun" },
  { value: "PARTIEL", label: "Partiel (capital seulement)" },
  { value: "TOTAL",   label: "Total (capital + intérêts)" },
] as const;

export const TYPES_EMPRUNT = [
  { value: "AMORTISSABLE", label: "Amortissable" },
  { value: "IN_FINE",      label: "In fine" },
] as const;

export const MODALITES_REMBOURSEMENT = [
  { value: "ECHEANCE_CONSTANTE", label: "Échéance constante" },
  { value: "CAPITAL_CONSTANT",   label: "Capital constant" },
] as const;

export const MODES_ASSURANCE = [
  { value: "CAPITAL_RESTANT", label: "% du capital restant" },
  { value: "CAPITAL_INITIAL", label: "% du capital initial" },
] as const;

// ── Schéma Apport en capital ─────────────────────────────────────────────────

export const apportSchema = z.object({
  id:      z.string().optional(),
  libelle: z.string().min(1, "Requis").max(255),
  type:    z.enum(["CAPITAL", "COMPTE_COURANT", "APPORT_NATURE"]),
  montant: z.number().min(0, "≥ 0"),
  hypothese: hypotheseTypeSchema.default("COMMUNE"),
  dateApport: z.string().min(1, "Requis"), // YYYY-MM-DD
  remboursable: z.boolean().optional(),
  actif:  z.boolean().optional(),
  ordre:  z.number().int().min(0).optional(),
  groupe: z.string().optional().nullable(),
});

export type ApportRow = z.infer<typeof apportSchema>;

// ── Schéma Emprunt ───────────────────────────────────────────────────────────

export const empruntSchema = z.object({
  id:      z.string().optional(),
  libelle: z.string().min(1, "Requis").max(255),
  montant: z.number().min(0, "≥ 0"),
  hypothese: hypotheseTypeSchema.default("COMMUNE"),

  // Conditions
  tauxAnnuel:    z.number().min(0).max(100),
  tauxAssurance: z.number().min(0).max(5, "Le taux d'assurance dépasse 5 % — vérifiez la saisie (ex : 0.3)"),
  dureeEnMois:   z.number().int().min(1, "≥ 1 mois"),
  periodicite:   z.enum(["MENSUEL", "TRIMESTRIEL", "SEMESTRIEL", "ANNUEL"]),

  // Dates
  dateDéblocage: z.string().min(1, "Requis"), // YYYY-MM-DD

  // Type + modalité
  typeEmprunt:           z.enum(["AMORTISSABLE", "IN_FINE"]).default("AMORTISSABLE"),
  modaliteRemboursement: z.enum(["ECHEANCE_CONSTANTE", "CAPITAL_CONSTANT"]).default("ECHEANCE_CONSTANTE"),

  // Différé
  typeDiffere:        z.enum(["AUCUN", "PARTIEL", "TOTAL"]),
  dureeDiffereEnMois: z.number().int().min(0),

  // Assurance
  modeAssurance: z.enum(["CAPITAL_RESTANT", "CAPITAL_INITIAL"]).default("CAPITAL_RESTANT"),

  // Frais
  fraisDossier: z.number().min(0),

  actif: z.boolean().optional(),
  ordre: z.number().int().min(0).optional(),
  groupe: z.string().optional().nullable(),
});

export type EmpruntRow = z.infer<typeof empruntSchema>;

// ── Type ligne échéancier (calculé, lecture seule) ───────────────────────────

export type LigneEcheancier = {
  moisNumero:           number;
  dateEcheance:         string; // YYYY-MM-DD
  capitalRestantDebut:  number;
  interesMois:          number;
  assuranceMois:        number;
  capitalRembourse:     number;
  mensualiteTotale:     number;
  capitalRestantFin:    number;
  type?:                "NORMAL" | "FRAIS_DOSSIER";
};

export type EmpruntWithEcheancier = EmpruntRow & {
  id: string;
  lignesEcheancier: LigneEcheancier[];
};

// ── Helpers calculs emprunt ──────────────────────────────────────────────────

/**
 * Nombre de périodes en fonction de la périodicité et de la durée en mois.
 */
export function nbPeriodesFromMois(
  dureeEnMois: number,
  periodicite: EmpruntRow["periodicite"]
): number {
  const mapMois = { MENSUEL: 1, TRIMESTRIEL: 3, SEMESTRIEL: 6, ANNUEL: 12 } as const;
  return Math.ceil(dureeEnMois / mapMois[periodicite]);
}

/**
 * Taux par période à partir du taux annuel.
 */
export function tauxPeriodique(
  tauxAnnuelPct: number,
  periodicite: EmpruntRow["periodicite"]
): number {
  const mapMois = { MENSUEL: 1, TRIMESTRIEL: 3, SEMESTRIEL: 6, ANNUEL: 12 } as const;
  const moisParPeriode = mapMois[periodicite];
  return tauxAnnuelPct / 100 / (12 / moisParPeriode);
}

/**
 * Calcule la mensualité (ou le loyer constant par période) d'un emprunt
 * à échéance constante selon la formule d'annuité.
 * Retourne 0 si taux = 0 (remboursement linéaire simple).
 */
export function calculerEcheanceConstante(
  montant: number,
  tauxAnnuelPct: number,
  dureeEnMois: number,
  periodicite: EmpruntRow["periodicite"]
): number {
  const n = nbPeriodesFromMois(dureeEnMois, periodicite);
  const t = tauxPeriodique(tauxAnnuelPct, periodicite);
  if (t === 0) return montant / n;
  return (montant * t) / (1 - Math.pow(1 + t, -n));
}

/**
 * Calcule le loyer mensuel affiché dans le tableau (version arrondie).
 */
export function calculerLoyerMensuel(row: Pick<EmpruntRow, "montant" | "tauxAnnuel" | "dureeEnMois" | "periodicite" | "dureeDiffereEnMois">): number {
  const dureeSansPoste = row.dureeEnMois - row.dureeDiffereEnMois;
  if (dureeSansPoste <= 0) return 0;
  return calculerEcheanceConstante(row.montant, row.tauxAnnuel, dureeSansPoste, row.periodicite);
}

/**
 * Calcule le coût total du crédit (total remboursé - capital).
 */
export function calculerCoutTotal(
  montant: number,
  echeance: number,
  nbPeriodes: number,
  fraisDossier: number
): number {
  return echeance * nbPeriodes + fraisDossier - montant;
}
