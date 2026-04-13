/**
 * Type du résultat global du moteur de calcul financier.
 * Source unique de vérité — importé par pipeline/build.ts, calculs/index.ts et tous les consommateurs.
 */
import type { YearAcc, MonthlyAcc } from "./series";
import type { MonthlyCalcResult } from "@/lib/finance/calculs/monthly";
import type { TVACalcResult } from "@/lib/finance/calculs/calc-tva";
export type { TVACalcResult };

export interface FinCalcResult {
  // ── Labels ────────────────────────────────────────────────────────────────
  anneeDebut: number;
  moisDebut: number;
  /** Durée de projection configurée (1, 2 ou 3 ans). Les consommateurs utilisent ce champ pour masquer les colonnes y2/y3. */
  dureeProjection: 1 | 2 | 3;
  yearLabels: Record<"y1" | "y2" | "y3", string>;

  // ── Helpers date ──────────────────────────────────────────────────────────
  toExerciceKey: (date: Date | string) => "y1" | "y2" | "y3" | null;
  exBorne1: Date;
  exBorne2: Date;
  exBorne3: Date;
  pFin: number;
  pDeb: number;

  // ── CA & stocks ───────────────────────────────────────────────────────────
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

  // ── Charges & SIG ─────────────────────────────────────────────────────────
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
  valeurAjoutee: YearAcc;
  ebe: YearAcc;
  /** Séries mensuelles de l'EBE par exercice (avec saisonnalité réelle). */
  ebeSeries: MonthlyAcc;

  // ── Amortissements & provisions ───────────────────────────────────────────
  dotationsAmort: YearAcc;
  dotationsProvisions: YearAcc;
  reprises: YearAcc;

  // ── Autres produits / charges d'exploitation ──────────────────────────────
  commissionsTotal: YearAcc;
  prodImmo: YearAcc;
  transferts: YearAcc;
  autresProdGestion: YearAcc;
  autresChargesGestion: YearAcc;
  totalProduitsExpl: YearAcc;

  // ── Résultats ─────────────────────────────────────────────────────────────
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

  // ── CAF ───────────────────────────────────────────────────────────────────
  caf: YearAcc;
  capitalRembourseForCAF: YearAcc;
  autofinancement: YearAcc;

  // ── Drill-down CAF ────────────────────────────────────────────────────────
  dotationsParImmoAcc: { immo: { id: string; libelle: string; nature: string }; values: YearAcc }[];
  capitalRembourseParEmprunt: { emprunt: { id: string; libelle: string }; values: YearAcc }[];
  // ── TVA (source unique de vérité) ─────────────────────────────────────────
  /**
   * Résultat de `calcTVA` — toutes les séries TVA calculées une seule fois.
   * Consommé par `calcBfr`, `calcDecaissements`, `buildTVARows`.
   */
  tva: TVACalcResult;

  // ── Séries mensuelles brutes (passe 2 — IS réel) ──────────────────────────────
  /**
   * Résultat complet du moteur mensuel (passe 2, IS réel inclus).
   * Utilisé par `useBudgetData` pour éviter de rappeler `buildMonthlyCalc`.
   */
  monthlyCalc: MonthlyCalcResult;}
