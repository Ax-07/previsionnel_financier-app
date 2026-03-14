/**
 * Normalisation du personnel du scénario.
 *
 * Transforme les données brutes Prisma (salariés, dirigeants, TNS)
 * en structures validées, immutables et prêtes pour les calculs atomiques.
 *
 * Règles appliquées :
 *  - Filtre `actif !== false`
 *  - Convertit Decimal Prisma → number via `n()`
 *  - Résout null → 0 pour tauxCotisations
 *  - Parse JSON de `detailMensuel` — null si invalide (le moteur utilisera uniform ÷12)
 */

import { n } from "@/lib/finance/utils";
import type { ScenarioFinData } from "@/lib/finance/types/scenario";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NormalizedSalarie {
  id: string;
  label: string;
  /** Salaire brut annuel par exercice */
  montant: Record<"y1" | "y2" | "y3", number>;
  /** Taux cotisations patronales (%) */
  tauxCotisationsPatronales: number;
  /**
   * Distribution mensuelle (12 valeurs normalisées à Σ = montant annuel).
   * `null` = uniforme (÷12), le moteur choisira `uniformMonthly`.
   */
  detailMensuel: Record<"N" | "N1" | "N2", readonly number[] | null>;
}

export interface NormalizedDirigeant {
  id: string;
  label: string;
  /** Rémunération annuelle par exercice */
  montant: Record<"y1" | "y2" | "y3", number>;
  /** Taux cotisations patronales (%) — généralement 0 pour TNS/gérant majoritaire */
  tauxCotisationsPatronales: number;
  detailMensuel: Record<"N" | "N1" | "N2", readonly number[] | null>;
}

export interface NormalizedTNS {
  id: string;
  label: string;
  /** Cotisations TNS annuelles par exercice */
  montant: Record<"y1" | "y2" | "y3", number>;
  /** Taux cotisations TNS (%) */
  tauxCotisations: number;
}

// ── Helpers internes ──────────────────────────────────────────────────────────

/**
 * Parse un champ `detailMensuelN` JSON de salarié/dirigeant.
 * Format attendu : `{ effectif: number[], brutIndividuel: number[] }` (LigneSalarie)
 * ou tableau direct `number[]` — retourne le tableau de 12 valeurs ou `null`.
 */
function parseDetailMensuel(raw: unknown): readonly number[] | null {
  if (raw === null || raw === undefined) return null;
  // Format salarié : { effectif, brutIndividuel }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const rec = raw as Record<string, unknown>;
    const arr = rec["brutIndividuel"] ?? rec["effectif"];
    if (Array.isArray(arr) && arr.length >= 12) {
      return Object.freeze((arr as number[]).slice(0, 12).map(Number));
    }
  }
  // Format direct : number[]
  if (Array.isArray(raw) && raw.length >= 12) {
    return Object.freeze((raw as number[]).slice(0, 12).map(Number));
  }
  return null;
}

// ── Fonctions principales ─────────────────────────────────────────────────────

/**
 * Normalise tous les salariés actifs du scénario.
 */
export function normalizeSalaries(
  data: Pick<ScenarioFinData, "salaries">,
): readonly NormalizedSalarie[] {
  return Object.freeze(
    data.salaries
      .filter((r) => r.actif !== false)
      .map((r): NormalizedSalarie =>
        Object.freeze<NormalizedSalarie>({
          id: r.id,
          label: r.libelle,
          montant: {
            y1: n(r.montantN),
            y2: n(r.montantN1),
            y3: n(r.montantN2),
          },
          tauxCotisationsPatronales: n(r.tauxCotPat ?? 0),
          detailMensuel: {
            N:  parseDetailMensuel(r.detailMensuelN),
            N1: parseDetailMensuel(r.detailMensuelN1),
            N2: parseDetailMensuel(r.detailMensuelN2),
          },
        }),
      ),
  );
}

/**
 * Normalise tous les dirigeants actifs du scénario.
 */
export function normalizeDirigeants(
  data: Pick<ScenarioFinData, "dirigeants">,
): readonly NormalizedDirigeant[] {
  return Object.freeze(
    data.dirigeants
      .filter((r) => r.actif !== false)
      .map((r): NormalizedDirigeant =>
        Object.freeze<NormalizedDirigeant>({
          id: r.id,
          label: r.libelle,
          montant: {
            y1: n(r.montantN),
            y2: n(r.montantN1),
            y3: n(r.montantN2),
          },
          // LigneDirigeant n'a pas de tauxCotPat — les cotisations TNS sont dans cotisationsTNS
          tauxCotisationsPatronales: 0,
          detailMensuel: {
            N:  parseDetailMensuel(r.detailMensuelN),
            N1: parseDetailMensuel(r.detailMensuelN1),
            N2: parseDetailMensuel(r.detailMensuelN2),
          },
        }),
      ),
  );
}

/**
 * Normalise toutes les cotisations TNS actives du scénario.
 */
export function normalizeTNS(
  data: Pick<ScenarioFinData, "cotisationsTNS">,
): readonly NormalizedTNS[] {
  return Object.freeze(
    data.cotisationsTNS
      .filter((r) => r.actif !== false)
      .map((r): NormalizedTNS =>
        Object.freeze<NormalizedTNS>({
          id: r.id,
          label: r.libelle,
          montant: {
            y1: n(r.montantN),
            y2: n(r.montantN1),
            y3: n(r.montantN2),
          },
          // LigneCotisationTNS ne stocke pas de taux — le montant est saisi directement
          tauxCotisations: 0,
        }),
      ),
  );
}
