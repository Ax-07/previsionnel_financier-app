import { create } from "zustand";
import { loadSaisieData } from "@/app/actions/load-saisie-data";
import type { SaisieFormData } from "@/app/actions/load-saisie-data";
import type { DataStatus } from "@/lib/types/data-state";

// ── Types ─────────────────────────────────────────────────────────────────────

/** @deprecated Utiliser `DataStatus` depuis `@/lib/types/data-state` */
export type SaisieDataStatus = DataStatus;

interface SaisieDataEntry {
  data: SaisieFormData;
  fetchedAt: number;
}

interface SaisieDataState {
  cache: Record<string, SaisieDataEntry>;
  status: Record<string, SaisieDataStatus>;
  errors: Record<string, string>;

  /** Charge les données si pas encore chargées (no-op si déjà en cache) */
  load: (dossierId: string) => Promise<void>;
  /** Force le rechargement même si déjà en cache (point d'invalidation unique) */
  reload: (dossierId: string) => Promise<void>;
  clear: (dossierId: string) => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useSaisieDataStore = create<SaisieDataState>((set, get) => ({
  cache: {},
  status: {},
  errors: {},

  load: async (dossierId) => {
    const { status, cache } = get();
    if (status[dossierId] === "loading") return;
    if (cache[dossierId]) return;

    set((s) => ({
      status: { ...s.status, [dossierId]: "loading" },
      errors: { ...s.errors, [dossierId]: "" },
    }));

    try {
      const data = await loadSaisieData(dossierId);
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
      const data = await loadSaisieData(dossierId);
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
      const { [dossierId]: _cache, ...cache } = s.cache;
      const { [dossierId]: _status, ...status } = s.status;
      const { [dossierId]: _errors, ...errors } = s.errors;
      return { cache, status, errors };
    });
  },
}));
