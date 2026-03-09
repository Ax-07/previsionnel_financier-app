/**
 * Profil : salarié du régime général (cadre ou non-cadre).
 * Application des cotisations de droit commun sans modification.
 */

import type { SalarieInput } from "@/lib/paie/types";

export function isRegimeGeneral(salarié: SalarieInput): boolean {
  return salarié.typeContrat === "CDI" || salarié.typeContrat === "CDD";
}
