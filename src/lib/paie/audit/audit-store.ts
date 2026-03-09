/**
 * Store Zustand du journal d'audit du moteur de paie.
 *
 * Chaque appel au moteur `simulate()` peut être enregistré comme une entrée
 * d'audit. Cela permet de retracer les calculs, diagnostiquer les anomalies
 * et exporter l'historique de simulation.
 *
 * Limité à MAX_ENTRIES entrées (FIFO — les plus anciennes sont écartées).
 * Pas de persistance localStorage par défaut (éphémère comme le simulateur).
 */

import { create } from "zustand";
import type { SimulationInput, SimulationResultat } from "@/lib/paie/types";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

export const MOTEUR_VERSION = "2.0.0";
const MAX_ENTRIES = 50;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Données diagnostiques calculées lors de l'intégration d'une entrée */
export interface AuditDiagnostic {
  brutSoumis: number;
  facteurProrata: number;
  pmssProratise: number;
  nbLignes: number;
  totalSalarial: number;
  totalPatronal: number;
  montantRGDU: number;
  netAPayer: number;
  coutEmployeur: number;
}

/** Une entrée du journal d'audit — snapshot complet d'une simulation */
export interface AuditEntry {
  /** Identifiant unique de l'entrée */
  id: string;
  /** Horodatage Unix (ms) */
  timestamp: number;
  /** Millésime réglementaire utilisé */
  millesime: string;
  /** Version du moteur au moment du calcul */
  moteurVersion: string;
  /** Snapshot des inputs */
  input: SimulationInput;
  /** Snapshot du résultat complet */
  resultat: SimulationResultat;
  /** Données diagnostiques résumées */
  diagnostic: AuditDiagnostic;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

interface AuditState {
  entries: AuditEntry[];

  /**
   * Ajoute une entrée d'audit pour une simulation donnée.
   * @returns L'identifiant de l'entrée créée.
   */
  addEntry: (input: SimulationInput, resultat: SimulationResultat) => string;

  /** Supprime une entrée par son identifiant. */
  removeEntry: (id: string) => void;

  /** Vide entièrement le journal. */
  clearAudit: () => void;

  /** Récupère une entrée par son identifiant. */
  getEntry: (id: string) => AuditEntry | undefined;
}

export const useAuditStore = create<AuditState>()((set, get) => ({
  entries: [],

  addEntry(input, resultat) {
    const id = `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const entry: AuditEntry = {
      id,
      timestamp: Date.now(),
      millesime: input.millesime ?? "2026",
      moteurVersion: MOTEUR_VERSION,
      input,
      resultat,
      diagnostic: {
        brutSoumis: resultat.brutSoumis,
        facteurProrata: resultat.facteurProrata,
        pmssProratise: resultat.pmssProratise,
        nbLignes: resultat.lignes.length,
        totalSalarial: resultat.totalCotisationsSalariales,
        totalPatronal: resultat.totalCotisationsPatronales,
        montantRGDU: resultat.montantRGDU,
        netAPayer: resultat.netAPayer,
        coutEmployeur: resultat.coutEmployeur,
      },
    };
    set((state) => ({
      entries: [entry, ...state.entries].slice(0, MAX_ENTRIES),
    }));
    return id;
  },

  removeEntry(id) {
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }));
  },

  clearAudit() {
    set({ entries: [] });
  },

  getEntry(id) {
    return get().entries.find((e) => e.id === id);
  },
}));
