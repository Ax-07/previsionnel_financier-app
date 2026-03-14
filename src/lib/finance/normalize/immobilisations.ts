/**
 * Normalisation des immobilisations du scénario.
 *
 * Transforme les immobilisations brutes Prisma en structures validées,
 * immutables et prêtes pour les calculs de dotations aux amortissements.
 *
 * Règles appliquées :
 *  - Filtre `actif !== false` et `modeAmortissement !== "AUCUN"`
 *  - Ignore les immos avec dur ≤ 0 ou montantHT ≤ 0
 *  - Parse `dateAcquisition` en Date
 *  - Convertit `dureeAmortissement` (années) → `dureeAmortMois` (mois)
 *  - Calcule `dotationMensuelle` = montantHT / dureeAmortMois (valide pour LINEAIRE)
 *  - Conserve `lignesAmortissement` pour DEGRESSIF
 */

import { n } from "@/lib/finance/utils";
import type { ScenarioFinData } from "@/lib/finance/types/scenario";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ModeAmortissement = "LINEAIRE" | "DEGRESSIF";

export interface NormalizedLigneAmortissement {
  /** Année civile de la ligne */
  annee: number;
  /** Dotation annuelle pour cette ligne (€) */
  dotationAnnuelle: number;
}

export interface NormalizedImmo {
  id: string;
  label: string;
  nature: string;
  montantHT: number;
  /** Taux TVA applicable sur l'acquisition (%) */
  tvaImmo: number;
  /** Date d'acquisition résolue (ISO string parsé en Date) */
  dateAcquisition: Date;
  /** Durée d'amortissement en mois */
  dureeAmortMois: number;
  modeAmort: ModeAmortissement;
  /**
   * Dotation mensuelle (montantHT / dureeAmortMois).
   * Valide pour LINEAIRE. Pour DEGRESSIF, utiliser `lignesAmortissement`.
   */
  dotationMensuelle: number;
  /**
   * Plan dégressif pré-calculé (depuis `lignesAmortissement` Prisma).
   * Vide pour LINEAIRE.
   */
  lignesAmortissement: readonly NormalizedLigneAmortissement[];
}

// ── Fonction principale ───────────────────────────────────────────────────────

/**
 * Normalise les immobilisations amortissables actives du scénario.
 * Exclut les immobilisations avec `modeAmortissement === "AUCUN"`, dur ≤ 0 ou montant ≤ 0.
 */
export function normalizeImmobilisations(
  data: Pick<ScenarioFinData, "immobilisations">,
): readonly NormalizedImmo[] {
  const result: NormalizedImmo[] = [];

  for (const immo of data.immobilisations) {
    if (immo.actif === false) continue;
    if (immo.modeAmortissement === "AUCUN") continue;

    const dur = n(immo.dureeAmortissement);
    const montantHT = n(immo.montantHT);
    if (dur <= 0 || montantHT <= 0) continue;

    const dureeAmortMois = Math.round(dur * 12);
    const modeAmort = (immo.modeAmortissement === "DEGRESSIF"
      ? "DEGRESSIF"
      : "LINEAIRE") as ModeAmortissement;

    const lignesAmortissement: NormalizedLigneAmortissement[] =
      modeAmort === "DEGRESSIF"
        ? immo.lignesAmortissement.map((l) =>
            Object.freeze<NormalizedLigneAmortissement>({
              annee: l.annee,
              dotationAnnuelle: n(l.dotationAnnuelle),
            }),
          )
        : [];

    result.push(
      Object.freeze<NormalizedImmo>({
        id: immo.id,
        label: immo.libelle,
        nature: immo.nature,
        montantHT,
        tvaImmo: n(immo.tauxTVA ?? 20),
        dateAcquisition: new Date(String(immo.dateAcquisition)),
        dureeAmortMois,
        modeAmort,
        dotationMensuelle: montantHT / dureeAmortMois,
        lignesAmortissement: Object.freeze(lignesAmortissement),
      }),
    );
  }

  return Object.freeze(result);
}
