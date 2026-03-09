import { create } from "zustand";
import {
  fetchTresorerie,
  type TresorerieData,
} from "@/app/actions/controle/tresorerie";
import { usePersonnelStore } from "@/stores/personnel-store";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TresorerieStatus = "idle" | "loading" | "success" | "error";

interface TresoCacheEntry {
  data: TresorerieData;
  fetchedAt: number;
}

interface TresorerieState {
  cache: Record<string, TresoCacheEntry>;
  status: Record<string, TresorerieStatus>;
  errors: Record<string, string>;

  getData: (dossierId: string) => TresorerieData | null;
  getStatus: (dossierId: string) => TresorerieStatus;
  getError: (dossierId: string) => string | null;

  fetch: (dossierId: string, force?: boolean) => Promise<void>;
  invalidate: (dossierId: string) => void;
  invalidateAll: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useTresorerieStore = create<TresorerieState>((set, get) => ({
  cache: {},
  status: {},
  errors: {},

  getData: (dossierId) => get().cache[dossierId]?.data ?? null,
  getStatus: (dossierId) => get().status[dossierId] ?? "idle",
  getError: (dossierId) => get().errors[dossierId] ?? null,

  fetch: async (dossierId, force = false) => {
    const { cache, status } = get();
    if (status[dossierId] === "loading") return;
    if (!force && cache[dossierId]) return;

    set((s) => ({
      status: { ...s.status, [dossierId]: "loading" },
      errors: { ...s.errors, [dossierId]: "" },
    }));

    try {
      const moisPaiement =
        usePersonnelStore.getState().getDraft(dossierId).paramsGlobaux.moisPaiement ?? 0;
      const data = await fetchTresorerie(dossierId, moisPaiement);
      set((s) => ({
        cache: {
          ...s.cache,
          [dossierId]: { data, fetchedAt: Date.now() },
        },
        status: { ...s.status, [dossierId]: "success" },
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur de chargement";
      set((s) => ({
        status: { ...s.status, [dossierId]: "error" },
        errors: { ...s.errors, [dossierId]: message },
      }));
    }
  },

  invalidate: (dossierId) => {
    set((s) => {
      const newCache = { ...s.cache };
      const newStatus = { ...s.status };
      delete newCache[dossierId];
      delete newStatus[dossierId];
      return { cache: newCache, status: newStatus };
    });
  },

  invalidateAll: () => {
    set({ cache: {}, status: {} });
  },
}));
