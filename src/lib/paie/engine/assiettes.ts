/**
 * Moteur de calcul des assiettes.
 *
 * Étapes couvertes :
 *   1. Brut soumis à cotisations sociales
 *   2. PMSS proratisé
 *   3. Assiette CSG/CRDS
 *   4. Tranches Agirc-Arrco T1 / T2
 */

import { ABATTEMENT_CSG, PARAMS_2026 } from "@/lib/paie/params/2026";
import type { SalarieInput, EntrepriseInput, HeuresSupLigne } from "@/lib/paie/types";
import type { TrancheHeuresSup } from "@/lib/paie/conventions/types";
import { roundAssiette } from "@/lib/paie/engine/arrondi";

// ─────────────────────────────────────────────────────────────────────────────
// Proratisation entrée / sortie en cours de mois
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule le nombre de jours calendaires dans un mois donné.
 *
 * @param annee - Année (ex. 2026)
 * @param mois  - Mois 1-indexé (1 = janvier)
 */
export function joursCalendairesMois(annee: number, mois: number): number {
  return new Date(annee, mois, 0).getDate();
}

/**
 * Calcule le facteur de proratisation pour une entrée ou sortie en cours de mois.
 *
 * La méthode retenue est la proratisation calendaire (jours d'activité / jours du mois)
 * conformément à la pratique Urssaf pour le PMSS et les allégements.
 *
 * Si aucune date d'entrée ni de sortie n'est renseignée (ou si le salarié est
 * présent tout le mois), le facteur est 1 (pas de proratisation).
 *
 * @param salarié - Paramètres du salarié (dateEntree, dateSortie, moisReference)
 * @returns Facteur entre 0 et 1
 */
export function calcFacteurProrata(salarié: SalarieInput): number {
  const { dateEntree, dateSortie, moisReference } = salarié;

  if (!dateEntree && !dateSortie) return 1;

  // Mois de référence : priorité à moisReference, sinon mois courant
  const ref = moisReference
    ? new Date(`${moisReference}-01`)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const annee = ref.getFullYear();
  const mois = ref.getMonth() + 1; // 1-indexé
  const totalJours = joursCalendairesMois(annee, mois);

  // Borne de début : 1er du mois par défaut, sinon jour d'entrée
  let jourDebut = 1;
  if (dateEntree) {
    const entree = new Date(dateEntree);
    if (entree.getFullYear() === annee && entree.getMonth() + 1 === mois) {
      jourDebut = entree.getDate();
    }
  }

  // Borne de fin : dernier jour du mois par défaut, sinon jour de sortie
  let jourFin = totalJours;
  if (dateSortie) {
    const sortie = new Date(dateSortie);
    if (sortie.getFullYear() === annee && sortie.getMonth() + 1 === mois) {
      jourFin = sortie.getDate();
    }
  }

  const joursActifs = Math.max(0, jourFin - jourDebut + 1);
  return joursActifs / totalJours;
}

// ─────────────────────────────────────────────────────────────────────────────
// Brut soumis à cotisations sociales
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule le salaire de base proratisé selon les heures réellement travaillées.
 * Si heuresTravaillees n'est pas fourni, le salaire est considéré comme entier.
 */
export function calcSalaireBase(salarié: SalarieInput): number {
  const { brutMensuel, heuresContrat, heuresTravaillees } = salarié;
  if (!heuresTravaillees || heuresTravaillees >= heuresContrat) return brutMensuel;
  const taux = heuresTravaillees / heuresContrat;
  return brutMensuel * taux;
}

/**
 * Calcule le montant des heures supplémentaires majorées.
 *
 * Le taux horaire de base est toujours calculé sur les heures "normales" :
 * - Temps partiel : heuresContrat (ex. 80h)
 * - Temps plein ou contrat avec HS intégrées (ex. 169h) : 151,67h légales
 *
 * Cela évite une sous-estimation du taux quand heuresContrat > 151,67h
 * (e.g. contrat 39h/semaine avec HS structurelles).
 */
export function calcHeuresSup(salarié: SalarieInput): number {
  const {
    heuresContrat,
    heuresSupplementaires = 0,
    tauxMajorationHeuresSup = 0.25,
    brutMensuel,
  } = salarié;
  if (heuresSupplementaires <= 0) return 0;

  // Taux horaire = brut / heures normales (temps partiel ou légal)
  const heuresNormales = Math.min(heuresContrat, PARAMS_2026.heuresLegalesMensuelles);
  const tauxHoraire = brutMensuel / heuresNormales;
  return heuresSupplementaires * tauxHoraire * (1 + tauxMajorationHeuresSup);
}

/**
 * Calcule le montant total des heures supplémentaires avec une grille
 * conventionnelle multi-tranches (ex. HCR : 10 % h36-39, 20 % h40-43, 50 % h44+).
 *
 * Les tranches sont définies en heures hebdomadaires absolues (ex. heureDebut: 36
 * = à partir de la 36e heure de la semaine). Les heures mensuelles sont converties
 * en hebdomadaires sur la base de 52/12 semaines par mois.
 *
 * @param salarié  - Données salarié (heuresContrat, heuresSupplementaires, brutMensuel)
 * @param tranches - Grille conventionnelle ordonnée par heureDebut croissant
 */
export function calcHeuresSupMultiTranches(
  salarié: SalarieInput,
  tranches: TrancheHeuresSup[],
): number {
  const { heuresContrat, heuresSupplementaires = 0, brutMensuel } = salarié;
  if (heuresSupplementaires <= 0 || tranches.length === 0) return 0;

  const heuresNormales = Math.min(heuresContrat, PARAMS_2026.heuresLegalesMensuelles);
  const tauxHoraire = brutMensuel / heuresNormales;

  // Facteur de conversion mensuel ↔ hebdomadaire (52 semaines / 12 mois)
  const SEMAINES_PAR_MOIS = 52 / 12;
  const hsParSemaine = heuresSupplementaires / SEMAINES_PAR_MOIS;
  // Heures légales hebdomadaires (≈ 35 h)
  const heuresLegalesHeb = PARAMS_2026.heuresLegalesMensuelles / SEMAINES_PAR_MOIS;
  const totalHebdo = heuresLegalesHeb + hsParSemaine;

  let total = 0;
  for (const tranche of tranches) {
    // Borne supérieure (Infinity pour la dernière tranche ouverte)
    const fin = tranche.heureFin ?? Infinity;
    // HS dans cette tranche : heures travaillées dans [heureDebut ; fin], ramenées à 0 minimum
    const hsHebDansTranche = Math.max(
      0,
      Math.min(totalHebdo, fin) - (tranche.heureDebut - 1),
    );
    if (hsHebDansTranche <= 0) continue;

    const hsMensuelDansTranche = hsHebDansTranche * SEMAINES_PAR_MOIS;
    total += hsMensuelDansTranche * tauxHoraire * (1 + tranche.taux);
  }

  return total;
}

/**
 * Calcule le détail des heures supplémentaires par tranche pour l'affichage du bulletin.
 *
 * Retourne une ligne par tranche effectivement travaillée, avec le nombre d'heures mensuelles,
 * le taux de majoration et le montant €. Le total des montants est cohérent avec
 * `calcHeuresSupMultiTranches(salarié, tranches)`.
 *
 * @param salarié  - Données salarié
 * @param tranches - Grille de tranches (légales ou conventionnelles), ordonnée par heureDebut croissant
 */
export function calcHeuresSupLignesDetail(
  salarié: SalarieInput,
  tranches: TrancheHeuresSup[],
): HeuresSupLigne[] {
  const { heuresContrat, heuresSupplementaires = 0, brutMensuel } = salarié;
  if (heuresSupplementaires <= 0 || tranches.length === 0) return [];

  const heuresNormales = Math.min(heuresContrat, PARAMS_2026.heuresLegalesMensuelles);
  const tauxHoraire = brutMensuel / heuresNormales;

  const SEMAINES_PAR_MOIS = 52 / 12;
  const hsParSemaine = heuresSupplementaires / SEMAINES_PAR_MOIS;
  const heuresLegalesHeb = PARAMS_2026.heuresLegalesMensuelles / SEMAINES_PAR_MOIS;
  const totalHebdo = heuresLegalesHeb + hsParSemaine;

  const lignes: HeuresSupLigne[] = [];

  for (const tranche of tranches) {
    const fin = tranche.heureFin ?? Infinity;
    const hsHebDansTranche = Math.max(
      0,
      Math.min(totalHebdo, fin) - (tranche.heureDebut - 1),
    );
    if (hsHebDansTranche <= 0) continue;

    const heuresMois = hsHebDansTranche * SEMAINES_PAR_MOIS;
    const montant = heuresMois * tauxHoraire * (1 + tranche.taux);

    const finLabel = tranche.heureFin !== null ? `h${tranche.heureFin}` : "+";
    const label = `HS ${(tranche.taux * 100).toFixed(0)} % (h${tranche.heureDebut}–${finLabel})`;

    lignes.push({ label, heures: heuresMois, tauxMajoration: tranche.taux, montant });
  }

  return lignes;
}

/**
 *
 * brut_soumis = salaire_de_base + primes_soumises + heures_sup + avantages_en_nature - absences
 */
export function calcBrutSoumis(salarié: SalarieInput): number {
  const base = calcSalaireBase(salarié);
  const heuresSup = calcHeuresSup(salarié);
  const primes = salarié.primesSoumises ?? 0;
  const avantages = salarié.avantagesEnNature ?? 0;
  const absences = salarié.absencesNonRemunerees ?? 0;
  return base + heuresSup + primes + avantages - absences;
}

// ─────────────────────────────────────────────────────────────────────────────
// PMSS proratisé
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule le Plafond Mensuel de Sécurité Sociale proratisé selon les heures
 * et la présence effective (entrée/sortie en cours de mois).
 *
 * Méthode : proratisation par rapport aux heures légales mensuelles 151,67 h,
 * puis par le facteur de présence calendaire si entrée/sortie en cours de mois.
 */
export function calcPMSSProratise(salarié: SalarieInput): number {
  const { heuresContrat } = salarié;
  const heuresLegales = PARAMS_2026.heuresLegalesMensuelles;

  // Proratisation temps partiel
  const facteurTps = heuresContrat < heuresLegales
    ? heuresContrat / heuresLegales
    : 1;

  // Proratisation présence (entrée/sortie en cours de mois)
  const facteurPresence = calcFacteurProrata(salarié);

  return roundAssiette(PARAMS_2026.passMensuel * facteurTps * facteurPresence);
}

// ─────────────────────────────────────────────────────────────────────────────
// Assiette CSG / CRDS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule l'assiette CSG/CRDS : brut soumis × 98,25 %.
 */
export function calcAssietteCsg(brutSoumis: number): number {
  return brutSoumis * ABATTEMENT_CSG;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tranches Agirc-Arrco
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule les bases de cotisations Agirc-Arrco T1 et T2.
 *
 * T1 : de 0 à 1 PASS proratisé
 * T2 : de 1 PASS à 8 PASS proratisés (max 7 × PASS)
 */
export function calcTranchesArrco(
  brutSoumis: number,
  pmssProratise: number,
): { baseT1: number; baseT2: number } {
  const baseT1 = Math.min(brutSoumis, pmssProratise);
  const baseT2 = Math.min(
    Math.max(brutSoumis - pmssProratise, 0),
    7 * pmssProratise,
  );
  return { baseT1, baseT2 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Résumé des assiettes (utilisé par le pipeline principal)
// ─────────────────────────────────────────────────────────────────────────────

export interface AssiettesResult {
  salaireBase: number;
  heuresSup: number;
  brutSoumis: number;
  pmssProratise: number;
  assietteCsg: number;
  baseT1: number;
  baseT2: number;
  /** Facteur de proratisation calendaire (0–1) — utile pour RGDU et SMIC de référence */
  facteurProrata: number;
}

export function buildAssiettes(
  salarié: SalarieInput,
  entreprise: EntrepriseInput,
): AssiettesResult {
  void entreprise; // réservé pour futurs paramètres d'entreprise (mutuelle, prévoyance)
  const salaireBase = calcSalaireBase(salarié);
  const heuresSup = calcHeuresSup(salarié);
  const brutSoumis = calcBrutSoumis(salarié);
  const pmssProratise = calcPMSSProratise(salarié);
  const assietteCsg = calcAssietteCsg(brutSoumis);
  const { baseT1, baseT2 } = calcTranchesArrco(brutSoumis, pmssProratise);
  const facteurProrata = calcFacteurProrata(salarié);

  return { salaireBase, heuresSup, brutSoumis, pmssProratise, assietteCsg, baseT1, baseT2, facteurProrata };
}
