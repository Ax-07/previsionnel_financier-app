/**
 * Moteur de régularisation d'absence (Lot 5).
 *
 * Traite les cas où les IJ SS sont versées avec retard (mois N+1 ou N+2) :
 *
 *   Scénario A — Subrogation + IJ tardives :
 *     L'employeur a avancé le maintien net en mois N.
 *     En mois M (régularisation), il reçoit les IJ et les ventile.
 *     → régularisation = 0 pour le salarié (déjà payé)
 *     → comptablement : remboursement des IJ perçues par l'employeur
 *
 *   Scénario B — Non subrogé + IJ tardives :
 *     L'employeur a versé le brut réduit en mois N.
 *     Le salarié reçoit ses IJ en mois M de la CPAM.
 *     → pas de régularisation employeur à faire (IJ directes CPAM → salarié)
 *
 *   Scénario C — Trop-versé :
 *     L'employeur avait maintenu au-delà de ce que la SS va rembourser
 *     (ex. : arrêt refusé partiellement par la CPAM).
 *     → régularisation négative sur le bulletin du mois de régularisation
 *
 * Référence spec : §9.3 — « Régularisations lors de réception tardive des IJ »
 */

import type { RegularisationAbsence, ResultatRegularisation } from "@/lib/paie/absence/types";

/**
 * Calcule la régularisation à appliquer sur le bulletin du mois M.
 *
 * @param params  Paramètres de la régularisation
 * @returns       Montant et motif de la régularisation
 */
export function calculerRegularisation(
  params: RegularisationAbsence,
): ResultatRegularisation {
  const {
    moisRegularisation,
    ijssRecuesMontant,
    subrogationInitiale,
    maintienAvanceMontant,
  } = params;

  // ── Scénario B : non subrogé, IJ versées directement par CPAM au salarié ──
  if (!subrogationInitiale) {
    // Pas de flux employeur à régulariser
    return {
      moisRegularisation,
      montantRegularisation: 0,
      motif: "neutralisation",
    };
  }

  // ── Scénario A/C : Subrogation ── ─────────────────────────────────────────
  // maintienAvance = ce que l'employeur a déjà versé au salarié
  // ijssRecues = ce que la SS rembourse à l'employeur ce mois
  const delta = maintienAvanceMontant - ijssRecuesMontant;

  if (Math.abs(delta) < 0.01) {
    // Écart négligeable (arrondi)
    return {
      moisRegularisation,
      montantRegularisation: 0,
      motif: "neutralisation",
    };
  }

  if (delta > 0) {
    // L'employeur avait trop avancé → les IJ ne couvrent pas tout l'avance
    // Ce cas est normal (le maintien > IJ = c'est le complément employeur)
    // → pas de régularisation à réclamer au salarié
    return {
      moisRegularisation,
      montantRegularisation: 0,
      motif: "neutralisation",
    };
  }

  // delta < 0 → les IJ reçues dépassent le maintien avancé (improbable mais possible
  // si l'arrêt a été requalifié ou si le SJR est plus élevé qu'estimé)
  // → régularisation positive pour le salarié
  return {
    moisRegularisation,
    montantRegularisation: Math.abs(delta),
    motif: "ijss_tardives",
  };
}

/**
 * Calcule la régularisation pour un trop-versé employeur.
 * Utilisé quand la CPAM refuse partiellement ou totalement l'arrêt.
 *
 * @param maintienVerseNet   Net maintenu déjà versé au salarié
 * @param ijssAccepteeNet    IJ finalement acceptées par la CPAM (nettes)
 * @param moisRegularisation ISO "YYYY-MM"
 */
export function calculerTropVerse(
  maintienVerseNet: number,
  ijssAccepteeNet: number,
  moisRegularisation: string,
): ResultatRegularisation {
  const tropVerse = maintienVerseNet - ijssAccepteeNet;

  if (tropVerse <= 0) {
    return { moisRegularisation, montantRegularisation: 0, motif: "neutralisation" };
  }

  return {
    moisRegularisation,
    montantRegularisation: -tropVerse, // négatif = déduction sur le bulletin
    motif: "regularisation_trop_verse",
  };
}
