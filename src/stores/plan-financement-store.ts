import { create } from "zustand";
import {
  fetchPlanFinancement,
  type PfData,
} from "@/app/actions/controle/plan-financement";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PfStatus = "idle" | "loading" | "success" | "error";

interface PfCacheEntry {
  data: PfData;
  fetchedAt: number;
}

interface PfState {
  cache: Record<string, PfCacheEntry>;
  status: Record<string, PfStatus>;
  errors: Record<string, string>;

  getData: (dossierId: string) => PfData | null;
  getStatus: (dossierId: string) => PfStatus;
  getError: (dossierId: string) => string | null;

  fetch: (dossierId: string, force?: boolean) => Promise<void>;
  invalidate: (dossierId: string) => void;
  invalidateAll: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const usePlanFinancementStore = create<PfState>((set, get) => ({
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
      const data = await fetchPlanFinancement(dossierId);
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
