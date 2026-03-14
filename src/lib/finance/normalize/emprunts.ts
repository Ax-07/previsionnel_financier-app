/**
 * Normalisation des emprunts du scénario.
 *
 * Transforme les emprunts bruts Prisma en structures validées, immutables,
 * avec leur échéancier mensuel complet pré-résolu.
 *
 * Règles appliquées :
 *  - Filtre `actif !== false`
 *  - Convertit Decimal Prisma → number via `n()`
 *  - Sépare les frais de dossier (moisNumero === -1) des mensualités
 *  - Normalise `dateEcheance` en string ISO
 */

import { n } from "@/lib/finance/utils";
import type { ScenarioFinData } from "@/lib/finance/types/scenario";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NormalizedLigneEcheancier {
  /**
   * Numéro du mois dans l'échéancier.
   * Convention : -1 = frais de dossier (charge au déblocage), ≥ 1 = mensualité ordinaire.
   */
  moisNumero: number;
  /** Date de l'échéance (ISO string) */
  dateEcheance: string;
  /** Capital remboursé ce mois (€) */
  capital: number;
  /** Intérêts ce mois (€) */
  interets: number;
  /** Assurance ce mois (€) */
  assurance: number;
  /** Mensualité totale (capital + intérêts + assurance) */
  mensualiteTotale: number;
}

export interface NormalizedEmprunt {
  id: string;
  label: string;
  montant: number;
  /** Date de déblocage (ISO string) — utilisée pour les frais de dossier */
  dateDéblocage: string;
  /** Frais de dossier (€) — charge ponctuelle à la date de déblocage */
  fraisDossier: number;
  /** Échéancier mensuel complet, hors frais de dossier (moisNumero ≥ 1) */
  echeancier: readonly NormalizedLigneEcheancier[];
}

// ── Fonction principale ───────────────────────────────────────────────────────

/**
 * Normalise tous les emprunts actifs du scénario.
 */
export function normalizeEmprunts(
  data: Pick<ScenarioFinData, "emprunts">,
): readonly NormalizedEmprunt[] {
  return Object.freeze(
    data.emprunts
      .map((emprunt): NormalizedEmprunt => {
        const echeancier: NormalizedLigneEcheancier[] = [];

        for (const ligne of emprunt.lignesEcheancier) {
          // Frais de dossier : moisNumero === -1 — traités séparément
          if (ligne.moisNumero === -1) continue;

          const dateStr =
            ligne.dateEcheance instanceof Date
              ? ligne.dateEcheance.toISOString()
              : String(ligne.dateEcheance ?? "");

          if (!dateStr) continue;

          echeancier.push(
            Object.freeze<NormalizedLigneEcheancier>({
              moisNumero: ligne.moisNumero,
              dateEcheance: dateStr,
              capital: n(ligne.capitalRembourse),
              interets: n(ligne.interesMois),
              assurance: n(ligne.assuranceMois),
              mensualiteTotale: n(ligne.mensualiteTotale),
            }),
          );
        }

        const dateDéblocage =
          emprunt.dateDéblocage instanceof Date
            ? emprunt.dateDéblocage.toISOString()
            : String(emprunt.dateDéblocage ?? "");

        return Object.freeze<NormalizedEmprunt>({
          id: emprunt.id,
          label: emprunt.libelle,
          montant: n(emprunt.montant),
          dateDéblocage,
          fraisDossier: n(emprunt.fraisDossier ?? 0),
          echeancier: Object.freeze(echeancier),
        });
      }),
  );
}
