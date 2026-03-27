/**
 * Pipeline principal de simulation de fiche de paie — 11 étapes.
 *
 * Architecture Lot P (extension) :
 *   Étape  1 — Qualification du profil (ProfileEngine)
 *   Étape  2 — Chargement du rule set standard
 *   Étape  3 — Surcharges profil / spécialité (RuleOverrideEngine)
 *   Étape  4 — Surcharges conventionnelles (ConventionRuleResolver)
 *   Étape  5 — Construction des assiettes
 *   Étape  6 — Cumuls / plafonds (placeholder Lot 3)
 *   Étape  7 — Calcul des cotisations (profils spécifiques + prévoyance)
 *   Étape  8 — Exonérations / aides (RGDU)
 *   Étape  9 — Absences / indemnisations spécialisées (placeholder Lot 9)
 *   Étape 10 — Calcul fiscal (PAS)
 *   Étape 11 — Assemblage du résultat
 */

import type { SimulationInput, SimulationResultat } from "@/lib/paie/types";
import type { LigneCotisation } from "@/lib/paie/types";
import type { LigneConventionnelle } from "@/lib/paie/overrides/types";
import type { AssiettesResult } from "@/lib/paie/engine/assiettes";
import { buildAssiettes, calcAssietteCsg, calcTranchesArrco, calcHeuresSupMultiTranches, calcHeuresSupLignesDetail } from "@/lib/paie/engine/assiettes";
import { calcCotisations } from "@/lib/paie/engine/cotisations";
import { calcRGDU } from "@/lib/paie/engine/rgdu";
import { buildTotaux } from "@/lib/paie/engine/fiscal";
import { exonerationsApprenti } from "@/lib/paie/profiles/apprenti";
import { filtrerLignesStage } from "@/lib/paie/profiles/stage";
import { cotisationAlsaceMoselle } from "@/lib/paie/profiles/alsace-moselle";
import { buildLignesPrevoyance } from "@/lib/paie/params/prevoyance";
import { ProfileEngine } from "@/lib/paie/profiles/profile-engine";
import { RuleOverrideEngine } from "@/lib/paie/overrides/rule-override-engine";
import { ConventionRuleResolver } from "@/lib/paie/overrides/convention-rule-resolver";
import { createPipelineContext } from "@/lib/paie/engine/pipeline-context";
import { LeaveAndBenefitsEngine } from "@/lib/paie/absence/leave-benefits-engine";
import { PARAMS_2026, TRANCHES_HS_LEGALES } from "@/lib/paie/params/2026";
import {
  calcExonerationHSIR,
  calcReductionHSCotSal,
  buildLigneReductionHSCotSal,
} from "@/lib/paie/engine/exoneration-hs";

/**
 * Simule un bulletin de paie complet à partir des paramètres d'entrée.
 *
 * Fonction pure et déterministe : mêmes entrées = même sortie.
 * Les 48 tests existants (Lots 0–4) continuent de passer sans modification.
 */
export function simulate(input: SimulationInput): SimulationResultat {
  const { salarié, entreprise } = input;
  const ctx = createPipelineContext(input);

  // ── Étape 1 : Qualification du profil ──────────────────────────────────────
  const profile = ProfileEngine.resolve(salarié);
  ctx.profileCode = profile.code;

  // ── Étape 2 : Rule set standard ────────────────────────────────────────────
  // (vide pour l'instant — les lots futurs peupleront ce rule set)
  ctx.ruleSetStandard = {};

  // ── Étape 3 : Surcharges profil ────────────────────────────────────────────
  // (vide pour l'instant — Lot 5 injectera les surcharges par profil)
  ctx.ruleSetProfil = {};

  // ── Étape 4 : Surcharges conventionnelles ──────────────────────────────────
  ctx.ruleSetConvention = ConventionRuleResolver.resolve(salarié.conventionCode);

  // Fusion des trois rule sets (standard < profil < convention)
  ctx.ruleSetEffectif = RuleOverrideEngine.mergeAll(
    ctx.ruleSetStandard,
    ctx.ruleSetProfil,
    ctx.ruleSetConvention,
  );

  // ── Étape 5 : Construction des assiettes ───────────────────────────────────
  let assiettes = buildAssiettes(salarié, entreprise);
  ctx.assiettes = assiettes;

  // ── Étape 5bis : Surcharge heures sup conventionnelles (dérogatoires) ──────
  // Utilisé ex. par HCR IDCC 1979 : 10 % h36-39 / 20 % h40-43 / 50 % h44+
  // au lieu du régime légal (25 % h36-43, 50 % h44+).
  if (salarié.heuresSupplementaires && ctx.ruleSetEffectif.majorationsHeuresSup?.length) {
    const heuresSupConvention = calcHeuresSupMultiTranches(
      salarié,
      ctx.ruleSetEffectif.majorationsHeuresSup,
    );
    const brutSoumisCorrige =
      assiettes.brutSoumis - assiettes.heuresSup + heuresSupConvention;
    const assietteCsgCorrigee = calcAssietteCsg(brutSoumisCorrige);
    const { baseT1, baseT2 } = calcTranchesArrco(brutSoumisCorrige, assiettes.pmssProratise);
    assiettes = {
      ...assiettes,
      heuresSup: heuresSupConvention,
      brutSoumis: brutSoumisCorrige,
      assietteCsg: assietteCsgCorrigee,
      baseT1,
      baseT2,
    };
    ctx.assiettes = assiettes;
  }

  // ── Détail HS par tranche (pour affichage bulletin) ────────────────────────
  // Utilise les mêmes tranches que le calcul effectif : conventionnelles si présentes,
  // sinon les tranches légales standard (25 % h36-43, 50 % h44+).
  const tranchesEffectives =
    ctx.ruleSetEffectif.majorationsHeuresSup?.length
      ? ctx.ruleSetEffectif.majorationsHeuresSup
      : TRANCHES_HS_LEGALES;
  const heuresSupLignes = salarié.heuresSupplementaires
    ? calcHeuresSupLignesDetail(salarié, tranchesEffectives)
    : undefined;

  // ── Étape 6 : Cumuls / plafonds ────────────────────────────────────────────
  // Placeholder Lot 3 (cumuls inter-périodes, proratisation PMSS, etc.)

  // ── Étape 7 : Calcul des cotisations ───────────────────────────────────────
  let lignes = calcCotisations(assiettes, salarié, entreprise);

  // Apprentissage : exonérations salariales
  if (salarié.typeContrat === "apprentissage") {
    const exos = exonerationsApprenti(salarié, lignes);
    lignes = [...lignes, ...exos];
  }

  // Stage : filtrage des cotisations non applicables
  if (salarié.typeContrat === "stage") {
    lignes = filtrerLignesStage(lignes, salarié);
  }

  // Alsace-Moselle : cotisation maladie régime local
  if (salarié.alsaceMoselle) {
    lignes = [...lignes, ...cotisationAlsaceMoselle(assiettes.brutSoumis)];
  }

  // Prévoyance / mutuelle complémentaire
  if (entreprise.prevoyance) {
    lignes = [...lignes, ...buildLignesPrevoyance(assiettes.brutSoumis, entreprise.prevoyance)];
  }

  // Lignes additionnelles conventionnelles (Lot 6)
  if (ctx.ruleSetEffectif.lignesAdditionnelles?.length) {
    const lignesConv = ctx.ruleSetEffectif.lignesAdditionnelles.map(
      (lc) => ligneConventionnelleToLigneCotisation(lc, assiettes)
    );
    lignes = [...lignes, ...lignesConv];
  }

  ctx.lignes = lignes;

  // ── Étape 8 : Exonérations / RGDU ──────────────────────────────────────────
  const disableRGDU =
    salarié.typeContrat === "stage" || ctx.ruleSetEffectif.disableRGDU === true;

  if (!disableRGDU) {
    const rgdu = calcRGDU(assiettes, salarié, entreprise);
    if (rgdu) {
      ctx.lignes = [...ctx.lignes, rgdu];
    }
  }
  // Exonérations HS : réduction cotisations salariales (art. L241-17 CSS)
  // et exonération IR (art. 81 quater CGI) — calculées après RGDU (indépendant)
  const remHS = assiettes.heuresSup;
  const exonerationHSIR =
    remHS > 0
      ? calcExonerationHSIR(remHS, salarié.cumulHeuresSup ?? 0)
      : 0;
  const reductionHSCotSal =
    remHS > 0
      ? calcReductionHSCotSal(remHS, assiettes.brutSoumis, assiettes.pmssProratise)
      : 0;
  if (reductionHSCotSal > 0) {
    ctx.lignes = [...ctx.lignes, buildLigneReductionHSCotSal(reductionHSCotSal, remHS)];
  }
  // ── Étape 9 : Absences / indemnisations spécialisées ───────────────────────
  // Lot 5 : si un absencement avancé est fourni, le moteur d'absence complète le calcul
  let absenceDetail: import("@/lib/paie/absence/types").ResultatAbsence | undefined;
  if (salarié.absenceEvent) {
    absenceDetail = LeaveAndBenefitsEngine.calculate({
      absence: salarié.absenceEvent,
      brutMensuelTheorique: salarié.brutMensuel,
      conventionCode: salarié.conventionCode,
      tauxPAS: salarié.tauxPAS,
      passAnnuel: PARAMS_2026.passAnnuel,
    });
  }

  // ── Étape 10 : Calcul fiscal ────────────────────────────────────────────────
  const totaux = buildTotaux(assiettes.brutSoumis, ctx.lignes, salarié, exonerationHSIR);

  // ── Étape 11 : Assemblage du résultat ────────────────────────────────────────
  return {
    brutSoumis: assiettes.brutSoumis,
    brutFiscal: assiettes.brutSoumis,
    heuresSup: assiettes.heuresSup,
    heuresSupLignes,
    exonerationHSIR,
    reductionHSCotSal,
    assietteCsg: assiettes.assietteCsg,
    pmssProratise: assiettes.pmssProratise,
    baseT1: assiettes.baseT1,
    baseT2: assiettes.baseT2,
    facteurProrata: assiettes.facteurProrata,
    lignes: ctx.lignes,
    absenceDetail,
    ...totaux,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversion net → brut (réexporté pour co-localisation)
// ─────────────────────────────────────────────────────────────────────────────

export { netToGross } from "@/lib/paie/engine/net-to-gross";

// ─────────────────────────────────────────────────────────────────────────────
// Conversion LigneConventionnelle → LigneCotisation
// ─────────────────────────────────────────────────────────────────────────────

function ligneConventionnelleToLigneCotisation(
  lc: LigneConventionnelle,
  a: AssiettesResult,
): LigneCotisation {
  const r2 = (v: number) => Math.round(v * 100) / 100;

  let baseNumerique: number;
  let tranche: string;

  switch (lc.assiette) {
    case "tranche1":
      baseNumerique = a.baseT1;
      tranche = "tranche1";
      break;
    case "tranche2":
      baseNumerique = a.baseT2;
      tranche = "tranche2";
      break;
    case "fixe":
      baseNumerique = 0;
      tranche = "fixe";
      break;
    default: // "brut"
      baseNumerique = a.brutSoumis;
      tranche = "totalite";
  }

  const montantSalarie =
    lc.assiette === "fixe"
      ? (lc.montantFixeSalarie ?? 0)
      : r2(baseNumerique * lc.tauxSalarie);

  const montantEmployeur =
    lc.assiette === "fixe"
      ? (lc.montantFixeEmployeur ?? 0)
      : r2(baseNumerique * lc.tauxEmployeur);

  return {
    code: lc.code,
    libelle: lc.libelle,
    famille: lc.famille,
    organisme: lc.organisme,
    assiette: r2(baseNumerique),
    tranche,
    tauxSalarie: lc.tauxSalarie,
    tauxEmployeur: lc.tauxEmployeur,
    montantSalarie,
    montantEmployeur,
    deductible: lc.deductible,
    regleCode: lc.regleCode,
  };
}
