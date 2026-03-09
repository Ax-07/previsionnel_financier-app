import { create } from "zustand";
import {
  fetchTableauFinancement,
  type TfData,
} from "@/app/actions/controle/tableau-financement";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TfStatus = "idle" | "loading" | "success" | "error";

interface TfCacheEntry {
  data: TfData;
  fetchedAt: number;
}

interface TfState {
  cache: Record<string, TfCacheEntry>;
  status: Record<string, TfStatus>;
  errors: Record<string, string>;

  getData: (dossierId: string) => TfData | null;
  getStatus: (dossierId: string) => TfStatus;
  getError: (dossierId: string) => string | null;

  fetch: (dossierId: string, force?: boolean) => Promise<void>;
  invalidate: (dossierId: string) => void;
  invalidateAll: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useTableauFinancementStore = create<TfState>((set, get) => ({
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
      const data = await fetchTableauFinancement(dossierId);
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
