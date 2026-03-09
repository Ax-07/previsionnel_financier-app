/**
 * Point d'entrée public du module `lib/paie`.
 *
 * Exporte le pipeline de simulation et les utilitaires nécessaires
 * pour l'UI et l'intégration avec le prévisionnel.
 */

export { simulate, netToGross } from "@/lib/paie/simulate";
export { getParams, AVAILABLE_MILLESIMES, DEFAULT_MILLESIME } from "@/lib/paie/params/index";
export { remunMinApprenti, trancheAge } from "@/lib/paie/profiles/apprenti";
export { seuilFranchiseStage } from "@/lib/paie/profiles/stage";
export { PARAMS_2026 } from "@/lib/paie/params/2026";

export type {
  SimulationInput,
  SimulationResultat,
  LigneCotisation,
  SalarieInput,
  EntrepriseInput,
  TypeContrat,
  StatutCadre,
  ModePAS,
  GenerationApprenti,
  AnneeApprenti,
  FamilleCotisation,
} from "@/lib/paie/types";
