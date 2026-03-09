import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { n, calcIS, type YearAcc } from "@/lib/finance/utils";

export type YAcc = YearAcc;

// ── Ajustements fiscaux ───────────────────────────────────────────────────────

/**
 * Calcule le solde net des ajustements fiscaux (réintégrations − déductions).
 * Réintégrations (+), Déductions (−).
 */
export function calcAjustementNet(
  data: Pick<ScenarioFinData, "ajustementsFiscaux">,
): YAcc {
  const acc: YAcc = { y1: 0, y2: 0, y3: 0 };
  for (const a of data.ajustementsFiscaux) {
    const sign = a.type === "REINTEGRATION" ? 1 : -1;
    acc.y1 += sign * n(a.montantN ?? 0);
    acc.y2 += sign * n(a.montantN1 ?? 0);
    acc.y3 += sign * n(a.montantN2 ?? 0);
  }
  return acc;
}

// ── Impôt sur les Sociétés ────────────────────────────────────────────────────

/**
 * Calcule l'IS pour chaque exercice à partir du résultat fiscal.
 *
 * Le résultat fiscal = resCourant + resExcep + ajustementNet
 *
 * Retourne zéro pour les entreprises soumises à l'IR (isIS = false)
 * ou si les paramètres IS sont désactivés (isEnabled = false).
 */
export function calcISParAnnee(
  resCourant: YAcc,
  resExcep: YAcc,
  ajustementNet: YAcc,
  parametresIS: ScenarioFinData["parametresIS"],
  isIS: boolean,
): YAcc {
  if (!isIS || parametresIS?.isEnabled === false) {
    return { y1: 0, y2: 0, y3: 0 };
  }
  const p = parametresIS;
  return {
    y1: calcIS(
      resCourant.y1 + resExcep.y1 + ajustementNet.y1,
      n(p?.plafondReduitN ?? 42500),
      n(p?.tauxReduitN ?? 15),
      n(p?.tauxNormalN ?? 25),
      n(p?.creditImpotN ?? 0),
      n(p?.contributionVolN ?? 0),
    ),
    y2: calcIS(
      resCourant.y2 + resExcep.y2 + ajustementNet.y2,
      n(p?.plafondReduitN1 ?? 42500),
      n(p?.tauxReduitN1 ?? 15),
      n(p?.tauxNormalN1 ?? 25),
      n(p?.creditImpotN1 ?? 0),
      n(p?.contributionVolN1 ?? 0),
    ),
    y3: calcIS(
      resCourant.y3 + resExcep.y3 + ajustementNet.y3,
      n(p?.plafondReduitN2 ?? 42500),
      n(p?.tauxReduitN2 ?? 15),
      n(p?.tauxNormalN2 ?? 25),
      n(p?.creditImpotN2 ?? 0),
      n(p?.contributionVolN2 ?? 0),
    ),
  };
}
