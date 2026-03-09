import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { n, type YearKey, type YearAcc } from "@/lib/finance/utils";

export type YAcc = YearAcc;

// ── Intérêts d'emprunts (depuis l'échéancier) ────────────────────────────────

/**
 * Agrège intérêts + assurances de tous les emprunts actifs par exercice fiscal.
 *
 * @param toExerciceKey – mappeur date → "y1"|"y2"|"y3"|null (de makeExerciceHelpers)
 */
export function calcInteretsEmprunts(
  data: Pick<ScenarioFinData, "emprunts">,
  toExerciceKey: (date: Date | string) => YearKey | null,
): YAcc {
  const acc: YAcc = { y1: 0, y2: 0, y3: 0 };
  for (const emprunt of data.emprunts) {
    for (const ligne of emprunt.lignesEcheancier) {
      const dateStr =
        ligne.dateEcheance instanceof Date
          ? ligne.dateEcheance.toISOString()
          : String(ligne.dateEcheance);
      const yk = toExerciceKey(dateStr);
      if (yk) {
        acc[yk] += n(ligne.interesMois) + n(ligne.assuranceMois);
      }
    }
  }
  return acc;
}

// ── Capital remboursé (depuis l'échéancier) ───────────────────────────────────

/**
 * Agrège le capital amorti (remboursement principal) par exercice fiscal.
 * Utile pour le tableau de financement et le bilan.
 */
export function calcCapitalRembourse(
  data: Pick<ScenarioFinData, "emprunts">,
  toExerciceKey: (date: Date | string) => YearKey | null,
): YAcc {
  const acc: YAcc = { y1: 0, y2: 0, y3: 0 };
  for (const emprunt of data.emprunts) {
    for (const ligne of emprunt.lignesEcheancier) {
      const dateStr =
        ligne.dateEcheance instanceof Date
          ? ligne.dateEcheance.toISOString()
          : String(ligne.dateEcheance);
      const yk = toExerciceKey(dateStr);
      if (yk) {
        acc[yk] += n(ligne.capitalRembourse);
      }
    }
  }
  return acc;
}

// ── Frais de dossier (depuis l'échéancier) ───────────────────────────────────

/**
 * Agrège les frais de dossier (lignes de type FRAIS_DOSSIER) par exercice fiscal.
 */
export function calcFraisDossier(
  data: Pick<ScenarioFinData, "emprunts">,
  toExerciceKey: (date: Date | string) => YearKey | null,
): YAcc {
  const acc: YAcc = { y1: 0, y2: 0, y3: 0 };
  for (const emprunt of data.emprunts) {
    for (const ligne of emprunt.lignesEcheancier) {
      // moisNumero === 0 identifie la ligne de frais de dossier (unique dans l'échéancier)
      if (ligne.moisNumero !== 0) continue;
      const dateStr =
        ligne.dateEcheance instanceof Date
          ? ligne.dateEcheance.toISOString()
          : String(ligne.dateEcheance);
      const yk = toExerciceKey(dateStr);
      if (yk) {
        acc[yk] += n(ligne.mensualiteTotale);
      }
    }
  }
  return acc;
}
