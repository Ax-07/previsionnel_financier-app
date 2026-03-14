/**
 * Normalisation des activités du scénario.
 *
 * Transforme les activités brutes Prisma en structures validées, immutables
 * et prêtes pour les calculs atomiques.
 *
 * Règles appliquées :
 *  - Filtre `actif !== false`
 *  - Résout null → saisonnalité uniforme (÷12)
 *  - Auto-normalise si Σ saisonnalité ≠ 100
 *  - Résout null → ZERO pour achatsStockPonctuel
 *  - Convertit Decimal Prisma → number via `n()`
 */

import { n } from "@/lib/finance/utils";
import type { ScenarioFinData } from "@/lib/finance/types/scenario";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TypeActivite =
  | "PRODUCTION_VENDUE"
  | "PRESTATION_SERVICES"
  | "VENTES_MARCHANDISES";

export interface NormalizedActivite {
  id: string;
  label: string;
  typeActivite: TypeActivite;

  /** Montants annuels HT par exercice */
  montant: Record<"y1" | "y2" | "y3", number>;

  /** Coef achat : Math.max(0, 1 − tauxMarge/100) — 0 pour PRESTATION_SERVICES */
  achatsConsommesCoef: number;

  /** Jours de stock (convention /360) */
  joursStock: number;

  /** Saisonnalité CA en pourcentages (12 valeurs, Σ = 100) */
  saisonnaliteCA: Record<"N" | "N1" | "N2", readonly number[]>;

  /** Saisonnalité achats en pourcentages (12 valeurs, Σ = 100) */
  saisonnaliteAchats: Record<"N" | "N1" | "N2", readonly number[]>;

  /** Achats ponctuels (montants bruts HT par mois — pas des %) */
  achatsStockPonctuel: Record<"N" | "N1" | "N2", readonly number[]>;

  /** Taux TVA ventes (%) */
  tvaVentes: number;

  /** Taux TVA achats (%) */
  tvaAchats: number;

  /** Délai règlement clients (jours) */
  delaiClients: number;

  /** Délai règlement fournisseurs (jours) */
  delaiFournisseurs: number;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const UNIFORM_SAISON: readonly number[] = Object.freeze(
  Array<number>(12).fill(100 / 12),
);
const ZERO_PONCTUEL: readonly number[] = Object.freeze(Array<number>(12).fill(0));

// ── Helpers internes ──────────────────────────────────────────────────────────

/**
 * Normalise une saisonnalité JSON brute.
 *  - Si absente ou invalide → répartition uniforme (÷12)
 *  - Si présente mais Σ ≠ 100 → auto-normalise (log dev seulement)
 */
function normalizeSaison(
  raw: unknown,
  yearKey: "N" | "N1" | "N2",
): readonly number[] {
  if (raw && typeof raw === "object") {
    const rec = raw as Record<string, unknown>;
    const pcts = rec[yearKey];
    if (Array.isArray(pcts) && pcts.length >= 12) {
      const vals = (pcts as number[]).slice(0, 12);
      const sum = vals.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 100) > 0.01) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[normalize] saisonnalité ${yearKey} Σ=${sum.toFixed(2)} ≠ 100 — auto-normalisée`,
          );
        }
        const factor = 100 / sum;
        return Object.freeze(vals.map((v) => v * factor));
      }
      return Object.freeze(vals);
    }
  }
  return UNIFORM_SAISON;
}

/**
 * Normalise les achats ponctuels JSON bruts (montants HT par mois).
 */
function normalizePonctuel(
  raw: unknown,
  yearKey: "N" | "N1" | "N2",
): readonly number[] {
  if (raw && typeof raw === "object") {
    const rec = raw as Record<string, unknown>;
    const vals = rec[yearKey];
    if (Array.isArray(vals) && vals.length > 0) {
      const series = Array<number>(12).fill(0);
      (vals as number[]).forEach((v, i) => {
        if (i < 12) series[i] = n(v);
      });
      return Object.freeze(series);
    }
  }
  return ZERO_PONCTUEL;
}

// ── Fonction principale ───────────────────────────────────────────────────────

/**
 * Normalise toutes les activités actives du scénario.
 * Filtre `actif !== false` et produit des structures immutables.
 */
export function normalizeActivites(
  data: Pick<ScenarioFinData, "activites">,
): readonly NormalizedActivite[] {
  return Object.freeze(
    data.activites
      .filter((a) => a.actif !== false)
      .map((a): NormalizedActivite => {
        const isService = a.typeActivite === "PRESTATION_SERVICES";
        const tauxMarge = n(a.tauxMarge);
        const coef = isService ? 0 : Math.max(0, 1 - tauxMarge / 100);

        return Object.freeze<NormalizedActivite>({
          id: a.id,
          label: a.libelle ?? "",
          typeActivite: (a.typeActivite ?? "PRESTATION_SERVICES") as TypeActivite,
          montant: {
            y1: n(a.montantN),
            y2: n(a.montantN1),
            y3: n(a.montantN2),
          },
          achatsConsommesCoef: coef,
          joursStock: isService ? 0 : n(a.stocks ?? 0),
          saisonnaliteCA: {
            N:  normalizeSaison(a.saisonnaliteCA, "N"),
            N1: normalizeSaison(a.saisonnaliteCA, "N1"),
            N2: normalizeSaison(a.saisonnaliteCA, "N2"),
          },
          saisonnaliteAchats: {
            N:  normalizeSaison(a.saisonnaliteAchats ?? a.saisonnaliteCA, "N"),
            N1: normalizeSaison(a.saisonnaliteAchats ?? a.saisonnaliteCA, "N1"),
            N2: normalizeSaison(a.saisonnaliteAchats ?? a.saisonnaliteCA, "N2"),
          },
          achatsStockPonctuel: {
            N:  normalizePonctuel(a.achatsStockPonctuel, "N"),
            N1: normalizePonctuel(a.achatsStockPonctuel, "N1"),
            N2: normalizePonctuel(a.achatsStockPonctuel, "N2"),
          },
          tvaVentes: n(a.tauxTVA ?? 20),
          tvaAchats: n(a.tvaAchats ?? 20),
          delaiClients: n(a.reglementClients ?? 0),
          delaiFournisseurs: n(a.reglementFournisseurs ?? 0),
        });
      }),
  );
}
