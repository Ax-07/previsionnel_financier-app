/**
 * Moteur fiscal : net imposable, prélèvement à la source, net à payer, coût employeur.
 */

import type { LigneCotisation, SalarieInput } from "@/lib/paie/types";

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// Net social
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Net social (net avant prélèvement à la source).
 *
 * net_social = brut_soumis - total_cotisations_salariales
 */
export function calcNetSocial(
  brutSoumis: number,
  lignes: LigneCotisation[],
): number {
  const totalSal = lignes.reduce((s, l) => s + l.montantSalarie, 0);
  return round2(brutSoumis - totalSal);
}

// ─────────────────────────────────────────────────────────────────────────────
// Net imposable
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Net imposable.
 *
 * net_imposable = brut_soumis
 *               - cotisations_salariales_déductibles
 *               + CSG_non_déductible
 *               + CRDS (non déductible)
 *               - exonération_HS_IR      (art. 81 quater CGI)
 */
export function calcNetImposable(
  brutSoumis: number,
  lignes: LigneCotisation[],
  exonerationHSIR = 0,
): number {
  let deductible = 0;
  let nonDeductibleSal = 0;

  for (const l of lignes) {
    if (l.montantSalarie === 0) continue;
    if (l.deductible) {
      deductible += l.montantSalarie;
    } else if (l.famille === "csg_non_deductible" || l.famille === "crds") {
      nonDeductibleSal += l.montantSalarie;
    }
  }

  return round2(brutSoumis - deductible + nonDeductibleSal - exonerationHSIR);
}

// ─────────────────────────────────────────────────────────────────────────────
// Prélèvement à la source (PAS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule le prélèvement à la source.
 * PAS = arrondi(net_imposable × taux_PAS)
 */
export function calcPAS(
  netImposable: number,
  salarié: SalarieInput,
): number {
  const taux = salarié.tauxPAS ?? 0;
  if (taux <= 0) return 0;
  return round2(netImposable * taux);
}

// ─────────────────────────────────────────────────────────────────────────────
// Net à payer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Net à payer en espèces.
 *
 * Les avantages en nature sont inclus dans le brut soumis (donc dans le net social)
 * mais ne sont pas versés en cash — ils doivent être déduits.
 *
 * net_à_payer = net_social - avantages_en_nature - PAS
 */
export function calcNetAPayer(
  netSocial: number,
  avantagesEnNature: number,
  pas: number,
): number {
  return round2(netSocial - avantagesEnNature - pas);
}

// ─────────────────────────────────────────────────────────────────────────────
// Coût employeur
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Coût total employeur.
 *
 * coût_employeur = brut_soumis + total_cotisations_patronales (hors RGDU)
 *                            + montantEmployeur RGDU (négatif)
 */
export function calcCoutEmployeur(
  brutSoumis: number,
  lignes: LigneCotisation[],
): number {
  const totalPat = lignes.reduce((s, l) => s + l.montantEmployeur, 0);
  return round2(brutSoumis + totalPat);
}

// ─────────────────────────────────────────────────────────────────────────────
// Résumé des totaux
// ─────────────────────────────────────────────────────────────────────────────

export interface TotauxFiscaux {
  totalCotisationsSalariales: number;
  totalCotisationsPatronales: number;
  montantRGDU: number;
  netSocial: number;
  netImposable: number;
  pas: number;
  netAPayer: number;
  coutEmployeur: number;
  tauxCotisationsPatronalesEffectif: number;
}

export function buildTotaux(
  brutSoumis: number,
  lignes: LigneCotisation[],
  salarié: SalarieInput,
  exonerationHSIR = 0,
): TotauxFiscaux {
  const totalCotisationsSalariales = round2(
    lignes.reduce((s, l) => s + l.montantSalarie, 0),
  );
  const rgduLigne = lignes.find((l) => l.code === "RGDU");
  const montantRGDU = rgduLigne ? Math.abs(rgduLigne.montantEmployeur) : 0;

  const cotisationsHorsRgdu = lignes.filter((l) => l.code !== "RGDU");
  const totalCotisationsPatronales = round2(
    cotisationsHorsRgdu.reduce((s, l) => s + l.montantEmployeur, 0),
  );

  const netSocial_ = calcNetSocial(brutSoumis, lignes);
  const netImposable_ = calcNetImposable(brutSoumis, lignes, exonerationHSIR);
  const pas_ = calcPAS(netImposable_, salarié);
  const avantagesEnNature_ = salarié.avantagesEnNature ?? 0;
  const netAPayer_ = calcNetAPayer(netSocial_, avantagesEnNature_, pas_);
  const coutEmployeur_ = calcCoutEmployeur(brutSoumis, lignes);

  const tauxCotisationsPatronalesEffectif =
    brutSoumis > 0
      ? round2((totalCotisationsPatronales / brutSoumis) * 100)
      : 0;

  return {
    totalCotisationsSalariales,
    totalCotisationsPatronales,
    montantRGDU,
    netSocial: netSocial_,
    netImposable: netImposable_,
    pas: pas_,
    netAPayer: netAPayer_,
    coutEmployeur: coutEmployeur_,
    tauxCotisationsPatronalesEffectif,
  };
}
