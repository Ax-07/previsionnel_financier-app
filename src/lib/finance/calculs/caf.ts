import type { YearAcc } from "@/lib/finance/utils";

export type YAcc = YearAcc;

// ── Capacité d'autofinancement ────────────────────────────────────────────────

/**
 * CAF = ResNet + DotAmort + DotProv − Reprises
 *
 * La CAF représente la ressource interne dégagée par l'activité,
 * avant prise en compte des flux d'investissement et de financement.
 */
export function calcCAF(
  resNet: YAcc,
  dotationsAmort: YAcc,
  dotationsProvisions: YAcc,
  reprises: YAcc,
): YAcc {
  return {
    y1: resNet.y1 + dotationsAmort.y1 + dotationsProvisions.y1 - reprises.y1,
    y2: resNet.y2 + dotationsAmort.y2 + dotationsProvisions.y2 - reprises.y2,
    y3: resNet.y3 + dotationsAmort.y3 + dotationsProvisions.y3 - reprises.y3,
  };
}
