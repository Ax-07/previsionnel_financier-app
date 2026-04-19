/**
 * Helpers partagés pour l'affichage des bulletins de paie.
 *
 * Utilisé par BulletinDisplay et BulletinPdfTemplate pour éviter
 * la duplication des calculs métier dans les composants UI.
 */

import type { SimulationInput, SimulationResultat, FamilleCotisation } from "@/lib/paie/types";
import { calcSalaireBase } from "@/lib/paie/engine/assiettes";
import { HEURES_LEGALES } from "./simulateur-schema";

// ─────────────────────────────────────────────────────────────────────────────
// Calcul de la composition du brut
// ─────────────────────────────────────────────────────────────────────────────

export interface BulletinBrutDetails {
  salaireBase: number;
  heuresNormales: number;
  tauxHoraire: number;
  nbHeuresSup: number;
  montantHS: number;
  tauxMajoration: number;
  primes: number;
  avantages: number;
  absences: number;
  aDesExtras: boolean;
}

/**
 * Calcule les détails de composition du brut à partir de l'input et du résultat.
 * Fonction pure — aucun effet de bord.
 */
export function calcBrutDetails(input: SimulationInput, resultat: SimulationResultat): BulletinBrutDetails {
  const sal = input.salarié;
  const salaireBase = calcSalaireBase(sal);
  const heuresNormales = Math.min(sal.heuresContrat, HEURES_LEGALES);
  const tauxHoraire = sal.brutMensuel > 0 ? sal.brutMensuel / heuresNormales : 0;
  const nbHeuresSup = sal.heuresSupplementaires ?? 0;
  const montantHS = nbHeuresSup > 0 ? (resultat.heuresSup ?? 0) : 0;
  const tauxMajoration =
    nbHeuresSup > 0 && tauxHoraire > 0
      ? montantHS / (nbHeuresSup * tauxHoraire) - 1
      : (sal.tauxMajorationHeuresSup ?? 0.25);
  const primes = sal.primesSoumises ?? 0;
  const avantages = sal.avantagesEnNature ?? 0;
  const absences = sal.absencesNonRemunerees ?? 0;
  const aDesExtras = nbHeuresSup > 0 || primes > 0 || avantages > 0 || absences > 0;

  return {
    salaireBase,
    heuresNormales,
    tauxHoraire,
    nbHeuresSup,
    montantHS,
    tauxMajoration,
    primes,
    avantages,
    absences,
    aDesExtras,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupes de familles pour l'affichage structuré
// ─────────────────────────────────────────────────────────────────────────────

export interface GroupeLabel {
  label: string;
  familles: FamilleCotisation[];
}

/**
 * Ordre d'affichage officiel des familles de cotisations
 * (conforme bulletin de paie simplifié).
 */
export const GROUPES: GroupeLabel[] = [
  {
    label: "Santé",
    familles: ["assurance_maladie", "prevoyance_mutuelle"],
  },
  {
    label: "Accidents du travail & maladies professionnelles",
    familles: ["at_mp"],
  },
  {
    label: "Retraite",
    familles: ["assurance_vieillesse", "retraite_complementaire", "ceg", "cet"],
  },
  {
    label: "Cotisations employeur",
    familles: ["allocations_familiales", "assurance_chomage", "apec", "ags", "fnal", "csa", "dialogue_social", "versement_mobilite", "taxe_apprentissage", "formation_professionnelle"],
  },
  {
    label: "CSG / CRDS",
    familles: ["csg_deductible", "csg_non_deductible", "crds"],
  },
  {
    label: "Cotisations et contributions sociales facultatives",
    familles: ["prevoyance_prevoyance"],
  },
];
