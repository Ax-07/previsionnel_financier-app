/**
 * Types du résultat global du moteur de calcul financier.
 *
 * `FinCalcResult` est décomposé en interfaces composables pour typer finement les consommateurs.
 * Chaque interface représente un domaine métier indépendant.
 *
 * Usage recommandé :
 * - Passer `FinCalcResult` aux orchestrateurs.
 * - Passer une interface spécialisée (ex: `FinCalcActivite`) aux fonctions ne consommant qu'un sous-ensemble.
 */
import type { YearAcc, YearAcc4, MonthlyAcc } from "./series";
import type { MonthlyCalcResult } from "@/lib/finance/calculs/monthly";
import type { TVACalcResult } from "@/lib/finance/calculs/calc-tva";
export type { TVACalcResult };

// ── Interfaces composables ─────────────────────────────────────────────────────

/** Méta-données temporelles et helpers de navigation dans les exercices. */
export interface FinCalcMeta {
  anneeDebut: number;
  moisDebut: number;
  /** Durée de projection configurée (1, 2 ou 3 ans). Les consommateurs utilisent ce champ pour masquer les colonnes y2/y3. */
  dureeProjection: 1 | 2 | 3;
  yearLabels: Record<"y1" | "y2" | "y3", string>;
  toExerciceKey: (date: Date | string) => "y1" | "y2" | "y3" | null;
  exBorne1: Date;
  exBorne2: Date;
  exBorne3: Date;
  pFin: number;
  pDeb: number;
}

/** CA HT, achats effectués et stocks (niveaux annuels + séries mensuelles). */
export interface FinCalcActivite {
  ca: YearAcc;
  /** Séries mensuelles du CA HT par exercice (issues du moteur mensuel). */
  caSeries: MonthlyAcc;
  achatsEffectues: YearAcc;
  /** Niveau de stock fin d'exercice (= dernier mois de la série cumulative RCA). */
  stockInitial: YearAcc;
  stockFinal: YearAcc;
  varStock: YearAcc;
  achatsConsommes: YearAcc;
  /**
   * Séries mensuelles des stocks finaux par exercice.
   * À utiliser pour les calculs de BFR/dettes qui nécessitent la variation du dernier mois.
   */
  stockFinalSeries: MonthlyAcc;
  stockInitialSeries: MonthlyAcc;
}

/** Charges d'exploitation : externes, impôts/taxes et personnel. */
export interface FinCalcCharges {
  chargesExternes: YearAcc;
  fournitures: YearAcc;
  services: YearAcc;
  subventions: YearAcc;
  impotsTaxes: YearAcc;
  chargesPersonnel: {
    salairesBruts: YearAcc;
    chargesPatronales: YearAcc;
    remuDirigeant: YearAcc;
    cotisationsTNSTotal: YearAcc;
    taxesSalairesTotal: YearAcc;
    total: YearAcc;
  };
}

/** SIG : VA, EBE, dotations, autres produits/charges, agrégats dérivés. */
export interface FinCalcSIG {
  valeurAjoutee: YearAcc;
  ebe: YearAcc;
  /** Séries mensuelles de l'EBE par exercice (avec saisonnalité réelle). */
  ebeSeries: MonthlyAcc;
  dotationsAmort: YearAcc;
  dotationsProvisions: YearAcc;
  reprises: YearAcc;
  commissionsTotal: YearAcc;
  prodImmo: YearAcc;
  transferts: YearAcc;
  autresProdGestion: YearAcc;
  autresChargesGestion: YearAcc;
  totalProduitsExpl: YearAcc;
  /** Marge sur production : ca − achatsConsommés */
  margeProd: YearAcc;
  /** Total des charges d'exploitation : totalProduitsExpl − resExpl */
  totalChargesExpl: YearAcc;
  /** Charges financières totales : intérêts + frais dossier + autres charges fin. */
  chargesFinTotal: YearAcc;
}

/** Résultats : exploitation, financier, courant, exceptionnel, IS et net. */
export interface FinCalcResultats {
  resExpl: YearAcc;
  interetsEmprunts: YearAcc;
  fraisDossierEmprunts: YearAcc;
  capitalRembourse: YearAcc;
  produitsFinanciers: YearAcc;
  autresChargesFinancieres: YearAcc;
  resFin: YearAcc;
  resCourant: YearAcc;
  resExcep: YearAcc;
  ajustementNet: YearAcc;
  isParAnnee: YearAcc;
  resNet: YearAcc;
  /** Séries mensuelles du résultat net par exercice (IS réel, passe 2). */
  resNetSeries: MonthlyAcc;
}

/** Variation du BFR (besoin en fonds de roulement). */
export interface FinCalcBFR {
  /**
   * Variation du BFR par exercice (y0 = BFR initial, y1-y3 = delta par rapport à la période précédente).
   * Source unique : calcBfr(). Consommé par buildPlanFinancementRows.
   */
  variationBFR: YearAcc4;
}

/** CAF, autofinancement et drill-down par immobilisation / emprunt. */
export interface FinCalcCAF {
  caf: YearAcc;
  capitalRembourseForCAF: YearAcc;
  autofinancement: YearAcc;
  dotationsParImmoAcc: { immo: { id: string; libelle: string; nature: string }; values: YearAcc }[];
  capitalRembourseParEmprunt: { emprunt: { id: string; libelle: string }; values: YearAcc }[];
}

/** TVA calculée (source unique de vérité). */
export interface FinCalcTVA {
  /**
   * Résultat de `calcTVA` — toutes les séries TVA calculées une seule fois.
   * Consommé par `calcBfr`, `calcDecaissements`, `buildTVARows`.
   */
  tva: TVACalcResult;
}

/** Séries mensuelles brutes issues du moteur mensuel (passe 2 — IS réel). */
export interface FinCalcMensuel {
  /**
   * Résultat complet du moteur mensuel (passe 2, IS réel inclus).
   * Utilisé par `useBudgetData` pour éviter de rappeler `buildMonthlyCalc`.
   */
  monthlyCalc: MonthlyCalcResult;
}

/** Données d'entrée filtrées par hypothèse active. */
export interface FinCalcFilteredData {
  /**
   * Données ScenarioFinData filtrées par l'hypothèse active.
   * À utiliser dans les builders de drill-down (CR, SIG, budget, etc.)
   * au lieu du `data` brut du store.
   */
  filteredData: import("@/lib/finance/fetch-scenario").ScenarioFinData;
}

/** Données d'entrée filtrées par hypothèse active. */
export interface FinCalcFilteredData {
  /**
   * Données ScenarioFinData filtrées par l'hypothèse active.
   * À utiliser dans les builders de drill-down (CR, SIG, budget, etc.)
   * au lieu du `data` brut du store.
   */
  filteredData: import("@/lib/finance/fetch-scenario").ScenarioFinData;
}

// ── Type agrégé ───────────────────────────────────────────────────────────────

/**
 * Type du résultat global du moteur de calcul financier.
 * Source unique de vérité — importé par pipeline/build.ts, calculs/index.ts et tous les consommateurs.
 *
 * Composé à partir des interfaces spécialisées :
 * `FinCalcMeta & FinCalcActivite & FinCalcCharges & FinCalcSIG & FinCalcResultats
 *  & FinCalcBFR & FinCalcCAF & FinCalcTVA & FinCalcMensuel`
 */
export interface FinCalcResult
  extends FinCalcMeta,
    FinCalcActivite,
    FinCalcCharges,
    FinCalcSIG,
    FinCalcResultats,
    FinCalcBFR,
    FinCalcCAF,
    FinCalcTVA,
    FinCalcMensuel,
    FinCalcFilteredData {}
