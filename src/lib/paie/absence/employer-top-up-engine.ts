/**
 * Moteur de complément employeur (Lot 5).
 *
 * Le complément employeur répond à la question :
 *   "Combien l'employeur doit-il verser EN PLUS des IJ pour atteindre
 *    le montant de maintien visé (légal ou conventionnel) ?"
 *
 * En mode subrogé :
 *   complementNet = maintienNetCible - ijssNetteEstimee
 *   (si IJ couvrent entièrement le maintien → complement = 0)
 *
 * En mode non subrogé :
 *   L'IJ est versée directement par la CPAM au salarié.
 *   L'employeur verse seulement le brut maintenu réduit, sans déduction des IJ.
 *
 * Référence spec : §9.3 — « Complément employeur »
 */

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paramètres du calcul de complément employeur.
 */
export interface EmployerTopUpInput {
  /** Brut maintenu total (légal + conventionnel) */
  maintienBrutTotal: number;
  /** Taux moyen approximatif de cotisations salariales (pour estimer le net maintenu) */
  tauxCotisationsSalarie: number;
  /** IJ nettes estimées sur la période */
  ijssNetteTotal: number;
  /** Mode subrogation actif ? */
  subrogation: boolean;
  /** Taux PAS appliqué sur le net imposable */
  tauxPAS?: number;
}

/**
 * Résultat du calcul de complément employeur.
 */
export interface EmployerTopUpResult {
  /** Brut maintenu (avant cotisations) */
  maintienBrutTotal: number;
  /**
   * Net maintenu estimé (brut maintenu - cotisations salariales estimées - PAS).
   * Approximation : utilisé pour calculer le complément en mode subrogé.
   */
  netMaintenuEstime: number;
  /**
   * Complément net versé par l'employeur :
   *   - subrogé : montant versé en plus des IJ (pour atteindre le net maintenu)
   *   - non subrogé : le net de l'employeur = net maintenu (IJ versées séparément)
   */
  complementNet: number;
  /**
   * IJ subrogées déduites du paiement employeur (= 0 si non subrogé).
   */
  ijssDeduites: number;
}

/**
 * Calcule le complément employeur pour un maintien donné.
 *
 * @param input  Paramètres du calcul
 * @returns      Résultat détaillé
 */
export function calculerComplementEmployeur(
  input: EmployerTopUpInput,
): EmployerTopUpResult {
  const {
    maintienBrutTotal,
    tauxCotisationsSalarie,
    ijssNetteTotal,
    subrogation,
    tauxPAS = 0,
  } = input;

  // Net maintenu = brut - cotisations salariales approximatives - PAS
  const cotisationsSalarie = maintienBrutTotal * tauxCotisationsSalarie;
  const brutApresRetenues = maintienBrutTotal - cotisationsSalarie;
  const netMaintenuEstime = brutApresRetenues * (1 - tauxPAS);

  if (!subrogation) {
    // Non subrogé : l'employeur verse le brut maintenu, le salarié reçoit
    // séparément les IJ de la CPAM. Pas de déduction IJ côté employeur.
    return {
      maintienBrutTotal,
      netMaintenuEstime,
      complementNet: netMaintenuEstime,
      ijssDeduites: 0,
    };
  }

  // Subrogé : l'employeur reçoit les IJ et les verse au salarié avec son salaire.
  // Il ne verse donc QUE la différence (complément).
  const complementNet = Math.max(0, netMaintenuEstime - ijssNetteTotal);

  return {
    maintienBrutTotal,
    netMaintenuEstime,
    complementNet,
    ijssDeduites: Math.min(ijssNetteTotal, netMaintenuEstime),
  };
}
