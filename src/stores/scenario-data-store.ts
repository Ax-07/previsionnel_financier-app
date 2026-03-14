import { create } from "zustand";
import { loadScenarioData } from "@/app/actions/load-scenario-data";
import type { ScenarioFinData } from "@/app/actions/load-scenario-data";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ScenarioDataStatus = "idle" | "loading" | "success" | "error";

interface ScenarioDataEntry {
  data: ScenarioFinData;
  fetchedAt: number;
}

interface ScenarioDataState {
  cache: Record<string, ScenarioDataEntry>;
  status: Record<string, ScenarioDataStatus>;
  errors: Record<string, string>;

  getData: (dossierId: string) => ScenarioFinData | null;
  getStatus: (dossierId: string) => ScenarioDataStatus;
  getError: (dossierId: string) => string | null;

  /** Charge les données si pas encore chargées (no-op si status === "success") */
  load: (dossierId: string) => Promise<void>;
  /** Force le rechargement même si déjà en cache (point d'invalidation unique) */
  reload: (dossierId: string) => Promise<void>;
  clear: (dossierId: string) => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useScenarioDataStore = create<ScenarioDataState>((set, get) => ({
  cache: {},
  status: {},
  errors: {},

  getData: (dossierId) => get().cache[dossierId]?.data ?? null,
  getStatus: (dossierId) => get().status[dossierId] ?? "idle",
  getError: (dossierId) => get().errors[dossierId] ?? null,

  load: async (dossierId) => {
    const { status, cache } = get();
    if (status[dossierId] === "loading") return;
    if (cache[dossierId]) return; // déjà en cache

    set((s) => ({
      status: { ...s.status, [dossierId]: "loading" },
      errors: { ...s.errors, [dossierId]: "" },
    }));

    try {
      const data = await loadScenarioData(dossierId);
      set((s) => ({
        cache: { ...s.cache, [dossierId]: { data, fetchedAt: Date.now() } },
        status: { ...s.status, [dossierId]: "success" },
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur de chargement";
      set((s) => ({
        status: { ...s.status, [dossierId]: "error" },
        errors: { ...s.errors, [dossierId]: message },
      }));
    }
  },

  reload: async (dossierId) => {
    const { status } = get();
    if (status[dossierId] === "loading") return;

    set((s) => ({
      status: { ...s.status, [dossierId]: "loading" },
      errors: { ...s.errors, [dossierId]: "" },
    }));

    try {
      const data = await loadScenarioData(dossierId);
      set((s) => ({
        cache: { ...s.cache, [dossierId]: { data, fetchedAt: Date.now() } },
        status: { ...s.status, [dossierId]: "success" },
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur de chargement";
      set((s) => ({
        status: { ...s.status, [dossierId]: "error" },
        errors: { ...s.errors, [dossierId]: message },
      }));
    }
  },

  clear: (dossierId) => {
    set((s) => {
      const cache = { ...s.cache };
      const status = { ...s.status };
      const errors = { ...s.errors };
      delete cache[dossierId];
      delete status[dossierId];
      delete errors[dossierId];
      return { cache, status, errors };
    });
  },
}));
