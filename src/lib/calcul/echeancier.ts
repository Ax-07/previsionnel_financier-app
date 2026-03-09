/**
 * Moteur de calcul de l'échéancier d'emprunt.
 * Génère le tableau d'amortissement complet (capital, intérêts, assurance, mensualité).
 *
 * Types supportés :
 *   AMORTISSABLE  — capital remboursé progressivement
 *   IN_FINE       — seuls les intérêts sont versés, tout le capital à la dernière échéance
 *
 * Modalités :
 *   ECHEANCE_CONSTANTE — annuité constante (méthode française)
 *   CAPITAL_CONSTANT   — amortissements constants, échéance décroissante
 *
 * Mode assurance :
 *   CAPITAL_RESTANT — prime calculée sur le capital restant dû (décroissant)
 *   CAPITAL_INITIAL — prime fixe calculée sur le capital initial
 *
 * Gestion du différé :
 *   PARTIEL — pendant le différé, seuls intérêts (+ assurance) sont versés
 *   TOTAL   — aucun versement pendant le différé
 *   AUCUN   — remboursement normal dès le début
 */

import type { EmpruntRow, LigneEcheancier } from "@/lib/schemas/financement";
import { tauxPeriodique, nbPeriodesFromMois } from "@/lib/schemas/financement";

export interface ParamsEcheancier {
  montant:               number;
  tauxAnnuel:            number;
  tauxAssurance:         number;
  dureeEnMois:           number;
  periodicite:           EmpruntRow["periodicite"];
  dateDéblocage:         string; // YYYY-MM-DD
  typeDiffere:           EmpruntRow["typeDiffere"];
  dureeDiffereEnMois:    number;
  fraisDossier:          number;
  typeEmprunt?:          EmpruntRow["typeEmprunt"];
  modaliteRemboursement?: EmpruntRow["modaliteRemboursement"];
  modeAssurance?:        EmpruntRow["modeAssurance"];
}

const MOIS_PAR_PERIODICITE: Record<EmpruntRow["periodicite"], number> = {
  MENSUEL:     1,
  TRIMESTRIEL: 3,
  SEMESTRIEL:  6,
  ANNUEL:      12,
};

/**
 * Ajoute `nbMois` mois à une date (format YYYY-MM-DD) et retourne la nouvelle date.
 */
function addMois(dateStr: string, nbMois: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + nbMois);
  return d.toISOString().slice(0, 10);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Calcule et retourne le tableau d'échéances d'un emprunt.
 */
export function calculerEcheancier(params: ParamsEcheancier): LigneEcheancier[] {
  const {
    montant,
    tauxAnnuel,
    tauxAssurance,
    dureeEnMois,
    periodicite,
    dateDéblocage,
    typeDiffere,
    dureeDiffereEnMois,
    fraisDossier,
    typeEmprunt           = "AMORTISSABLE",
    modaliteRemboursement = "ECHEANCE_CONSTANTE",
    modeAssurance         = "CAPITAL_RESTANT",
  } = params;

  const moisParPeriode  = MOIS_PAR_PERIODICITE[periodicite];
  const tPeriode        = tauxPeriodique(tauxAnnuel, periodicite);
  const tAssurPeriode   = tauxPeriodique(tauxAssurance, periodicite);
  const nbPeriodesTotal = nbPeriodesFromMois(dureeEnMois, periodicite);
  const nbPeDiffere     = nbPeriodesFromMois(dureeDiffereEnMois, periodicite);
  const nbPeRembours    = nbPeriodesTotal - nbPeDiffere;

  // ── Précalcul selon modalité ────────────────────────────────────────────────
  let echeanceCapital = 0; // annuité cible (ECHEANCE_CONSTANTE)
  let capitalParPe    = 0; // amortissement fixe par période (CAPITAL_CONSTANT)

  if (typeEmprunt !== "IN_FINE") {
    if (modaliteRemboursement === "CAPITAL_CONSTANT") {
      capitalParPe = nbPeRembours > 0 ? montant / nbPeRembours : 0;
    } else {
      if (nbPeRembours > 0) {
        echeanceCapital = tPeriode === 0
          ? montant / nbPeRembours
          : (montant * tPeriode) / (1 - Math.pow(1 + tPeriode, -nbPeRembours));
      }
    }
  }

  const lignes: LigneEcheancier[] = [];
  let capitalRestant = montant;

  for (let i = 1; i <= nbPeriodesTotal; i++) {
    const dateEcheance        = addMois(dateDéblocage, i * moisParPeriode);
    const capitalRestantDebut = capitalRestant;
    const interesMois         = capitalRestant * tPeriode;

    // Assurance : capital restant ou capital initial
    const baseAssurance = modeAssurance === "CAPITAL_INITIAL" ? montant : capitalRestant;
    const assuranceMois = baseAssurance * tAssurPeriode;

    const estEnDiffere = i <= nbPeDiffere;
    let capitalRembourse = 0;
    let mensualiteTotale = 0;

    if (estEnDiffere) {
      capitalRembourse = 0;
      mensualiteTotale = typeDiffere === "TOTAL" ? 0 : interesMois + assuranceMois;
    } else if (typeEmprunt === "IN_FINE") {
      // Capital intégralement à la dernière période
      if (i === nbPeriodesTotal) {
        capitalRembourse = capitalRestant;
        mensualiteTotale = capitalRembourse + interesMois + assuranceMois;
      } else {
        capitalRembourse = 0;
        mensualiteTotale = interesMois + assuranceMois;
      }
    } else if (modaliteRemboursement === "CAPITAL_CONSTANT") {
      capitalRembourse = Math.min(capitalParPe, capitalRestant);
      mensualiteTotale = capitalRembourse + interesMois + assuranceMois;
    } else {
      // ECHEANCE_CONSTANTE + AMORTISSABLE (défaut)
      capitalRembourse = tPeriode === 0
        ? echeanceCapital
        : echeanceCapital - interesMois;
      capitalRembourse = Math.min(Math.max(0, capitalRembourse), capitalRestant);
      // Dernière échéance : ajuster si le capital résiduel a été plafonné (correction arrondi cumulé)
      mensualiteTotale = i === nbPeriodesTotal
        ? capitalRembourse + interesMois + assuranceMois
        : echeanceCapital + assuranceMois;
    }

    capitalRestant -= capitalRembourse;

    lignes.push({
      moisNumero:          i,
      dateEcheance,
      capitalRestantDebut: round2(capitalRestantDebut),
      interesMois:         round2(interesMois),
      assuranceMois:       round2(assuranceMois),
      capitalRembourse:    round2(capitalRembourse),
      mensualiteTotale:    round2(mensualiteTotale),
      capitalRestantFin:   round2(Math.max(0, capitalRestant)),
    });
  }

  // Frais de dossier : flux sortant dès le déblocage (mécanique transparente pour les calculs)
  if (fraisDossier > 0) {
    lignes.unshift({
      moisNumero:          0,
      dateEcheance:        dateDéblocage,
      capitalRestantDebut: montant,
      interesMois:         0,
      assuranceMois:       0,
      capitalRembourse:    0,
      mensualiteTotale:    fraisDossier,
      capitalRestantFin:   montant,
      type:                "FRAIS_DOSSIER",
    });
  }

  return lignes;
}

/**
 * Résumé rapide pour affichage dans le tableau (sans générer tout l'échéancier).
 */
export function resumeEmprunt(params: ParamsEcheancier) {
  const {
    montant,
    tauxAnnuel,
    tauxAssurance,
    dureeEnMois,
    periodicite,
    dateDéblocage,
    typeDiffere,
    dureeDiffereEnMois,
    fraisDossier,
    typeEmprunt           = "AMORTISSABLE",
    modaliteRemboursement = "ECHEANCE_CONSTANTE",
    modeAssurance         = "CAPITAL_RESTANT",
  } = params;

  const moisParPeriode  = MOIS_PAR_PERIODICITE[periodicite];
  const tP              = tauxPeriodique(tauxAnnuel, periodicite);
  const tA              = tauxPeriodique(tauxAssurance, periodicite);
  const N               = nbPeriodesFromMois(dureeEnMois, periodicite);
  const Nd              = nbPeriodesFromMois(dureeDiffereEnMois, periodicite);
  const Nr              = N - Nd;

  let echeanceMoyenne = 0;
  let coutTotalCredit = 0;

  if (typeEmprunt === "IN_FINE") {
    // Capital constant → intérêts fixes toute la durée
    // En différé TOTAL, aucun versement pendant Nd périodes
    const periodesPayees = typeDiffere === "TOTAL" ? Nr : N;
    const intParPe   = montant * tP;
    const assParPe   = montant * tA; // CRD = montant en permanence
    const totalInt   = round2(intParPe * periodesPayees);
    const totalAssur = round2(assParPe * periodesPayees);
    coutTotalCredit  = round2(totalInt + totalAssur + fraisDossier);
    // Display : intérêts + assurance hors remboursement final du capital
    echeanceMoyenne  = round2(intParPe + assParPe);
  } else if (modaliteRemboursement === "CAPITAL_CONSTANT") {
    const pk              = Nr > 0 ? montant / Nr : 0;
    // Somme des CRD période par période (differe + remboursement)
    const sumCRD_differe  = Nd * montant;
    const sumCRD_rembours = Nr > 0 ? Nr * montant - pk * Nr * (Nr - 1) / 2 : 0;
    // Intérêts : pendant le différé seulement si PARTIEL (CRD = montant, pas de capital remboursé)
    const intDiffere      = typeDiffere === "PARTIEL" ? tP * sumCRD_differe : 0;
    const totalInt        = round2(intDiffere + tP * sumCRD_rembours);
    // Assurance : exclure la période de différé si TOTAL
    const crdDiffereAssur = typeDiffere !== "TOTAL" ? sumCRD_differe : 0;
    const totalAssur      = modeAssurance === "CAPITAL_INITIAL"
      ? round2(tA * montant * (typeDiffere === "TOTAL" ? Nr : N))
      : round2(tA * (crdDiffereAssur + sumCRD_rembours));
    coutTotalCredit       = round2(totalInt + totalAssur + fraisDossier);
    // Échéance moyenne = (première + dernière) / 2
    const assFirst = modeAssurance === "CAPITAL_INITIAL" ? montant * tA : montant * tA;
    const assLast  = modeAssurance === "CAPITAL_INITIAL" ? montant * tA : pk * tA;
    const first    = pk + montant * tP + assFirst;
    const last     = pk + pk * tP + assLast;
    echeanceMoyenne = round2((first + last) / 2);
  } else {
    // ECHEANCE_CONSTANTE + AMORTISSABLE (cas par défaut — logique d'origine)
    let echeanceCapital = 0;
    if (Nr > 0) {
      echeanceCapital = tP === 0
        ? montant / Nr
        : (montant * tP) / (1 - Math.pow(1 + tP, -Nr));
    }
    // Intérêts : pendant le différé seulement si PARTIEL (CRD = montant, pas de capital remboursé)
    const intDiffere  = typeDiffere === "PARTIEL" ? tP * montant * Nd : 0;
    const totalInt    = round2(intDiffere + echeanceCapital * Nr - montant);
    // Assurance : exclure la période de différé si TOTAL
    // Approx CRD décroissant en remboursement : Nr*montant/2
    const crdDiffereAssur = typeDiffere !== "TOTAL" ? Nd * montant : 0;
    const totalAssur = modeAssurance === "CAPITAL_INITIAL"
      ? round2(tA * montant * (typeDiffere === "TOTAL" ? Nr : N))
      : round2(tA * (crdDiffereAssur + (Nr > 0 ? Nr * montant / 2 : 0)));
    coutTotalCredit = round2(totalInt + totalAssur + fraisDossier);
    // CAPITAL_INITIAL : assurance constante sur montant initial.
    // CAPITAL_RESTANT : assurance décroissante → utiliser la moyenne (≈ montant/2 × tA)
    // pour rester cohérent avec coutTotalCredit et éviter echeanceMoyenne × Nr ≠ total remboursé.
    const assurMoyenne = modeAssurance === "CAPITAL_INITIAL"
      ? montant * tA
      : Nr > 0 ? tA * montant / 2 : 0;
    echeanceMoyenne = round2(echeanceCapital + assurMoyenne);
  }

  const premierRembourement = addMois(dateDéblocage, (Nd + 1) * moisParPeriode);

  return {
    echeanceMoyenne,
    coutTotalCredit,
    premierRembourement,
    nbPeriodesTotal:  N,
    nbPeriodesDiffere: Nd,
  };
}

