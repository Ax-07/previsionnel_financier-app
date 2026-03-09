/**
 * Registre central des conventions collectives (Lot 6).
 *
 * Chaque module IDCC (idcc/*.ts) appelle `registerConvention()` à l'import.
 * Ce module convertit le `ConventionRuleSet` riche en `Partial<RuleSet>`
 * compatible avec l'infrastructure existante (Lot P) et câble également
 * les politiques de maintien conventionnel (Lot 5).
 *
 * Usage dans un module IDCC :
 *   import { registerConvention } from "@/lib/paie/conventions/registry";
 *   registerConvention("1486", syntecRuleSet);
 */

import { ConventionRuleResolver } from "@/lib/paie/overrides/convention-rule-resolver";
import { registerConventionMaintenance } from "@/lib/paie/absence/conventional-maintenance";
import type { ConventionRuleSet, PrevoyanceConventionnelle } from "./types";
import type {
  LigneConventionnelle,
  RuleSet,
  AssietteSurcharge,
} from "@/lib/paie/overrides/types";
import type { FamilleCotisation } from "@/lib/paie/types";

// ─────────────────────────────────────────────────────────────────────────────
// Conversion helpers
// ─────────────────────────────────────────────────────────────────────────────

function prevoyanceToLigne(
  p: PrevoyanceConventionnelle
): LigneConventionnelle {
  // Mapping assiette Prévoyance → LigneConventionnelle.assiette
  const assiette = ((): LigneConventionnelle["assiette"] => {
    switch (p.assiette) {
      case "tranche1":
        return "tranche1";
      case "tranche2":
        return "tranche2";
      case "ta_tb":
        // "ta_tb" = T1 + T2 → on représente comme "brut" (approximation pipeline)
        return "brut";
      default:
        return "brut";
    }
  })();

  return {
    code: p.code,
    libelle: p.libelle,
    famille: p.famille as FamilleCotisation,
    organisme: p.organisme ?? "Organisme conventionnel",
    assiette,
    tauxSalarie: p.tauxSalarie,
    tauxEmployeur: p.tauxEmployeur,
    deductible: p.deductible,
    regleCode: `CCN_${p.code.toUpperCase()}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Point d'entrée public
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Enregistre une convention collective dans tous les sous-systèmes concernés :
 * - `ConventionRuleResolver` (cotisations, lignes additionnelles, exonérations)
 * - `ConventionalMaintenanceEngine` (si `politiqueMaintien` définie)
 *
 * @param idcc       - Code IDCC (ex. "1486")
 * @param crs        - Ensemble de règles conventionnelles (ConventionRuleSet)
 */
export function registerConvention(
  idcc: string,
  crs: ConventionRuleSet
): void {
  // ── 1. Lignes additionnelles (prévoyance/mutuelle obligatoire) ─────────────
  const lignesAdditionnelles: LigneConventionnelle[] = (
    crs.prevoyanceObligatoire ?? []
  ).map(prevoyanceToLigne);

  // ── 2. Surcharges d'assiette ───────────────────────────────────────────────
  let assietteSurcharges:
    | Partial<Record<FamilleCotisation, AssietteSurcharge>>
    | undefined;
  if (crs.facteurAbattementAssiette !== undefined) {
    const facteur = crs.facteurAbattementAssiette;
    // Applique l'abattement à toutes les familles principales
    const familles: FamilleCotisation[] = [
      "assurance_maladie",
      "assurance_vieillesse",
      "allocations_familiales",
      "assurance_chomage",
      "at_mp",
      "retraite_complementaire",
      "csg_deductible",
      "csg_non_deductible",
      "crds",
    ];
    assietteSurcharges = Object.fromEntries(
      familles.map((f) => [f, { facteurAbattement: facteur }])
    ) as Partial<Record<FamilleCotisation, AssietteSurcharge>>;
  }

  // ── 3. Construction du Partial<RuleSet> ───────────────────────────────────
  const partialRuleSet: Partial<RuleSet> = {};
  if (lignesAdditionnelles.length > 0) {
    partialRuleSet.lignesAdditionnelles = lignesAdditionnelles;
  }
  if (assietteSurcharges !== undefined) {
    partialRuleSet.assietteSurcharges = assietteSurcharges;
  }

  // ── 3bis. Majorations heures supplémentaires dérogatoires ─────────────────
  // Ex. HCR IDCC 1979 : 10 % h36-39, 20 % h40-43, 50 % h44+ (vs 25/50 % légal)
  if (crs.majorationsHeuresSup?.length) {
    partialRuleSet.majorationsHeuresSup = crs.majorationsHeuresSup;
  }

  // ── 4. Enregistrement dans ConventionRuleResolver (Lot P) ─────────────────
  ConventionRuleResolver.register(idcc, partialRuleSet);

  // ── 5. Enregistrement des politiques de maintien (Lot 5) ──────────────────
  if (crs.politiqueMaintien !== undefined) {
    registerConventionMaintenance(idcc, crs.politiqueMaintien);
  }
}
