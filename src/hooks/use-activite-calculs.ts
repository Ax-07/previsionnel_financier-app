"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useActiviteStore } from "@/stores/activite-store";
import {
  buildEvenSaisonnalite as sharedBuildEvenSaisonnalite,
  buildExercicesConfig as sharedBuildExercicesConfig,
  buildMoisLabels as sharedBuildMoisLabels,
  resampleSaisonnalite as sharedResampleSaisonnalite,
} from "@/lib/finance/forms-calendar";

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
  handleSaisonnalite: (ex: ExerciceKey, idx: number, val: number) => void;
  /** Modifier une valeur de saisonnalité achats */
  handleSaisonnaliteAchats: (ex: ExerciceKey, idx: number, val: number) => void;
  /** Modifier un achat ponctuel */
  handleAchatPonctuel: (ex: ExerciceKey, idx: number, val: number) => void;
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

/** Génère les étiquettes de mois « Mar. 26 » */
export function buildMoisLabels(startMonth: number, startYear: number, duree: number): readonly string[] {
  return sharedBuildMoisLabels(startMonth, startYear, duree);
}

/** Répartition équitable sur `duree` mois (dernier mois absorbe l'arrondi). */
export function buildEvenSaisonnalite(duree: number): number[] {
  return sharedBuildEvenSaisonnalite(duree);
}

/** Calcule la config calendaire de chaque exercice depuis les données entreprise. */
export function buildExercicesConfig(
  dateDebutN: string | undefined,
  exercices: ExerciceCalendrierEntry[] | undefined,
): ExercicesConfig {
  return sharedBuildExercicesConfig(dateDebutN, exercices);
}

/**
 * Rééchantillonne un tableau de saisonnalité vers une nouvelle longueur,
 * puis renormalise à 100 %.
 */
export function resampleSaisonnalite(source: number[], targetLen: number): number[] {
  return sharedResampleSaisonnalite(source, targetLen);
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

interface UseActiviteCalculsParams {
  dossierId: string;
  currentIndex: number;
  exercicesConfig: ExercicesConfig;
}

function normalizeSaisonnalite(source: number[] | undefined, duree: number): number[] {
  if (!Array.isArray(source) || source.length === 0) return buildEvenSaisonnalite(duree);
  return resampleSaisonnalite(source, duree);
}

function resizeMontants(source: number[] | undefined, duree: number): number[] {
  const result = Array(duree).fill(0) as number[];
  if (!Array.isArray(source)) return result;
  for (let i = 0; i < duree; i++) {
    result[i] = source[i] ?? 0;
  }
  return result;
}

/** Extrait les saisonnalités CA depuis une activité du store. */
function extractSaisonnaliteCA(
  activite: ReturnType<ReturnType<typeof useActiviteStore.getState>["getDraft"]>["activites"][number] | undefined,
  exercicesConfig: ExercicesConfig,
): Record<ExerciceKey, number[]> {
  const stored = activite?.saisonnaliteCA as Record<string, number[]> | undefined;
  return {
    N:  normalizeSaisonnalite(stored?.N,  exercicesConfig.N.duree),
    N1: normalizeSaisonnalite(stored?.N1, exercicesConfig.N1.duree),
    N2: normalizeSaisonnalite(stored?.N2, exercicesConfig.N2.duree),
  };
}

/** Extrait les saisonnalités Achats depuis une activité du store. */
function extractSaisonnaliteAchats(
  activite: ReturnType<ReturnType<typeof useActiviteStore.getState>["getDraft"]>["activites"][number] | undefined,
  exercicesConfig: ExercicesConfig,
): Record<ExerciceKey, number[]> {
  const storedAchats = activite?.saisonnaliteAchats as Record<string, number[]> | undefined;
  if (storedAchats)
    return {
      N:  normalizeSaisonnalite(storedAchats.N,  exercicesConfig.N.duree),
      N1: normalizeSaisonnalite(storedAchats.N1, exercicesConfig.N1.duree),
      N2: normalizeSaisonnalite(storedAchats.N2, exercicesConfig.N2.duree),
    };
  const storedCA = activite?.saisonnaliteCA as Record<string, number[]> | undefined;
  return {
    N:  normalizeSaisonnalite(storedCA?.N,  exercicesConfig.N.duree),
    N1: normalizeSaisonnalite(storedCA?.N1, exercicesConfig.N1.duree),
    N2: normalizeSaisonnalite(storedCA?.N2, exercicesConfig.N2.duree),
  };
}

/** Extrait les achats ponctuels depuis une activité du store. */
function extractAchatsStockPonctuel(
  activite: ReturnType<ReturnType<typeof useActiviteStore.getState>["getDraft"]>["activites"][number] | undefined,
  exercicesConfig: ExercicesConfig,
): Record<ExerciceKey, number[]> {
  const stored = activite?.achatsStockPonctuel as Record<string, number[]> | undefined;
  return {
    N:  resizeMontants(stored?.N,  exercicesConfig.N.duree),
    N1: resizeMontants(stored?.N1, exercicesConfig.N1.duree),
    N2: resizeMontants(stored?.N2, exercicesConfig.N2.duree),
  };
}

export function useActiviteCalculs({
  dossierId,
  currentIndex,
  exercicesConfig,
}: UseActiviteCalculsParams): UseActiviteCalculsReturn {
  const { getDraft, updateActiviteRow: updateActivite } = useActiviteStore();
  const draft = getDraft(dossierId);
  const activite = draft.activites[currentIndex];

  // ── State : saisonnalité CA ───────────────────────────────────────────────
  // Initialisé depuis le store ; resynchronisé si le store change (ex: hydratation
  // serveur arrivant après le montage du composant).
  const [saisonnalite, setSaisonnalite] = useState<Record<ExerciceKey, number[]>>(
    () => extractSaisonnaliteCA(activite, exercicesConfig),
  );

  // ── State : synchronisation saisonnalité CA ↔ Achats ─────────────────────
  const [syncSaisonnalite, setSyncSaisonnalite] = useState(true);

  // ── State : saisonnalité Achats (indépendante si désynchronisée) ──────────
  const [saisonnaliteAchats, setSaisonnaliteAchats] = useState<Record<ExerciceKey, number[]>>(
    () => extractSaisonnaliteAchats(activite, exercicesConfig),
  );

  // ── State : achats de stock ponctuels ─────────────────────────────────────
  const [achatsStockPonctuel, setAchatsStockPonctuel] = useState<Record<ExerciceKey, number[]>>(
    () => extractAchatsStockPonctuel(activite, exercicesConfig),
  );

  // ── Resync depuis le store à chaque changement d'activité ou d'index ──────
  // Corrige le cas où le store est mis à jour après le montage initial
  // (hydratation serveur, changement de dossier, etc.).
  useEffect(() => {
    const freshActivite = getDraft(dossierId).activites[currentIndex];
    setSaisonnalite(extractSaisonnaliteCA(freshActivite, exercicesConfig));
    setSaisonnaliteAchats(extractSaisonnaliteAchats(freshActivite, exercicesConfig));
    setAchatsStockPonctuel(extractAchatsStockPonctuel(freshActivite, exercicesConfig));
  // On observe dossierId et currentIndex ; exercicesConfig est stable par construction.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId, currentIndex]);

  // ── Calculs séquentiels N → N+1 → N+2 (continuité inter-exercices) ───────
  const stocksJoursCible = activite?.stocks ?? 0;
  const tauxMarge = activite?.tauxMarge ?? 0;
  const montantN = activite?.montantN ?? 0;
  const montantN1 = activite?.montantN1 ?? 0;
  const montantN2 = activite?.montantN2 ?? 0;

  const calculs = useMemo(() => {
    const result = {} as CalculsParExercice;
    let prevSF = 0;

    for (const ex of ["N", "N1", "N2"] as ExerciceKey[]) {
      const montant =
        ex === "N" ? montantN
        : ex === "N1" ? montantN1
        : montantN2;

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
  }, [saisonnalite, saisonnaliteAchats, achatsStockPonctuel, syncSaisonnalite, exercicesConfig, stocksJoursCible, tauxMarge, montantN, montantN1, montantN2]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSaisonnalite = useCallback((ex: ExerciceKey, idx: number, val: number) => {
    setSaisonnalite((prev) => {
      const updated = [...prev[ex]];
      updated[idx] = val;
      const next = { ...prev, [ex]: updated };
      if (syncSaisonnalite) {
        setSaisonnaliteAchats(next);
        updateActivite(dossierId, currentIndex, { saisonnaliteCA: next, saisonnaliteAchats: next });
      } else {
        updateActivite(dossierId, currentIndex, { saisonnaliteCA: next });
      }
      return next;
    });
  }, [syncSaisonnalite, dossierId, currentIndex, updateActivite]);

  const handleSaisonnaliteAchats = useCallback((ex: ExerciceKey, idx: number, val: number) => {
    setSaisonnaliteAchats((prev) => {
      const updated = [...prev[ex]];
      updated[idx] = val;
      const next = { ...prev, [ex]: updated };
      updateActivite(dossierId, currentIndex, { saisonnaliteAchats: next });
      return next;
    });
  }, [dossierId, currentIndex, updateActivite]);

  const handleAchatPonctuel = useCallback((ex: ExerciceKey, idx: number, val: number) => {
    setAchatsStockPonctuel((prev) => {
      const updated = [...prev[ex]];
      updated[idx] = val;
      const next = { ...prev, [ex]: updated };
      updateActivite(dossierId, currentIndex, { achatsStockPonctuel: next });
      return next;
    });
  }, [dossierId, currentIndex, updateActivite]);

  const handleImportFrom = useCallback((sourceIdx: number) => {
    const source = getDraft(dossierId).activites[sourceIdx];
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
  }, [dossierId, currentIndex, exercicesConfig, syncSaisonnalite, getDraft, updateActivite]);

  const toggleSyncSaisonnalite = useCallback(() => {
    setSyncSaisonnalite((prev) => {
      const next = !prev;
      if (next) {
        setSaisonnalite((curSaison) => {
          setSaisonnaliteAchats(curSaison);
          updateActivite(dossierId, currentIndex, { saisonnaliteAchats: curSaison });
          return curSaison;
        });
      }
      return next;
    });
  }, [dossierId, currentIndex, updateActivite]);

  const reporterSaisonnaliteCA = useCallback((source: ExerciceKey, targets: ExerciceKey[]) => {
    setSaisonnalite((prevCA) => {
      let nextCA = { ...prevCA };
      let nextAchats = { ...saisonnaliteAchats };
      for (const target of targets) {
        const resampled = resampleSaisonnalite(prevCA[source], exercicesConfig[target].duree);
        nextCA = { ...nextCA, [target]: resampled };
        nextAchats = syncSaisonnalite
          ? { ...nextAchats, [target]: resampled }
          : {
              ...nextAchats,
              [target]: resampleSaisonnalite(saisonnaliteAchats[source], exercicesConfig[target].duree),
            };
      }
      setSaisonnaliteAchats(nextAchats);
      updateActivite(dossierId, currentIndex, { saisonnaliteCA: nextCA, saisonnaliteAchats: nextAchats });
      return nextCA;
    });
  }, [dossierId, currentIndex, exercicesConfig, syncSaisonnalite, saisonnaliteAchats, updateActivite]);

  const reporterSaisonnaliteAchats = useCallback((source: ExerciceKey, targets: ExerciceKey[]) => {
    setSaisonnaliteAchats((prev) => {
      let next = { ...prev };
      for (const target of targets) {
        next = {
          ...next,
          [target]: resampleSaisonnalite(prev[source], exercicesConfig[target].duree),
        };
      }
      updateActivite(dossierId, currentIndex, { saisonnaliteAchats: next });
      return next;
    });
  }, [dossierId, currentIndex, exercicesConfig, updateActivite]);

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
