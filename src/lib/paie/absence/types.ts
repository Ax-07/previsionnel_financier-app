/**
 * Types du moteur d'absence avancé (Lot 5).
 *
 * Couvre : maladie ordinaire, AT/MP, maternité, paternité, maintien légal,
 * maintien conventionnel, IJSS subrogées, compléments employeur,
 * régularisations et absences longues.
 *
 * Référence spec : Specifications Hors Perimetre Paie 2026.md §9
 */

// ─────────────────────────────────────────────────────────────────────────────
// Catégories d'absence
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Type d'événement d'absence.
 *
 * Détermine :
 * - le délai de carence SS (0 ou 3 jours) ;
 * - le délai de carence employeur (0 ou 7 jours) ;
 * - le taux d'indemnisation SS (50 %, 60/80 %, 100 %) ;
 * - les règles de maintien légal applicables.
 */
export type AbsenceType =
  | "maladie_ordinaire"      // Arrêt maladie standard (3 j carence SS)
  | "maladie_longue_duree"   // ALD / maladie de longue durée
  | "at_mp"                  // Accident du travail / Maladie professionnelle (0 j carence)
  | "maternite"              // Congé maternité légal
  | "paternite_accueil"      // Congé paternité et d'accueil de l'enfant
  | "adoption"               // Congé adoption
  | "conge_pathologique";    // Congé pathologique (avant ou après maternité)

// ─────────────────────────────────────────────────────────────────────────────
// Événement d'absence
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Événement d'absence saisi dans le formulaire de simulation.
 */
export interface AbsenceEvent {
  /** Type d'absence */
  type: AbsenceType;

  /** Nombre total de jours civils d'absence sur la période */
  joursCivils: number;

  /**
   * Nombre de jours ouvrés d'absence (si connu).
   * Si absent, estimé depuis joursCivils × 5/7.
   */
  joursOuvres?: number;

  /**
   * Ancienneté salarié en mois complets révolus à la date de début de l'arrêt.
   * Utilisé pour les seuils de maintien légal (≥ 12 mois = droit au maintien).
   */
  ancienneteEnMois: number;

  /**
   * Si true, l'employeur perçoit les IJSS à la place du salarié (subrogation).
   * → Les IJ sont déduites du complément versé par l'employeur ;
   *   le salarié reçoit directement son maintien net sans flux SS séparé.
   * Si false (non subrogé), le salarié reçoit les IJ directement de la CPAM
   * et l'employeur ne verse que le brut maintenu réduit.
   */
  subrogation: boolean;

  /**
   * Salaire journalier de référence brut pour estimer les IJSS.
   * Si absent, calculé depuis brutMensuel / 30.42 (approximation).
   */
  salairejournalierRef?: number;

  /**
   * Montant des IJSS déjà perçues / déclarées ce mois (pour régularisation).
   * Utilisé par AbsenceRegularizationEngine lors d'une réception tardive.
   */
  ijssDejaPrecues?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Résultat du calcul d'absence
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Résultat d'un calcul d'absence complet (Lot 5).
 *
 * Toutes les valeurs monétaires sont en euros, positives sauf `deductionBrutAbsence`.
 */
export interface ResultatAbsence {
  // ── Durées ──────────────────────────────────────────────────────────────────
  /** Jours civils totaux de l'absence */
  joursCivils: number;
  /** Jours couverts par la carence SS (pas d'IJ versées) */
  joursCarenceSS: number;
  /** Jours effectivement indemnisés par la SS */
  joursAvecIjss: number;
  /** Jours maintenus par l'employeur (légal) */
  joursMaintenus: number;

  // ── Déduction brut ──────────────────────────────────────────────────────────
  /**
   * Retenue sur le brut pour les jours d'absence non rémunérés.
   * Valeur négative (déduction du brut théorique).
   */
  deductionBrutAbsence: number;

  // ── IJSS ────────────────────────────────────────────────────────────────────
  /** Estimation IJ brute SS journalière */
  ijssBruteJournaliere: number;
  /** Estimation IJ brute totale sur la période */
  ijssBruteTotal: number;
  /** CSG + CRDS prélevés sur les IJ */
  ijssCsgCrds: number;
  /** IJ nette totale estimée (reçue par salarié ou par employeur si subrogation) */
  ijssNetteTotal: number;

  // ── Maintien employeur ──────────────────────────────────────────────────────
  /** Brut maintenu légalement par l'employeur (avant déduction IJ subrogées) */
  maintienBrutLegal: number;
  /** Brut maintenu supplémentaire selon convention collective */
  maintienBrutConventionnel: number;
  /**
   * Complément net employeur = maintien net total - IJ nettes (si subrogation).
   * = 0 si IJSS couvrent entièrement le maintien.
   */
  complementEmployeurNet: number;

  // ── Net final ───────────────────────────────────────────────────────────────
  /**
   * Brut soumis à cotisations après intégration de l'absence
   * (brutTheorique + deductionBrutAbsence + maintienBrut).
   */
  brutSoumisApresAbsence: number;

  // ── Diagnostic ──────────────────────────────────────────────────────────────
  /** Indique si le salarié a droit au maintien légal (ancienneté ≥ 12 mois) */
  droitAuMaintienLegal: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Politique de maintien (légal et conventionnel)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Politique de maintien pour un type d'absence donné.
 * Générée par LegalMaintenanceEngine ou ConventionalMaintenanceEngine.
 */
export interface PolitiqueMaintien {
  /** Délai de carence SS en jours civils */
  joursCarenceSS: number;
  /** Délai de carence employeur en jours civils (0 si convention favorable) */
  joursCarenceEmployeur: number;
  /** Durée de maintien à taux plein (jours) */
  dureeTauxPleinJours: number;
  /** Durée de maintien à taux partiel (jours) */
  dureeTauxPartielJours: number;
  /** Taux de maintien à taux plein (ex. 0.90 pour 90 %) */
  tauxMaintienPlein: number;
  /** Taux de maintien à taux partiel (ex. 0.6667 pour 66,67 %) */
  tauxMaintienPartiel: number;
  /** Indemnisation SS retirée du maintien ? (true = sous déduction IJ) */
  sousDedictionIjss: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Entrée du moteur principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Entrée complète pour LeaveAndBenefitsEngine.
 */
export interface LeaveCalculInput {
  /** Événement d'absence décrit par l'utilisateur */
  absence: AbsenceEvent;
  /** Salaire brut mensuel de base (sans l'absence) */
  brutMensuelTheorique: number;
  /** Convention collective active (ex. "1486" Syntec) — pour surcharges */
  conventionCode?: string;
  /** Taux PAS pour recalcul du net */
  tauxPAS?: number;
  /** Plafond annuel Sécurité Sociale 2026 */
  passAnnuel: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Régularisation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paramètres d'une régularisation sur mois ultérieur.
 * Utilisé quand la CPAM verse les IJ avec retard.
 */
export interface RegularisationAbsence {
  /** Mois de référence de l'absence initiale (ISO "YYYY-MM") */
  moisAbsence: string;
  /** Mois de la régularisation (ISO "YYYY-MM") */
  moisRegularisation: string;
  /** IJ recues ce mois (versement tardif) */
  ijssRecuesMontant: number;
  /** L'employeur avait-il subrogé ? */
  subrogationInitiale: boolean;
  /** Maintien net déjà versé par l'employeur en attente de régularisation */
  maintienAvanceMontant: number;
}

/**
 * Résultat d'une régularisation :
 * - rappel positif si l'employeur avait sous-versé ;
 * - déduction négative si l'employeur avait trop versé (récupération).
 */
export interface ResultatRegularisation {
  moisRegularisation: string;
  /** Montant de la régularisation (positif = rappel au salarié, négatif = déduction) */
  montantRegularisation: number;
  /** Raison de la régularisation */
  motif: "ijss_tardives" | "regularisation_trop_verse" | "neutralisation";
}
