import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { n, sumBy, type YearAcc } from "@/lib/finance/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internes
// ─────────────────────────────────────────────────────────────────────────────

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
 * - **AUCUN**    → retourne zéro
 * - **LINEAIRE** → taux mensuel constant `montantHT / (durée × 12)` sur toute
 *                  la durée depuis la date d'acquisition
 * - **DEGRESSIF** → distribue les `lignesAmortissement` stockées en base sur les
 *                   mois calendaires réels (début = mois d'acquisition, fin =
 *                   mois de fin réel), puis mappe vers y1/y2/y3 selon l'exercice
 *                   fiscal démarrant à `moisDebut`
 *
 * @param immo       – immobilisation avec ses lignesAmortissement
 * @param anneeDebut – année civile de démarrage du prévisionnel
 * @param moisDebut  – mois de démarrage de l'exercice fiscal (0 = jan)
 */
export function distribuerAmortParExercice(
  immo: ImmoAmortInput,
  anneeDebut: number,
  moisDebut: number,
  nMoisCtx?: { y1: number; y2: number; y3: number },
): YearAcc {
  const _nMois = nMoisCtx ?? { y1: 12, y2: 12, y3: 12 };
  if (immo.modeAmortissement === "AUCUN") return { y1: 0, y2: 0, y3: 0 };

  const acc: YearAcc = { y1: 0, y2: 0, y3: 0 };
  const dur = n(immo.dureeAmortissement);
  const montant = n(immo.montantHT);
  if (dur <= 0 || montant <= 0) return acc;

  const dAcq = new Date(String(immo.dateAcquisition));
  const acqYear = dAcq.getFullYear();
  const acqMois = dAcq.getMonth(); // 0-based

  /** Mappe un mois absolu (annee×12+mois) vers la clé y1/y2/y3. */
  function addToExercice(absMonth: number, dotMois: number) {
    const ex1S = anneeDebut * 12 + moisDebut;
    const ex2S = ex1S + _nMois.y1;
    const ex3S = ex2S + _nMois.y2;
    const bounds: [number, number, string][] = [
      [ex1S, ex2S, "y1"],
      [ex2S, ex3S, "y2"],
      [ex3S, ex3S + _nMois.y3, "y3"],
    ];
    for (const [start, end, key] of bounds) {
      if (absMonth >= start && absMonth < end) {
        (acc as Record<string, number>)[key]! += dotMois;
        break;
      }
    }
  }

  if (immo.modeAmortissement !== "DEGRESSIF") {
    // ── LINEAIRE : taux mensuel constant ─────────────────────────────────────
    const acqAbsMonth = acqYear * 12 + acqMois;
    const totalMonths = Math.round(dur * 12);
    const dotMois = montant / totalMonths;

    for (let k = 0; k < totalMonths; k++) {
      addToExercice(acqAbsMonth + k, dotMois);
    }
  } else {
    // ── DEGRESSIF : distribuer depuis lignesAmortissement ────────────────────
    // Chaque ligne couvre une année civile :
    //   • ligne.annee === acqYear          → mois acqMois à 11
    //   • ligne.annee >= acqYear+ceil(dur) → "solde résiduel" jan à acqMois-1
    //   • autres                           → jan (0) à déc (11)
    for (const ligne of immo.lignesAmortissement) {
      const D = n(ligne.dotationAnnuelle);
      if (D === 0) continue;

      let moisCivilDebut: number;
      let nbMois: number;

      if (ligne.annee === acqYear) {
        moisCivilDebut = acqMois;
        nbMois = 12 - acqMois;
      } else if (ligne.annee >= acqYear + Math.ceil(dur)) {
        moisCivilDebut = 0;
        nbMois = acqMois; // 0 si acq en janvier → filtré par D=0
      } else {
        moisCivilDebut = 0;
        nbMois = 12;
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
 * @param anneeDebut – `dateDemarrage.getFullYear()` (année civile N)
 * @param pFin – fraction de l'année civile N+k qui clôt l'exercice k-1 (= moisDebut/12)
 * @param pDeb – fraction qui ouvre l'exercice k (= 1 - pFin)
 *
 * Quand `pFin = 0` (démarrage en janvier) le comportement est identique à une
 * affectation simple année civile → exercice fiscal.
 */

// ── Dotations aux provisions ─────────────────────────────────────────────────

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

// ── Reprises sur provisions ──────────────────────────────────────────────────

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