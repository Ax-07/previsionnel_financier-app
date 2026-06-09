/**
 * Moteur de calcul TVA — source unique de vérité.
 *
 * Utilisé par :
 *   - src/app/actions/controle/tva.ts        (tableau TVA complet)
 *   - src/app/actions/controle/tresorerie.ts (TVA à décaisser)
 */

import type { MonthlySeries } from "@/lib/finance/calculs/monthly";
import { zeroSeries } from "@/lib/finance/calculs/monthly";

export interface TVAMonthlyResult {
  /** TVA collectée − TVA déductible (sans tenir compte du crédit reporté) */
  tvaNetteMonthly: MonthlySeries;
  /** Crédit de TVA restant à reporter en fin de chaque mois */
  creditReporteMonthly: MonthlySeries;
  /** TVA réellement due et à payer (0 si crédit) */
  tvaAPayerMonthly: MonthlySeries;
  /** Crédit résiduel en fin d'exercice (à reporter sur l'exercice suivant) */
  finalCredit: number;
}

/**
 * Calcule la TVA nette, le crédit reporté et la TVA à payer mois par mois.
 *
 * - **Mensuel** : la TVA due est calculée et payée chaque mois.
 * - **Trimestriel** : la TVA est accumulée sur 3 mois ; le paiement intervient
 *   uniquement aux mois 3, 6, 9 et 12 de l'exercice.
 *
 * @param collectee    - TVA collectée sur les ventes (12 valeurs)
 * @param deductible   - TVA déductible sur achats + immos (12 valeurs)
 * @param periodicite  - régime de déclaration
 * @param initialCredit - crédit résiduel issu de l'exercice précédent
 */
export function computeTVAMonthly(
  collectee: MonthlySeries,
  deductible: MonthlySeries,
  periodicite: "mensuel" | "trimestriel",
  initialCredit = 0,
): TVAMonthlyResult {
  const nMois = Math.max(collectee.length, deductible.length);
  const tvaNetteMonthly = zeroSeries(nMois);
  const creditReporteMonthly = zeroSeries(nMois);
  const tvaAPayerMonthly = zeroSeries(nMois);

  let credit = initialCredit;
  let accumTrimestre = 0;

  for (let m = 0; m < nMois; m++) {
    const brute = (collectee[m] ?? 0) - (deductible[m] ?? 0);
    tvaNetteMonthly[m] = brute;

    if (periodicite === "mensuel") {
      const netAvecCredit = brute - credit;
      if (netAvecCredit < 0) {
        creditReporteMonthly[m] = -netAvecCredit;
        tvaAPayerMonthly[m] = 0;
        credit = -netAvecCredit;
      } else {
        creditReporteMonthly[m] = 0;
        tvaAPayerMonthly[m] = netAvecCredit;
        credit = 0;
      }
    } else {
      // Trimestriel : accumulation puis paiement en fin de trimestre
      accumTrimestre += brute;
      if ((m + 1) % 3 === 0 || m === nMois - 1) {
        const netAvecCredit = accumTrimestre - credit;
        if (netAvecCredit < 0) {
          creditReporteMonthly[m] = -netAvecCredit;
          tvaAPayerMonthly[m] = 0;
          credit = -netAvecCredit;
        } else {
          creditReporteMonthly[m] = 0;
          tvaAPayerMonthly[m] = netAvecCredit;
          credit = 0;
        }
        accumTrimestre = 0;
      } else {
        // Mois intermédiaires du trimestre — crédit en attente
        creditReporteMonthly[m] = credit;
        tvaAPayerMonthly[m] = 0;
      }
    }
  }

  return { tvaNetteMonthly, creditReporteMonthly, tvaAPayerMonthly, finalCredit: credit };
}
