import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { n, sumBy, type YearAcc } from "@/lib/finance/utils";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Helpers internes
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type LigneRow = { annee: number; dotationAnnuelle: unknown };

type ImmoAmortInput = {
  modeAmortissement: string;
  montantHT: unknown;
  dureeAmortissement: unknown;
  dateAcquisition: unknown;
  lignesAmortissement: LigneRow[];
};

/**
 * Distribue les dotations d'amortissement d'une immobilisation vers les 3
 * exercices fiscaux, en respectant le mode réel (AUCUN / LINEAIRE / DEGRESSIF).
 *
 * - **AUCUN**    â†’ retourne zéro
 * - **LINEAIRE** â†’ taux mensuel constant `montantHT / (durée Ã— 12)` sur toute
 *                  la durée depuis la date d'acquisition
 * - **DEGRESSIF** â†’ distribue les `lignesAmortissement` stockées en base sur les
 *                   mois calendaires réels (début = mois d'acquisition, fin =
 *                   mois de fin réel), puis mappe vers y1/y2/y3 selon l'exercice
 *                   fiscal démarrant Ã  `moisDebut`
 *
 * @param immo       â€“ immobilisation avec ses lignesAmortissement
 * @param anneeDebut â€“ année civile de démarrage du prévisionnel
 * @param moisDebut  â€“ mois de démarrage de l'exercice fiscal (0 = jan)
 */
export function distribuerAmortParExercice(
  immo: ImmoAmortInput,
  anneeDebut: number,
  moisDebut: number,
): YearAcc {
  if (immo.modeAmortissement === "AUCUN") return { y1: 0, y2: 0, y3: 0 };

  const acc: YearAcc = { y1: 0, y2: 0, y3: 0 };
  const dur    = n(immo.dureeAmortissement);
  const montant = n(immo.montantHT);
  if (dur <= 0 || montant <= 0) return acc;

  const dAcq    = new Date(String(immo.dateAcquisition));
  const acqYear = dAcq.getFullYear();
  const acqMois = dAcq.getMonth(); // 0-based

  /** Mappe un mois absolu (anneeÃ—12+mois) vers la clé y1/y2/y3. */
  function addToExercice(absMonth: number, dotMois: number) {
    for (let e = 0; e < 3; e++) {
      const exStart = (anneeDebut + e) * 12 + moisDebut;
      if (absMonth >= exStart && absMonth < exStart + 12) {
        (acc as Record<string, number>)[["y1", "y2", "y3"][e]!]! += dotMois;
        break;
      }
    }
  }

  if (immo.modeAmortissement !== "DEGRESSIF") {
    // â”€â”€ LINEAIRE : taux mensuel constant â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const acqAbsMonth = acqYear * 12 + acqMois;
    const totalMonths = Math.round(dur * 12);
    const dotMois     = montant / totalMonths;
    for (let k = 0; k < totalMonths; k++) {
      addToExercice(acqAbsMonth + k, dotMois);
    }
  } else {
    // â”€â”€ DEGRESSIF : distribuer depuis lignesAmortissement â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Chaque ligne couvre une année civile :
    //   â€¢ ligne.annee === acqYear         â†’ mois acqMois Ã  11
    //   â€¢ ligne.annee >= acqYear+ceil(dur) â†’ "solde résiduel" jan Ã  acqMois-1
    //   â€¢ autres                           â†’ jan (0) Ã  déc (11)
    for (const ligne of immo.lignesAmortissement) {
      const D = n(ligne.dotationAnnuelle);
      if (D === 0) continue;

      let moisCivilDebut: number;
      let nbMois: number;

      if (ligne.annee === acqYear) {
        moisCivilDebut = acqMois;
        nbMois         = 12 - acqMois;
      } else if (ligne.annee >= acqYear + Math.ceil(dur)) {
        moisCivilDebut = 0;
        nbMois         = acqMois; // 0 si acq en janvier â†’ filtré par D=0
      } else {
        moisCivilDebut = 0;
        nbMois         = 12;
      }

      if (nbMois <= 0) continue;
      const dotMois = D / nbMois;
      for (let m = moisCivilDebut; m < moisCivilDebut + nbMois; m++) {
        addToExercice(ligne.annee * 12 + m, dotMois);
      }
    }
  }

  return acc;
}

/**
 * Calcule les dotations annuelles aux amortissements pour les 3 exercices fiscaux.
 *
 * Lorsque l'exercice fiscal ne démarre pas en janvier, les dotations d'une année
 * civile se répartissent entre deux exercices consécutifs via le prorata `pFin`/`pDeb`.
 *
 * @param anneeDebut â€“ `dateDemarrage.getFullYear()` (année civile N)
 * @param pFin â€“ fraction de l'année civile N+k qui clôt l'exercice k-1 (= moisDebut/12)
 * @param pDeb â€“ fraction qui ouvre l'exercice k (= 1 - pFin)
 *
 * Quand `pFin = 0` (démarrage en janvier) le comportement est identique Ã  une
 * affectation simple année civile â†’ exercice fiscal.
 */

// â”€â”€ Dotations aux provisions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcDotationsProvisions(
  data: Pick<ScenarioFinData, "provisions">,
): YearAcc {
  const rows = data.provisions.filter((p) => p.actif !== false);
  return {
    y1: sumBy(rows, (r) => n(r.montantN)),
    y2: sumBy(rows, (r) => n(r.montantN1)),
    y3: sumBy(rows, (r) => n(r.montantN2)),
  };
}

// â”€â”€ Reprises sur provisions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcReprises(
  data: Pick<ScenarioFinData, "reprisesProduits">,
): YearAcc {
  const rows = data.reprisesProduits.filter((r) => r.actif !== false);
  return {
    y1: sumBy(rows, (r) => n(r.montantN)),
    y2: sumBy(rows, (r) => n(r.montantN1)),
    y3: sumBy(rows, (r) => n(r.montantN2)),
  };
}
