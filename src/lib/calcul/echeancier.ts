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
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
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

  // Pour différé TOTAL : les intérêts non versés s'accumulent sur le capital (capitalisation).
  // Le capital effectif en début de phase de remboursement = montant × (1+tPeriode)^Nd.
  const capitalApresDiffere = (typeDiffere === "TOTAL" && nbPeDiffere > 0)
    ? montant * Math.pow(1 + tPeriode, nbPeDiffere)
    : montant;

  // ── Précalcul selon modalité ────────────────────────────────────────────────
  let echeanceCapital = 0; // annuité cible (ECHEANCE_CONSTANTE)
  let capitalParPe    = 0; // amortissement fixe par période (CAPITAL_CONSTANT)

  if (typeEmprunt !== "IN_FINE") {
    if (modaliteRemboursement === "CAPITAL_CONSTANT") {
      capitalParPe = nbPeRembours > 0 ? capitalApresDiffere / nbPeRembours : 0;
    } else {
      if (nbPeRembours > 0) {
        echeanceCapital = tPeriode === 0
          ? capitalApresDiffere / nbPeRembours
          : (capitalApresDiffere * tPeriode) / (1 - Math.pow(1 + tPeriode, -nbPeRembours));
      }
    }
  }

  const lignes: LigneEcheancier[] = [];
  let capitalRestant = montant;

  for (let i = 0; i <= nbPeriodesTotal; i++) {
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
      // i=0 = jour de déblocage : jamais de paiement, quelle que soit la modalité de différé.
      // Pour PARTIEL, les intérêts commencent à i=1 (première période après déblocage).
      mensualiteTotale = (typeDiffere === "TOTAL" || i === 0) ? 0 : interesMois + assuranceMois;
      // Différé TOTAL : les intérêts non payés sont capitalisés (ajoutés au capital restant dû)
      if (typeDiffere === "TOTAL" && i > 0) {
        capitalRestant += round2(interesMois);
      }
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

  // Frais de dossier : flux sortant dès le déblocage.
  // moisNumero = -1 pour éviter la collision avec la ligne i=0 (déblocage) qui existe toujours.
  if (fraisDossier > 0) {
    lignes.unshift({
      moisNumero:          -1,
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

  const dateDeblocageEffective = dateDéblocage && !isNaN(new Date(dateDéblocage).getTime())
    ? dateDéblocage
    : new Date().toISOString().slice(0, 10);

  const moisParPeriode  = MOIS_PAR_PERIODICITE[periodicite];
  const tP              = tauxPeriodique(tauxAnnuel, periodicite);
  const tA              = tauxPeriodique(tauxAssurance, periodicite);
  const N               = nbPeriodesFromMois(dureeEnMois, periodicite);
  const Nd              = nbPeriodesFromMois(dureeDiffereEnMois, periodicite);
  const Nr              = N - Nd;

  // Pour différé TOTAL : les intérêts sont capitalisés → capital effectif en début de remboursement.
  const capitalApresDiffere = (typeDiffere === "TOTAL" && Nd > 0)
    ? round2(montant * Math.pow(1 + tP, Nd))
    : montant;

  let echeanceMoyenne = 0;
  let coutTotalCredit = 0;

  if (typeEmprunt === "IN_FINE") {
    // IN_FINE : seuls les intérêts sont versés périodiquement, le capital intégralement à la fin.
    if (typeDiffere === "TOTAL") {
      // Différé total : intérêts capitalisés pendant Nd périodes, puis remboursement sur capitalApresDiffere.
      const intCapitalises = capitalApresDiffere - montant;
      const intParPe  = capitalApresDiffere * tP;
      const assBase   = modeAssurance === "CAPITAL_INITIAL" ? montant : capitalApresDiffere;
      const assParPe  = assBase * tA;
      coutTotalCredit  = round2(intCapitalises + intParPe * Nr + assParPe * Nr + fraisDossier);
      echeanceMoyenne  = round2(intParPe + assParPe);
    } else {
      // PARTIEL ou AUCUN : CRD = montant constant, aucune capitalisation.
      const intParPe   = montant * tP;
      const assParPe   = montant * tA;
      coutTotalCredit  = round2(intParPe * N + assParPe * N + fraisDossier);
      echeanceMoyenne  = round2(intParPe + assParPe);
    }
  } else if (modaliteRemboursement === "CAPITAL_CONSTANT") {
    // Amortissement constant sur capitalApresDiffere (= montant pour PARTIEL/AUCUN).
    const pk              = Nr > 0 ? capitalApresDiffere / Nr : 0;
    const sumCRD_rembours = Nr > 0 ? Nr * capitalApresDiffere - pk * Nr * (Nr - 1) / 2 : 0;
    // Intérêts pendant le différé
    const intDiffere = typeDiffere === "PARTIEL"
      ? round2(tP * Nd * montant)              // PARTIEL : payés sur le montant initial
      : round2(capitalApresDiffere - montant); // TOTAL   : capitalisés (= différence de capital)
    const totalInt = round2(intDiffere + tP * sumCRD_rembours);
    // Assurance : pas de versement pendant le différé TOTAL
    const sumCRD_differeAssur = typeDiffere !== "TOTAL" ? Nd * montant : 0;
    const totalAssur = modeAssurance === "CAPITAL_INITIAL"
      ? round2(tA * montant * (typeDiffere === "TOTAL" ? Nr : N))
      : round2(tA * (sumCRD_differeAssur + sumCRD_rembours));
    coutTotalCredit = round2(totalInt + totalAssur + fraisDossier);
    // Échéance moyenne = (première + dernière) / 2
    const assFirst = modeAssurance === "CAPITAL_INITIAL" ? montant * tA : capitalApresDiffere * tA;
    const assLast  = modeAssurance === "CAPITAL_INITIAL" ? montant * tA : pk * tA;
    echeanceMoyenne = round2(((pk + capitalApresDiffere * tP + assFirst) + (pk + pk * tP + assLast)) / 2);
  } else {
    // ECHEANCE_CONSTANTE + AMORTISSABLE — annuité calculée sur capitalApresDiffere.
    let echeanceCapital = 0;
    if (Nr > 0) {
      echeanceCapital = tP === 0
        ? capitalApresDiffere / Nr
        : (capitalApresDiffere * tP) / (1 - Math.pow(1 + tP, -Nr));
    }
    // Intérêts pendant le différé
    const intDiffere = typeDiffere === "PARTIEL"
      ? round2(tP * montant * Nd)              // PARTIEL : payés sur le montant initial
      : round2(capitalApresDiffere - montant); // TOTAL   : capitalisés
    const totalInt = round2(intDiffere + echeanceCapital * Nr - capitalApresDiffere);
    // Assurance CAPITAL_RESTANT : sum(CRD_k) = totalIntérêts / tP
    // (car intérêts_k = CRD_k × tP → sum(CRD_k) = sum(intérêts_k) / tP)
    const interetRemboursement = echeanceCapital * Nr - capitalApresDiffere;
    const sumCRDRemboursement  = tP > 0 && Nr > 0 ? interetRemboursement / tP : Nr * capitalApresDiffere / 2;
    const crdDiffereAssur = typeDiffere !== "TOTAL" ? Nd * montant : 0;
    const totalAssur = modeAssurance === "CAPITAL_INITIAL"
      ? round2(tA * montant * (typeDiffere === "TOTAL" ? Nr : N))
      : round2(tA * (crdDiffereAssur + sumCRDRemboursement));
    coutTotalCredit = round2(totalInt + totalAssur + fraisDossier);
    const assurMoyenne = modeAssurance === "CAPITAL_INITIAL"
      ? montant * tA
      : Nr > 0 ? tA * capitalApresDiffere / 2 : 0;
    echeanceMoyenne = round2(echeanceCapital + assurMoyenne);
  }

  // Premier remboursement = 1 période après la fin du différé (i = Nd + 1 dans l'échéancier).
  const premierRemboursement = addMois(dateDeblocageEffective, (Nd + 1) * moisParPeriode);

  return {
    echeanceMoyenne,
    coutTotalCredit,
    premierRembourement: premierRemboursement,
    nbPeriodesTotal:  N,
    nbPeriodesDiffere: Nd,
  };
}

