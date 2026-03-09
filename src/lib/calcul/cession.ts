import type { CessionRow } from "@/lib/schemas/investissement";

/**
 * Calcule les colonnes dérivées d'une cession d'immobilisation.
 *
 * @param row       - Les champs bruts de la cession
 * @param anneeDetention - Durée de détention en années (optionnel, calculable si
 *                         dateAcquisition est disponible). Quand absent, seules les
 *                         immobilisations financières sont considérées PVLT.
 */
export function calcCession(
  row: Pick<CessionRow, "prixVente" | "prixAchat" | "dejaAmortie" | "nature">,
  anneeDetention?: number,
) {
  const resteAAmortir = Math.max(0, row.prixAchat - row.dejaAmortie);
  const plusValue = row.prixVente - resteAAmortir;

  // Règle PVLT (Plus-Value à Long Terme, art. 39 duodecies CGI) :
  //   - Immobilisations financières : toujours PVLT si PV positive
  //   - Corporel / Incorporel : PVLT uniquement si détention > 2 ans
  const longTerme =
    row.nature === "FINANCIER" ||
    (anneeDetention !== undefined && anneeDetention > 2);

  const pvLT = plusValue > 0 && longTerme;

  return { resteAAmortir, plusValue, pvLT };
}
