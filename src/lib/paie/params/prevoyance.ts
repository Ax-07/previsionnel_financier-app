/**
 * Mutuelle / Prévoyance paramétrables (L4-06)
 *
 * Ce module gère les cotisations de protection sociale complémentaire :
 *   — Mutuelle obligatoire (≥ 50 % employeur depuis ANI 2013)
 *   — Prévoyance collective (incapacité, invalidité, décès)
 *
 * Les paramètres sont entièrement configurables par l'établissement.
 * La déductibilité fiscale et sociale suit les règles de l'URSSAF :
 *   - Part patronale déductible dans la limite des plafonds légaux
 *   - Part salariale déductible de l'assiette CSG dans la limite des plafonds
 *
 * Utilisation dans `simulate.ts` :
 *   if (input.entreprise.prevoyance) {
 *     lignes = [...lignes, ...buildLignesPrevoyance(assiettes.brutSoumis, input.entreprise.prevoyance)];
 *   }
 */

import type { LigneCotisation } from "@/lib/paie/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Définition d'une garantie de protection sociale complémentaire.
 * Chaque garantie produit une ligne de bulletin distincte.
 */
export interface GarantiePrevoyance {
  /** Identifiant technique unique (ex. "mutuelle", "prevoyance_deces") */
  code: string;
  /** Libellé affiché sur le bulletin (ex. "Mutuelle d'entreprise") */
  libelle: string;
  /**
   * Organisme assureur (ex. "AG2R La Mondiale", "Humanis", "Malakoff Humanis")
   */
  organisme: string;
  /** Taux de cotisation salarié (0–1, ex. 0.005 pour 0,50 %) */
  tauxSalarie: number;
  /** Taux de cotisation employeur (0–1, ex. 0.015 pour 1,50 %) */
  tauxEmployeur: number;
  /**
   * La part salariale est-elle déductible de l'assiette fiscale ?
   * Oui pour les régimes qui remplissent les conditions de l'article 83 du CGI.
   */
  deductible: boolean;
  /**
   * Type de garantie — utile pour le regroupement sur le bulletin.
   * - "mutuelle" : santé complémentaire (frais de santé)
   * - "prevoyance" : incapacité / invalidité / décès
   */
  type: "mutuelle" | "prevoyance";
}

/**
 * Configuration prévoyance/mutuelle d'une entreprise.
 * Passée dans `EntrepriseInput.prevoyance` (optionnel).
 */
export interface PrevoyanceConfig {
  /** Liste des garanties souscrites */
  garanties: GarantiePrevoyance[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Presets — configurations types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mutuelle minimale légale (ANI 2013) :
 *   - Panier minimum UNOCAM
 *   - Part employeur ≥ 50 % de la cotisation totale
 * Ces taux sont indicatifs et varient selon l'organisme.
 */
export const PRESET_MUTUELLE_MINIMALE: PrevoyanceConfig = {
  garanties: [
    {
      code: "MUTUELLE_OBLIGATOIRE",
      libelle: "Mutuelle d'entreprise obligatoire",
      organisme: "Organisme désigné",
      tauxSalarie: 0.0075,  // 0,75 %
      tauxEmployeur: 0.0075, // 0,75 % (50/50 — minimum ANI)
      deductible: true,
      type: "mutuelle",
    },
  ],
};

/**
 * Prévoyance cadre minimale obligatoire (CCN AGIRC) :
 *   - Décès / IAD : 1,50 % de la TA
 *   - Dont minimum employeur : 0,80 %
 */
export const PRESET_PREVOYANCE_CADRE: PrevoyanceConfig = {
  garanties: [
    {
      code: "PREVOYANCE_CADRE_DC_IAD",
      libelle: "Prévoyance cadre (décès / IAD)",
      organisme: "Organisme de prévoyance",
      tauxSalarie: 0.005,   // 0,50 %
      tauxEmployeur: 0.010, // 1,00 %
      deductible: true,
      type: "prevoyance",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Calcul des lignes de bulletin
// ─────────────────────────────────────────────────────────────────────────────

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/**
 * Calcule les lignes de cotisations prévoyance/mutuelle pour un bulletin.
 *
 * @param brutSoumis - Brut soumis aux cotisations
 * @param config     - Configuration prévoyance de l'entreprise
 * @returns Lignes de bulletin prêtes à intégrer dans `SimulationResultat.lignes`
 */
export function buildLignesPrevoyance(
  brutSoumis: number,
  config: PrevoyanceConfig,
): LigneCotisation[] {
  return config.garanties.map((g): LigneCotisation => {
    const montantSalarie = round2(brutSoumis * g.tauxSalarie);
    const montantEmployeur = round2(brutSoumis * g.tauxEmployeur);

    return {
      code: g.code,
      libelle: g.libelle,
      famille: g.type === "mutuelle" ? "prevoyance_mutuelle" : "prevoyance_prevoyance",
      organisme: g.organisme,
      assiette: brutSoumis,
      tranche: "totalite",
      tauxSalarie: g.tauxSalarie,
      tauxEmployeur: g.tauxEmployeur,
      montantSalarie: -montantSalarie,
      montantEmployeur,
      deductible: g.deductible,
      regleCode: `PREVOYANCE_${g.code}`,
    };
  });
}
