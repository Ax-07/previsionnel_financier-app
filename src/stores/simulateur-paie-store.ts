/**
 * Store Zustand du simulateur de fiche de paie.
 * Stocke les inputs, le résultat calculé, le mode de simulation
 * et la liste des scénarios comparatifs sauvegardés.
 * Pas de persistance localStorage — le simulateur est éphémère par design.
 */

import { create } from "zustand";
import type { SimulationInput, SimulationResultat } from "@/lib/paie/types";

// ─────────────────────────────────────────────────────────────────────────────
// Scénarios
// ─────────────────────────────────────────────────────────────────────────────

/** Un scénario sauvegardé = snapshot nommé d'une simulation */
export interface Scenario {
  id: string;
  nom: string;
  createdAt: number;
  input: SimulationInput;
  resultat: SimulationResultat;
}

const MAX_SCENARIOS = 20;

export type ModeSimulation = "brut_to_net" | "net_to_brut";

interface SimulateurState {
  /** Mode de calcul courant */
  mode: ModeSimulation;
  /** Net cible (mode net → brut uniquement) */
  netCible: number | null;
  /** Derniers inputs saisis */
  input: SimulationInput | null;
  /** Dernier résultat calculé */
  resultat: SimulationResultat | null;
  /** Erreur de calcul éventuelle */
  erreur: string | null;
  /** Calcul en cours */
  calcEnCours: boolean;
  /** Scénarios sauvegardés pour comparaison */
  scenarios: Scenario[];

  // ── Actions simulation ───────────────────────────────────────────────────
  setMode: (mode: ModeSimulation) => void;
  setNetCible: (net: number) => void;
  setResultat: (input: SimulationInput, resultat: SimulationResultat) => void;
  setErreur: (erreur: string) => void;
  setCalcEnCours: (v: boolean) => void;
  reset: () => void;

  // ── Actions scénarios ────────────────────────────────────────────────────
  /** Sauvegarde la simulation courante comme un scénario nommé. Retourne l'id créé. */
  addScenario: (nom: string) => string | null;
  /** Supprime un scénario par son id. */
  removeScenario: (id: string) => void;
  /** Renomme un scénario. */
  renameScenario: (id: string, nom: string) => void;
}

const defaultInput: SimulationInput = {
  salarié: {
    statut: "non_cadre",
    typeContrat: "CDI",
    heuresContrat: 151.66669,
    brutMensuel: 1823.03,
    tauxPAS: 0,
    modePAS: "neutre",
  },
  entreprise: {
    effectif: 10,
    tauxATMP: 0.021,
    tauxMobilite: 0,
  },
};

export const useSimulateurStore = create<SimulateurState>()((set, get) => ({
  mode: "brut_to_net",
  netCible: null,
  input: null,
  resultat: null,
  erreur: null,
  calcEnCours: false,
  scenarios: [],

  setMode: (mode) => set({ mode }),
  setNetCible: (netCible) => set({ netCible }),
  setResultat: (input, resultat) => set({ input, resultat, erreur: null }),
  setErreur: (erreur) => set({ erreur, resultat: null }),
  setCalcEnCours: (calcEnCours) => set({ calcEnCours }),
  reset: () =>
    set({
      mode: "brut_to_net",
      netCible: null,
      input: null,
      resultat: null,
      erreur: null,
      calcEnCours: false,
    }),

  addScenario(nom) {
    const { input, resultat } = get();
    if (!input || !resultat) return null;
    const id = `sc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const scenario: Scenario = { id, nom: nom.trim() || `Scénario ${Date.now()}`, createdAt: Date.now(), input, resultat };
    set((state) => ({
      scenarios: [scenario, ...state.scenarios].slice(0, MAX_SCENARIOS),
    }));
    return id;
  },

  removeScenario(id) {
    set((state) => ({ scenarios: state.scenarios.filter((s) => s.id !== id) }));
  },

  renameScenario(id, nom) {
    set((state) => ({
      scenarios: state.scenarios.map((s) =>
        s.id === id ? { ...s, nom: nom.trim() || s.nom } : s,
      ),
    }));
  },
}));

export { defaultInput };
