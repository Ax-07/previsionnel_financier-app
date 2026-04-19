/**
 * Point d'entrée public du module contrat.
 * Réexporte les types et fonctions pour la simulation multi-mois.
 */

// Types
export type {
  ContratPeriode,
  CongesPayesState,
  BulletinMensuel,
  TotauxContrat,
  SimulationContratResultat,
} from "@/lib/paie/contrat/types";

// Simulation contrat
export { simulateContrat } from "@/lib/paie/contrat/simulate-contrat";
export type { SimulationContratInput } from "@/lib/paie/contrat/simulate-contrat";

// Congés payés
export {
  calcCongesPayesMois,
  calcIndemniteCP,
  calcIndemniteCompensatriceCP,
  creerCongesPayesVides,
  TAUX_PROVISION_CP,
  TAUX_INDEMNITE_CP_CDD,
  JOURS_CP_PAR_MOIS,
} from "@/lib/paie/contrat/conges-payes";

// Utilitaires dates
export {
  joursOuvresMois,
  joursOuvresEntre,
  joursOuvrablesMois,
  joursFeries,
  decomposerPeriode,
  labelMois,
  parseDate,
} from "@/lib/paie/contrat/date-utils";
export type { MoisContrat } from "@/lib/paie/contrat/date-utils";
