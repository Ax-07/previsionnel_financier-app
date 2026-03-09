/**
 * Moteur fiscal : net imposable, prélèvement à la source, net à payer, coût employeur.
 */

import type { LigneCotisation, SalarieInput } from "@/lib/paie/types";

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// Net avant PAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Net avant prélèvement à la source.
 *
 * net_avant_PAS = brut_soumis - total_cotisations_salariales
 */
export function calcNetAvantPAS(
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
 */
export function calcNetImposable(
  brutSoumis: number,
  lignes: LigneCotisation[],
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

  return round2(brutSoumis - deductible + nonDeductibleSal);
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

export function calcNetAPayer(netAvantPAS: number, pas: number): number {
  return round2(netAvantPAS - pas);
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
  netAvantPAS: number;
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

  const netAvantPAS_ = calcNetAvantPAS(brutSoumis, lignes);
  const netImposable_ = calcNetImposable(brutSoumis, lignes);
  const pas_ = calcPAS(netImposable_, salarié);
  const netAPayer_ = calcNetAPayer(netAvantPAS_, pas_);
  const coutEmployeur_ = calcCoutEmployeur(brutSoumis, lignes);

  const tauxCotisationsPatronalesEffectif =
    brutSoumis > 0
      ? round2((totalCotisationsPatronales / brutSoumis) * 100)
      : 0;

  return {
    totalCotisationsSalariales,
    totalCotisationsPatronales,
    montantRGDU,
    netAvantPAS: netAvantPAS_,
    netImposable: netImposable_,
    pas: pas_,
    netAPayer: netAPayer_,
    coutEmployeur: coutEmployeur_,
    tauxCotisationsPatronalesEffectif,
  };
}
