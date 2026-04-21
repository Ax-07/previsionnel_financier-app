import type { BulletinMensuel } from "@/lib/paie/contrat/types";
import type { DetailMensuelExercice } from "@/lib/schemas/personnel";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Résultat de la conversion bulletins → détail mensuel par exercice */
export interface DetailFromContratResult {
  detailMensuelN?: DetailMensuelExercice;
  detailMensuelN1?: DetailMensuelExercice;
  detailMensuelN2?: DetailMensuelExercice;
  /**
   * Total brut de l'exercice N.
   * Calculé par Σ(effectif[i] × brutIndividuel[i]) — jamais par approximation.
   */
  montantN: number;
  /** Total brut de l'exercice N+1 */
  montantN1: number;
  /** Total brut de l'exercice N+2 */
  montantN2: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fonction pure
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Transforme les bulletins mensuels d'une simulation de période de contrat
 * en structures `DetailMensuelExercice` pour les exercices N, N+1, N+2.
 *
 * ### Règle de mapping
 * La clé temporelle `bulletin.mois` ("YYYY-MM") détermine :
 * - l'exercice cible (N / N+1 / N+2) selon `dateDemarrage.getFullYear()`
 * - l'index mensuel (0-based : janvier = 0, décembre = 11)
 *
 * `brutIndividuel[i] = bulletin.simulation.brutSoumis` (brut réel, déjà proratisé
 * par le moteur de paie pour les mois d'entrée/sortie partiels).
 *
 * `effectif[i] = 1` — un salarié par ligne.
 *
 * Les `montantN/N1/N2` sont la somme exacte des bruts réels de l'exercice.
 * La cohérence avec le tableau mensuel est garantie car :
 * `montantN = Σ(effectif[i] × brutIndividuel[i])` par construction.
 *
 * @param bulletins - Bulletins mensuels issus de `SimulationContratResultat`
 * @param dateDemarrage - Date de démarrage du dossier (détermine quelle année = N)
 */
export function buildDetailFromContrat(
  bulletins: BulletinMensuel[],
  dateDemarrage: Date,
): DetailFromContratResult {
  const anneeN = dateDemarrage.getFullYear();

  const makeEmpty = (): DetailMensuelExercice => ({
    effectif: Array<number>(12).fill(0),
    brutIndividuel: Array<number>(12).fill(0),
  });

  const detailN = makeEmpty();
  const detailN1 = makeEmpty();
  const detailN2 = makeEmpty();

  let hasN = false;
  let hasN1 = false;
  let hasN2 = false;

  for (const bulletin of bulletins) {
    // Parse "YYYY-MM" → year + monthIndex (0-based)
    const [yearStr, monthStr] = bulletin.mois.split("-");
    const year = parseInt(yearStr, 10);
    const monthIdx = parseInt(monthStr, 10) - 1;

    // brutSoumis est déjà proratisé par le moteur pour les mois partiels
    // Arrondi à 2 décimales pour éviter les résidus flottants
    const brut = Math.round(bulletin.simulation.brutSoumis * 100) / 100;

    if (year === anneeN) {
      detailN.effectif[monthIdx] = 1;
      detailN.brutIndividuel[monthIdx] = brut;
      hasN = true;
    } else if (year === anneeN + 1) {
      detailN1.effectif[monthIdx] = 1;
      detailN1.brutIndividuel[monthIdx] = brut;
      hasN1 = true;
    } else if (year === anneeN + 2) {
      detailN2.effectif[monthIdx] = 1;
      detailN2.brutIndividuel[monthIdx] = brut;
      hasN2 = true;
    }
    // Les bulletins hors N/N+1/N+2 sont ignorés (période trop éloignée)
  }

  const sumDetail = (d: DetailMensuelExercice): number =>
    Math.round(
      d.effectif.reduce((acc, eff, i) => acc + eff * d.brutIndividuel[i], 0) * 100,
    ) / 100;

  return {
    detailMensuelN: hasN ? detailN : undefined,
    detailMensuelN1: hasN1 ? detailN1 : undefined,
    detailMensuelN2: hasN2 ? detailN2 : undefined,
    montantN: hasN ? sumDetail(detailN) : 0,
    montantN1: hasN1 ? sumDetail(detailN1) : 0,
    montantN2: hasN2 ? sumDetail(detailN2) : 0,
  };
}
