/**
 * Types pour la simulation multi-mois sur une période de contrat.
 *
 * Ce module définit les structures nécessaires pour :
 * - la période de contrat (dates début/fin)
 * - le suivi des congés payés (acquisition, prise, provision)
 * - les bulletins mensuels enrichis
 * - les totaux consolidés sur la durée du contrat
 */

import type { SimulationInput, SimulationResultat } from "@/lib/paie/types";
import type { CumulsAnnuels } from "@/lib/paie/engine/cumuls";

// ─────────────────────────────────────────────────────────────────────────────
// Période de contrat
// ─────────────────────────────────────────────────────────────────────────────

/** Période de contrat pour la simulation multi-mois */
export interface ContratPeriode {
  /** Date de début de contrat (ISO 8601 : "YYYY-MM-DD") */
  dateDebut: string;
  /** Date de fin de contrat (ISO 8601 : "YYYY-MM-DD") */
  dateFin: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Congés payés
// ─────────────────────────────────────────────────────────────────────────────

/** État du suivi des congés payés à un instant donné */
export interface CongesPayesState {
  /** Jours ouvrables de CP acquis depuis le début du contrat */
  joursAcquisCumules: number;
  /** Jours ouvrables de CP effectivement pris */
  joursPrisCumules: number;
  /** Solde de CP disponible (acquis - pris) */
  soldeCP: number;
  /** Provision financière CP cumulée (charge employeur) */
  provisionCPCumulee: number;
  /** Jours acquis ce mois-ci (2.5 × prorata si mois incomplet) */
  joursAcquisMois: number;
  /** Provision CP de ce mois (≈ 10 % du brut soumis) */
  provisionCPMois: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bulletin mensuel enrichi
// ─────────────────────────────────────────────────────────────────────────────

/** Bulletin de paie mensuel enrichi avec le contexte du contrat */
export interface BulletinMensuel {
  /** Clé temporelle du mois (ex. "2026-01") */
  mois: string;
  /** Libellé d'affichage (ex. "Janvier 2026") */
  moisLabel: string;
  /** Numéro du mois dans le contrat (1-based) */
  numeroMois: number;
  /** Résultat de la simulation pour ce mois */
  simulation: SimulationResultat;
  /** Input de simulation utilisé pour ce mois (avec prorata le cas échéant) */
  input: SimulationInput;
  /** État des congés payés en fin de mois */
  congesPayes: CongesPayesState;
  /** Cumuls annuels en fin de mois */
  cumuls: CumulsAnnuels;
  /** Ce mois est le premier du contrat (proratisé si entrée en cours de mois) */
  estMoisEntree: boolean;
  /** Ce mois est le dernier du contrat (proratisé si sortie en cours de mois) */
  estMoisSortie: boolean;
  /** Montant de l'indemnité CP ajouté au brut de ce mois (0 sauf dernier mois si CP pris) */
  indemniteCP: number;
  /** Montant de l'indemnité compensatrice CP (fin de CDD, jours non pris) ajouté au brut du dernier mois */
  indemniteCompensatriceCP: number;
  /** Jours ouvrés travaillés ce mois */
  joursOuvresTravailles: number;
  /** Jours ouvrés totaux du mois calendaire */
  joursOuvresDuMois: number;
  /** Facteur de prorata appliqué (1 = mois complet, < 1 = mois partiel) */
  facteurProrata: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Totaux consolidés
// ─────────────────────────────────────────────────────────────────────────────

/** Totaux consolidés sur la durée du contrat */
export interface TotauxContrat {
  /** Nombre total de mois (complets ou partiels) */
  nbMois: number;
  /** Brut total cumulé */
  brutTotal: number;
  /** Net à payer total cumulé */
  netAPayerTotal: number;
  /** Coût employeur total cumulé (hors provision CP) */
  coutEmployeurTotal: number;
  /** Coût employeur total incluant la provision CP */
  coutEmployeurTotalAvecCP: number;
  /** Total cotisations salariales cumulées */
  cotisationsSalarialesTotal: number;
  /** Total cotisations patronales cumulées */
  cotisationsPatronalesTotal: number;
  /** Provision congés payés cumulée sur toute la période */
  provisionCPTotale: number;
  /**
   * Indemnité compensatrice de congés payés (fin de CDD).
   * Porte uniquement sur les jours acquis **non pris**.
   */
  indemniteCompensatriceCP: number;
  /** Indemnité CP versée pour les jours pris (ajoutée au brut du dernier mois, soumise à cotisations) */
  indemniteCPPris: number;
  /** Nombre de jours CP demandés par l'utilisateur */
  joursCPPris: number;
  /** Total jours CP acquis */
  joursCPAcquisTotal: number;
  /** Montant total RGDU */
  rgduTotal: number;
  /** Montant total PAS */
  pasTotal: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Résultat complet de simulation contrat
// ─────────────────────────────────────────────────────────────────────────────

/** Résultat complet d'une simulation multi-mois sur une période de contrat */
export interface SimulationContratResultat {
  /** Période de contrat simulée */
  periode: ContratPeriode;
  /** Bulletins mensuels générés (ordre chronologique) */
  bulletins: BulletinMensuel[];
  /** Totaux consolidés sur la durée du contrat */
  totaux: TotauxContrat;
  /** État final des congés payés en fin de contrat */
  congesPayesFinal: CongesPayesState;
}
