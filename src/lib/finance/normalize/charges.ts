/**
 * Normalisation des charges d'exploitation du scénario.
 *
 * Transforme les charges brutes Prisma en structures validées, immutables,
 * avec résolution des valeurs null pour `frequence` et `moisPaiement`.
 *
 * Les charges couvrent :
 *  - Fournitures (matières, consommables)
 *  - Services extérieurs (loyer, assurance, honoraires…)
 *  - Impôts et taxes
 *
 * Règles appliquées :
 *  - Filtre `actif !== false`
 *  - Convertit Decimal Prisma → number via `n()`
 *  - Résout `frequence: null` → "MENSUELLE"
 *  - Résout `moisPaiement: null` → 1
 *  - Résout `tva: null` → 20
 *  - Préserve `detailCalc` pour le cas POURCENTAGE_CA
 */

import { n } from "@/lib/finance/utils";
import type { ScenarioFinData } from "@/lib/finance/types/scenario";

// ── Types ─────────────────────────────────────────────────────────────────────

export type FrequenceCharge =
  | "MENSUELLE"
  | "TRIMESTRIELLE"
  | "SEMESTRIELLE"
  | "ANNUELLE";

export interface NormalizedCharge {
  id: string;
  label: string;
  categorie: "FOURNITURES" | "SERVICES" | "IMPOTS_TAXES" | "AUTRES";
  /** Montants annuels HT par exercice */
  montant: Record<"y1" | "y2" | "y3", number>;
  /** Fréquence de paiement (résolue, jamais null) */
  frequence: FrequenceCharge;
  /** Mois de paiement 1..12 (résolu, jamais null) */
  moisPaiement: number;
  /** Taux TVA (%) */
  tva: number;
  /**
   * Mode de calcul optionnel (`POURCENTAGE_CA`) avec saisonnalité liée au CA.
   * Présent uniquement si `detailCalc.modeCalc === "POURCENTAGE_CA"` en base.
   */
  detailCalc: Record<string, unknown> | null;
}

// ── Helper interne ────────────────────────────────────────────────────────────

function normalizeCharge(
  r: {
    id: string;
    intitule?: string | null;
    montantN: unknown;
    montantN1: unknown;
    montantN2: unknown;
    frequence?: string | null;
    moisPaiement?: number | null;
    tva?: unknown;
    actif?: boolean | null;
    detailCalc?: unknown;
  },
  categorie: NormalizedCharge["categorie"],
): NormalizedCharge {
  const rawDetail = r.detailCalc;
  const detailCalc =
    rawDetail && typeof rawDetail === "object" && !Array.isArray(rawDetail)
      ? (rawDetail as Record<string, unknown>)
      : null;

  return Object.freeze<NormalizedCharge>({
    id: r.id,
    label: r.intitule ?? r.id,
    categorie,
    montant: {
      y1: n(r.montantN),
      y2: n(r.montantN1),
      y3: n(r.montantN2),
    },
    frequence: ((r.frequence ?? "MENSUELLE").toUpperCase() as FrequenceCharge),
    // Fix H3 : clamp [1, 12] pour rejeter les valeurs hors-plage (0, 13…)
    // qui fausseraient le calcul du BFR.
    moisPaiement: Math.min(12, Math.max(1, r.moisPaiement ?? 1)),
    tva: n(r.tva ?? 20),
    detailCalc,
  });
}

// ── Fonctions principales ─────────────────────────────────────────────────────

/**
 * Normalise les fournitures actives du scénario.
 */
export function normalizeFournitures(
  data: Pick<ScenarioFinData, "fournitures">,
): readonly NormalizedCharge[] {
  return Object.freeze(
    data.fournitures
      .filter((r) => r.actif !== false)
      .map((r) => normalizeCharge(r, "FOURNITURES")),
  );
}

/**
 * Normalise les services extérieurs actifs du scénario.
 */
export function normalizeServices(
  data: Pick<ScenarioFinData, "services">,
): readonly NormalizedCharge[] {
  return Object.freeze(
    data.services
      .filter((r) => r.actif !== false)
      .map((r) => normalizeCharge(r, "SERVICES")),
  );
}

/**
 * Normalise les impôts et taxes actifs du scénario.
 */
export function normalizeImpotsTaxes(
  data: Pick<ScenarioFinData, "impotsTaxes">,
): readonly NormalizedCharge[] {
  return Object.freeze(
    data.impotsTaxes
      .filter((r) => r.actif !== false)
      .map((r) => normalizeCharge(r, "IMPOTS_TAXES")),
  );
}
