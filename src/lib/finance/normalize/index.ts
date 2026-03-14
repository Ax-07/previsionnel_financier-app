/**
 * Point d'entrée de la couche de normalisation.
 *
 * Usage recommandé :
 *   import { normalizeActivites, type NormalizedActivite } from "@/lib/finance/normalize";
 */

export type { NormalizedActivite, TypeActivite } from "./activite";
export { normalizeActivites } from "./activite";

export type { NormalizedSalarie, NormalizedDirigeant, NormalizedTNS } from "./personnel";
export { normalizeSalaries, normalizeDirigeants, normalizeTNS } from "./personnel";

export type {
  NormalizedImmo,
  ModeAmortissement,
  NormalizedLigneAmortissement,
} from "./immobilisations";
export { normalizeImmobilisations } from "./immobilisations";

export type { NormalizedEmprunt, NormalizedLigneEcheancier } from "./emprunts";
export { normalizeEmprunts } from "./emprunts";

export type { NormalizedCharge, FrequenceCharge } from "./charges";
export { normalizeFournitures, normalizeServices, normalizeImpotsTaxes } from "./charges";
