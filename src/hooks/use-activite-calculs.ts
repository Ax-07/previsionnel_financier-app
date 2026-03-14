"use client";

import { useState } from "react";
import { useActiviteStore } from "@/stores/activite-store";

// ── Types exportés ────────────────────────────────────────────────────────────

export type ExerciceKey = "N" | "N1" | "N2";

export interface ExerciceCalendrierEntry {
  dateCloture: string;
  duree: number;
  annee: number;
}

export interface ExerciceConfig {
  startMonth: number; // 0–11 (0 = Jan)
  startYear: number;  // ex. 2026
  duree: number;      // nombre de mois réels (1–24)
}

export type ExercicesConfig = Record<ExerciceKey, ExerciceConfig>;

/** Résultat des calculs mensuels pour un exercice donné. */
export interface CalculsExercice {
  /** Libellés de colonnes (ex. « Mar. 26 ») */
  moisLabels: readonly string[];
  /** CA mensuel réparti selon la saisonnalité */
  productions: number[];
  /** Marges mensuelles */
  marges: number[];
  /** Consommations mensuelles (= productions − marges) */
  consommes: number[];
  /** Consommations ré-étalées selon la saisonnalité achats */
  consommesAchats: number[];
  /** Stock initial de chaque mois */
  stocksInitAch: number[];
  /** Stock final de chaque mois (formule RCA) */
  stocksFauxAch: number[];
  /** Couverture en jours de chaque mois */
  stocksJours: number[];
  /** Achats effectués chaque mois (conso + ΔStock + ponctuel) */
  achatsEff: number[];
  /** Saisonnalité CA active pour cet exercice */
  saisonnalite: number[];
  /** Saisonnalité achats active pour cet exercice */
  saisonnaliteAchats: number[];
  /** Achats ponctuels de stock saisis mois par mois */
  ponctuel: number[];
  /** Durée réelle de l'exercice en mois */
  duree: number;
  /** Montant CA annuel de l'exercice */
  montant: number;
  /** Total des consommations */
  totalConsommes: number;
  /** Somme de la saisonnalité CA (doit être ≈ 100) */
  totalSaison: number;
  /** Somme de la saisonnalité achats (doit être ≈ 100) */
  totalSaisonAchats: number;
}

export type CalculsParExercice = Record<ExerciceKey, CalculsExercice>;

export interface UseActiviteCalculsReturn {
  /** Données calculées pour les 3 exercices */
  calculs: CalculsParExercice;
  /** La saisonnalité CA est-elle synchronisée avec les achats ? */
  syncSaisonnalite: boolean;
  /** Modifier une valeur de saisonnalité CA */
  handleSaisonnalite: (ex: ExerciceKey, idx: number, val: string) => void;
  /** Modifier une valeur de saisonnalité achats */
  handleSaisonnaliteAchats: (ex: ExerciceKey, idx: number, val: string) => void;
  /** Modifier un achat ponctuel */
  handleAchatPonctuel: (ex: ExerciceKey, idx: number, val: string) => void;
  /** Importer la saisonnalité depuis une autre activité */
  handleImportFrom: (sourceIdx: number) => void;
  /** Basculer la synchronisation CA ↔ Achats */
  toggleSyncSaisonnalite: () => void;
  /** Reporter la saisonnalité CA d'un exercice vers un ou tous les autres */
  reporterSaisonnaliteCA: (source: ExerciceKey, targets: ExerciceKey[]) => void;
  /** Reporter la saisonnalité Achats d'un exercice vers un ou tous les autres */
  reporterSaisonnaliteAchats: (source: ExerciceKey, targets: ExerciceKey[]) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TOUS_MOIS = [
  "Jan.", "Fév.", "Mar.", "Avr.", "Mai",  "Juin",
  "Juil.", "Aoû.", "Sep.", "Oct.", "Nov.", "Déc.",
] as const;

/** Parse une string "YYYY-MM-DD" en Date locale (sans décalage UTC). */
function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Génère les étiquettes de mois « Mar. 26 » */
export function buildMoisLabels(startMonth: number, startYear: number, duree: number): readonly string[] {
  return Array.from({ length: duree }, (_, i) => {
    const moisIdx = (startMonth + i) % 12;
    const yearOffset = Math.floor((startMonth + i) / 12);
    const yy = String((startYear + yearOffset) % 100).padStart(2, "0");
    return `${TOUS_MOIS[moisIdx]} ${yy}`;
  });
}

/** Répartition équitable sur `duree` mois (dernier mois absorbe l'arrondi). */
export function buildEvenSaisonnalite(duree: number): number[] {
  const val = +(100 / duree).toFixed(2);
  const last = +(100 - val * (duree - 1)).toFixed(2);
  return [...Array(duree - 1).fill(val), last];
}

/** Calcule la config calendaire de chaque exercice depuis les données entreprise. */
export function buildExercicesConfig(
  dateDebutN: string | undefined,
  exercices: ExerciceCalendrierEntry[] | undefined,
): ExercicesConfig {
  const currentYear = new Date().getFullYear();
  const DEFAULT: ExerciceConfig = { startMonth: 0, startYear: currentYear, duree: 12 };
  if (!dateDebutN) return { N: DEFAULT, N1: DEFAULT, N2: DEFAULT };

  const [yearNStr, monthNStr] = dateDebutN.split("-");
  const startN = parseInt(monthNStr, 10) - 1;
  const startYearN = parseInt(yearNStr, 10);
  const dureeN = exercices?.[0]?.duree ?? 12;

  let startN1 = 0, startYearN1 = startYearN;
  const dureeN1 = exercices?.[1]?.duree ?? 12;
  if (exercices?.[0]?.dateCloture) {
    const clot = parseLocalDate(exercices[0].dateCloture);
    clot.setDate(clot.getDate() + 1);
    startN1 = clot.getMonth();
    startYearN1 = clot.getFullYear();
  }

  let startN2 = 0, startYearN2 = startYearN1;
  const dureeN2 = exercices?.[2]?.duree ?? 12;
  if (exercices?.[1]?.dateCloture) {
    const clot = parseLocalDate(exercices[1].dateCloture);
    clot.setDate(clot.getDate() + 1);
    startN2 = clot.getMonth();
    startYearN2 = clot.getFullYear();
  }

  return {
    N:  { startMonth: startN,  startYear: startYearN,  duree: dureeN  },
    N1: { startMonth: startN1, startYear: startYearN1, duree: dureeN1 },
    N2: { startMonth: startN2, startYear: startYearN2, duree: dureeN2 },
  };
}

/**
 * Rééchantillonne un tableau de saisonnalité vers une nouvelle longueur,
 * puis renormalise à 100 %.
 */
export function resampleSaisonnalite(source: number[], targetLen: number): number[] {
  if (targetLen === source.length) return [...source];
  const result: number[] = [];
  const srcLen = source.length;
  for (let i = 0; i < targetLen; i++) {
    const ratio = (i / targetLen) * srcLen;
    const lo = Math.floor(ratio);
    const hi = Math.min(lo + 1, srcLen - 1);
    const frac = ratio - lo;
    result.push(source[lo]! * (1 - frac) + source[hi]! * frac);
  }
  const total = result.reduce((s, v) => s + v, 0);
  if (total === 0) return Array(targetLen).fill(+(100 / targetLen).toFixed(4));
  return result.map((v) => +((v / total) * 100).toFixed(4));
}

// ── Calcul pur des stocks et achats (formule RCA) ─────────────────────────────

/**
 * Formule RCA :
 * SF[j] = cumulConso[0..j] × stocksJoursCible / 360
 *
 * - SF croît proportionnellement au cumul des consommations.
 * - SF[duree-1] = totalConsommes × stocksJoursCible / 360 (niveau cible en clôture).
 * - Les achats ponctuels s'ajoutent directement à achatsEff du mois concerné.
 * - stockInitial assure la continuité N → N+1 → N+2.
 */
function computeStocksAchats(
  consommesAchats: number[],
  ponctuel: number[],
  stocksJoursCible: number,
  stockInitial: number,
  duree: number,
): Pick<CalculsExercice, "stocksInitAch" | "stocksFauxAch" | "stocksJours" | "achatsEff"> {
  const totalConsommes = consommesAchats.reduce((a, b) => a + b, 0);
  const stocksInitAch: number[] = [];
  const stocksFauxAch: number[] = [];
  const achatsEff: number[] = [];
  const stocksJours: number[] = [];
  let cumulConsommes = 0;

  for (let j = 0; j < duree; j++) {
    const si = j === 0 ? stockInitial : (stocksFauxAch[j - 1] ?? 0);
    stocksInitAch[j] = si;
    const conso = consommesAchats[j] ?? 0;
    const achatPonctuel = ponctuel[j] ?? 0;
    cumulConsommes += conso;
    const sfBase = totalConsommes > 0 ? (cumulConsommes * stocksJoursCible) / 360 : 0;
    const ratioCumul = totalConsommes > 0 ? cumulConsommes / (totalConsommes + achatPonctuel) : 0;
    const sf = sfBase + ((achatPonctuel + si ) * (1 - ratioCumul));
    stocksFauxAch[j] = sf;
    stocksJours[j] = conso > 0 ? (sf * 30) / conso : stocksJoursCible;
    achatsEff[j] = conso + sf - si; // ok
  }
  return { stocksInitAch, stocksFauxAch, stocksJours, achatsEff };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

function numVal(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

interface UseActiviteCalculsParams {
  dossierId: string;
  currentIndex: number;
  exercicesConfig: ExercicesConfig;
}

export function useActiviteCalculs({
  dossierId,
  currentIndex,
  exercicesConfig,
}: UseActiviteCalculsParams): UseActiviteCalculsReturn {
  const { getDraft, updateActivite } = useActiviteStore();
  const draft = getDraft(dossierId);
  const activite = draft.activites[currentIndex];

  // ── State : saisonnalité CA ───────────────────────────────────────────────
  const [saisonnalite, setSaisonnalite] = useState<Record<ExerciceKey, number[]>>(() => {
    const stored = activite?.saisonnaliteCA as Record<string, number[]> | undefined;
    return {
      N:  stored?.N  ?? buildEvenSaisonnalite(exercicesConfig.N.duree),
      N1: stored?.N1 ?? buildEvenSaisonnalite(exercicesConfig.N1.duree),
      N2: stored?.N2 ?? buildEvenSaisonnalite(exercicesConfig.N2.duree),
    };
  });

  // ── State : synchronisation saisonnalité CA ↔ Achats ─────────────────────
  const [syncSaisonnalite, setSyncSaisonnalite] = useState(true);

  // ── State : saisonnalité Achats (indépendante si désynchronisée) ──────────
  const [saisonnaliteAchats, setSaisonnaliteAchats] = useState<Record<ExerciceKey, number[]>>(() => {
    const storedAchats = activite?.saisonnaliteAchats as Record<string, number[]> | undefined;
    if (storedAchats)
      return {
        N:  storedAchats.N  ?? buildEvenSaisonnalite(exercicesConfig.N.duree),
        N1: storedAchats.N1 ?? buildEvenSaisonnalite(exercicesConfig.N1.duree),
        N2: storedAchats.N2 ?? buildEvenSaisonnalite(exercicesConfig.N2.duree),
      };
    const storedCA = activite?.saisonnaliteCA as Record<string, number[]> | undefined;
    return {
      N:  storedCA?.N  ?? buildEvenSaisonnalite(exercicesConfig.N.duree),
      N1: storedCA?.N1 ?? buildEvenSaisonnalite(exercicesConfig.N1.duree),
      N2: storedCA?.N2 ?? buildEvenSaisonnalite(exercicesConfig.N2.duree),
    };
  });

  // ── State : achats de stock ponctuels ─────────────────────────────────────
  const [achatsStockPonctuel, setAchatsStockPonctuel] = useState<Record<ExerciceKey, number[]>>(() => {
    const stored = activite?.achatsStockPonctuel as Record<string, number[]> | undefined;
    return {
      N:  stored?.N  ?? Array(exercicesConfig.N.duree).fill(0),
      N1: stored?.N1 ?? Array(exercicesConfig.N1.duree).fill(0),
      N2: stored?.N2 ?? Array(exercicesConfig.N2.duree).fill(0),
    };
  });

  // ── Calculs séquentiels N → N+1 → N+2 (continuité inter-exercices) ───────
  const calculs = (() => {
    const result = {} as CalculsParExercice;
    let prevSF = 0;
    const stocksJoursCible = activite?.stocks ?? 0;
    const tauxMarge = activite?.tauxMarge ?? 0;

    for (const ex of ["N", "N1", "N2"] as ExerciceKey[]) {
      const montant =
        ex === "N" ? (activite?.montantN ?? 0)
        : ex === "N1" ? (activite?.montantN1 ?? 0)
        : (activite?.montantN2 ?? 0);

      const saison = saisonnalite[ex];
      const saisonAch = syncSaisonnalite ? saison : saisonnaliteAchats[ex];
      const ponctuel = achatsStockPonctuel[ex];
      const duree = exercicesConfig[ex].duree;

      // CA → Marges → Consommations
      const productions = saison.map((p) => montant * (p / 100));
      const marges = productions.map((p) => p * (tauxMarge / 100));
      const consommes = productions.map((p, i) => p - marges[i]);
      const totalConsommes = consommes.reduce((a, b) => a + b, 0);

      // Consommations ré-étalées selon la saisonnalité achats
      const consommesAchats = saisonAch.map((p) => totalConsommes * (p / 100));

      // Stocks et achats (formule RCA)
      const { stocksInitAch, stocksFauxAch, stocksJours, achatsEff } = computeStocksAchats(
        consommesAchats,
        ponctuel,
        stocksJoursCible,
        prevSF,
        duree,
      );

      // Transporte le SF de clôture vers l'exercice suivant
      prevSF = stocksFauxAch[duree - 1] ?? 0;

      result[ex] = {
        moisLabels: buildMoisLabels(exercicesConfig[ex].startMonth, exercicesConfig[ex].startYear, duree),
        productions,
        marges,
        consommes,
        consommesAchats,
        stocksInitAch,
        stocksFauxAch,
        stocksJours,
        achatsEff,
        saisonnalite: saison,
        saisonnaliteAchats: saisonAch,
        ponctuel,
        duree,
        totalConsommes,
        montant,
        totalSaison: saison.reduce((s, v) => s + v, 0),
        totalSaisonAchats: saisonAch.reduce((s, v) => s + v, 0),
      };
    }

    return result;
  })();

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleSaisonnalite(ex: ExerciceKey, idx: number, val: string) {
    const updated = [...saisonnalite[ex]];
    updated[idx] = numVal(val);
    const next = { ...saisonnalite, [ex]: updated };
    setSaisonnalite(next);
    if (syncSaisonnalite) {
      setSaisonnaliteAchats(next);
      updateActivite(dossierId, currentIndex, { saisonnaliteCA: next, saisonnaliteAchats: next });
    } else {
      updateActivite(dossierId, currentIndex, { saisonnaliteCA: next });
    }
  }

  function handleSaisonnaliteAchats(ex: ExerciceKey, idx: number, val: string) {
    const updated = [...saisonnaliteAchats[ex]];
    updated[idx] = numVal(val);
    const next = { ...saisonnaliteAchats, [ex]: updated };
    setSaisonnaliteAchats(next);
    updateActivite(dossierId, currentIndex, { saisonnaliteAchats: next });
  }

  function handleAchatPonctuel(ex: ExerciceKey, idx: number, val: string) {
    const updated = [...achatsStockPonctuel[ex]];
    updated[idx] = numVal(val);
    const next = { ...achatsStockPonctuel, [ex]: updated };
    setAchatsStockPonctuel(next);
    updateActivite(dossierId, currentIndex, { achatsStockPonctuel: next });
  }

  function handleImportFrom(sourceIdx: number) {
    const source = draft.activites[sourceIdx];
    if (!source) return;
    const srcCA = source.saisonnaliteCA as Record<string, number[]> | undefined | null;
    const srcAchats = source.saisonnaliteAchats as Record<string, number[]> | undefined | null;
    const nextCA: Record<ExerciceKey, number[]> = {
      N:  resampleSaisonnalite(srcCA?.N  ?? buildEvenSaisonnalite(exercicesConfig.N.duree),  exercicesConfig.N.duree),
      N1: resampleSaisonnalite(srcCA?.N1 ?? buildEvenSaisonnalite(exercicesConfig.N1.duree), exercicesConfig.N1.duree),
      N2: resampleSaisonnalite(srcCA?.N2 ?? buildEvenSaisonnalite(exercicesConfig.N2.duree), exercicesConfig.N2.duree),
    };
    const nextAchats: Record<ExerciceKey, number[]> = syncSaisonnalite
      ? nextCA
      : {
          N:  resampleSaisonnalite(srcAchats?.N  ?? nextCA.N,  exercicesConfig.N.duree),
          N1: resampleSaisonnalite(srcAchats?.N1 ?? nextCA.N1, exercicesConfig.N1.duree),
          N2: resampleSaisonnalite(srcAchats?.N2 ?? nextCA.N2, exercicesConfig.N2.duree),
        };
    setSaisonnalite(nextCA);
    setSaisonnaliteAchats(nextAchats);
    updateActivite(dossierId, currentIndex, { saisonnaliteCA: nextCA, saisonnaliteAchats: nextAchats });
  }

  function toggleSyncSaisonnalite() {
    const next = !syncSaisonnalite;
    setSyncSaisonnalite(next);
    if (next) {
      setSaisonnaliteAchats(saisonnalite);
      updateActivite(dossierId, currentIndex, { saisonnaliteAchats: saisonnalite });
    }
  }

  function reporterSaisonnaliteCA(source: ExerciceKey, targets: ExerciceKey[]) {
    let nextCA = { ...saisonnalite };
    let nextAchats = { ...saisonnaliteAchats };
    for (const target of targets) {
      const resampled = resampleSaisonnalite(saisonnalite[source], exercicesConfig[target].duree);
      nextCA = { ...nextCA, [target]: resampled };
      nextAchats = syncSaisonnalite
        ? { ...nextAchats, [target]: resampled }
        : {
            ...nextAchats,
            [target]: resampleSaisonnalite(saisonnaliteAchats[source], exercicesConfig[target].duree),
          };
    }
    setSaisonnalite(nextCA);
    setSaisonnaliteAchats(nextAchats);
    updateActivite(dossierId, currentIndex, { saisonnaliteCA: nextCA, saisonnaliteAchats: nextAchats });
  }

  function reporterSaisonnaliteAchats(source: ExerciceKey, targets: ExerciceKey[]) {
    let next = { ...saisonnaliteAchats };
    for (const target of targets) {
      next = {
        ...next,
        [target]: resampleSaisonnalite(saisonnaliteAchats[source], exercicesConfig[target].duree),
      };
    }
    setSaisonnaliteAchats(next);
    updateActivite(dossierId, currentIndex, { saisonnaliteAchats: next });
  }

  return {
    calculs,
    syncSaisonnalite,
    handleSaisonnalite,
    handleSaisonnaliteAchats,
    handleAchatPonctuel,
    handleImportFrom,
    toggleSyncSaisonnalite,
    reporterSaisonnaliteCA,
    reporterSaisonnaliteAchats,
  };
}
