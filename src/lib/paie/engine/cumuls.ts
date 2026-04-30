/**
 * Suivi des cumuls annuels par salarié.
 *
 * Permet la régularisation progressive sur l'année civile :
 *   - Base RGDU annuelle (pour le recalcul du coefficient moyen)
 *   - Cumuls T1 / T2 Agirc-Arrco (pour les plafonds annuels)
 *   - PMSS cumulé (proratisé par présence)
 *   - CSG/CRDS cumulée (informative)
 *
 * Le module est volontairement sans état côté moteur — les cumuls sont passés
 * en paramètre et retournés en sortie (fonctionnel / immuable).
 * La persistance est à la charge du store Zustand ou de la couche service.
 */

import { roundMontant, roundAssiette } from "@/lib/paie/engine/arrondi";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Cumuls annuels pour un salarié et un exercice donné */
export interface CumulsAnnuels {
  /** Identifiant unique du salarié (ex. ID BDD ou libellé) */
  salarieId: string;
  /** Exercice civil (ex. 2026) */
  exercice: number;
  /** Cumul du brut soumis depuis le début de l'exercice */
  brutSoumisCumul: number;
  /** Cumul PMSS proratisé (base de comparaison Agirc-Arrco) */
  pmssCumul: number;
  /** Cumul base T1 Agirc-Arrco */
  baseT1Cumul: number;
  /** Cumul base T2 Agirc-Arrco */
  baseT2Cumul: number;
  /** Cumul RGDU (réduction obtenue) */
  montantRGDUCumul: number;
  /** Cumul cotisations salariales */
  cotisationsSalarialesCumul: number;
  /** Cumul cotisations patronales brutes (hors RGDU) — voir montantRGDUCumul pour la réduction */
  cotisationsPatronalesCumul: number;
  /** Nombre de bulletins déjà intégrés */
  nbBulletins: number;
  /** Date de dernière mise à jour (ISO 8601) */
  derniereMiseAJour: string;
}

/** Données d'un bulletin à intégrer dans les cumuls */
export interface BulletinPourCumul {
  brutSoumis: number;
  pmssProratise: number;
  baseT1: number;
  baseT2: number;
  montantRGDU: number;
  totalCotisationsSalariales: number;
  /** Total cotisations patronales brutes (hors RGDU) — voir montantRGDU pour la réduction */
  totalCotisationsPatronales: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initialisation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crée un enregistrement de cumuls annuels vide pour un salarié.
 */
export function creerCumulsVides(
  salarieId: string,
  exercice: number,
): CumulsAnnuels {
  return {
    salarieId,
    exercice,
    brutSoumisCumul: 0,
    pmssCumul: 0,
    baseT1Cumul: 0,
    baseT2Cumul: 0,
    montantRGDUCumul: 0,
    cotisationsSalarialesCumul: 0,
    cotisationsPatronalesCumul: 0,
    nbBulletins: 0,
    derniereMiseAJour: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Accumulation d'un bulletin
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Intègre les données d'un bulletin dans les cumuls annuels existants.
 *
 * Cette fonction est pure : elle retourne un nouvel objet sans muter le précédent.
 *
 * @param cumuls  - Cumuls actuels (peut être null pour le premier bulletin)
 * @param bulletin - Données du bulletin à intégrer
 * @param salarieId - Identifiant du salarié
 * @param exercice  - Exercice civil
 */
export function integrerBulletin(
  cumuls: CumulsAnnuels | null,
  bulletin: BulletinPourCumul,
  salarieId: string,
  exercice: number,
): CumulsAnnuels {
  const base = cumuls ?? creerCumulsVides(salarieId, exercice);

  return {
    ...base,
    brutSoumisCumul: roundMontant(base.brutSoumisCumul + bulletin.brutSoumis),
    pmssCumul: roundAssiette(base.pmssCumul + bulletin.pmssProratise),
    baseT1Cumul: roundAssiette(base.baseT1Cumul + bulletin.baseT1),
    baseT2Cumul: roundAssiette(base.baseT2Cumul + bulletin.baseT2),
    montantRGDUCumul: roundMontant(base.montantRGDUCumul + bulletin.montantRGDU),
    cotisationsSalarialesCumul: roundMontant(
      base.cotisationsSalarialesCumul + bulletin.totalCotisationsSalariales,
    ),
    cotisationsPatronalesCumul: roundMontant(
      base.cotisationsPatronalesCumul + bulletin.totalCotisationsPatronales
    ),
    nbBulletins: base.nbBulletins + 1,
    derniereMiseAJour: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Taux patronal moyen annuel (pour régularisation)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule le taux de cotisations patronales effectif (net de RGDU) basé sur les cumuls annuels.
 *
 * Formule : (cotisations patronales brutes − RGDU) / brut soumis × 100
 * Cohérent avec `coutEmployeur = brut + totalPat − RGDU`.
 *
 * Utile pour la régularisation de fin d'année ou la projection prévisionnel.
 *
 * @returns Taux en % (ex. 6.7 pour 6,7 %)
 */
export function tauxPatronalEffectifCumule(cumuls: CumulsAnnuels): number {
  if (cumuls.brutSoumisCumul <= 0) return 0;
  return roundMontant(
    ((cumuls.cotisationsPatronalesCumul - cumuls.montantRGDUCumul) / cumuls.brutSoumisCumul) * 100,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversion cumuls → données bulletin (helper)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extrait les champs nécessaires à l'accumulation depuis un `SimulationResultat`.
 *
 * Évite l'import circulaire avec simulate.ts en définissant un type structurel minimal.
 */
export function bulletinPourCumul(resultat: {
  brutSoumis: number;
  pmssProratise: number;
  baseT1: number;
  baseT2: number;
  montantRGDU: number;
  totalCotisationsSalariales: number;
  totalCotisationsPatronales: number;
}): BulletinPourCumul {
  return {
    brutSoumis: resultat.brutSoumis,
    pmssProratise: resultat.pmssProratise,
    baseT1: resultat.baseT1,
    baseT2: resultat.baseT2,
    montantRGDU: resultat.montantRGDU,
    totalCotisationsSalariales: resultat.totalCotisationsSalariales,
    totalCotisationsPatronales: resultat.totalCotisationsPatronales,
  };
}
