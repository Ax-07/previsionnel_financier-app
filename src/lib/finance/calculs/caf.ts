import type { YearAcc } from "@/lib/finance/utils";

// â”€â”€ Capacité d'autofinancement â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * CAF = ResNet + DotAmort + DotProv âˆ’ Reprises
 *
 * La CAF représente la ressource interne dégagée par l'activité,
 * avant prise en compte des flux d'investissement et de financement.
 */
export function calcCAF(
  resNet: YearAcc,
  dotationsAmort: YearAcc,
  dotationsProvisions: YearAcc,
  reprises: YearAcc,
): YearAcc {
  return {
    y1: resNet.y1 + dotationsAmort.y1 + dotationsProvisions.y1 - reprises.y1,
    y2: resNet.y2 + dotationsAmort.y2 + dotationsProvisions.y2 - reprises.y2,
    y3: resNet.y3 + dotationsAmort.y3 + dotationsProvisions.y3 - reprises.y3,
  };
}
