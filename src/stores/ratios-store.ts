import { create } from "zustand";
import { fetchRatios, type RatiosData } from "@/app/actions/controle/ratios";

// ── Types ─────────────────────────────────────────────────────────────────────

export type RatiosStatus = "idle" | "loading" | "success" | "error";

interface RatiosCacheEntry {
  data: RatiosData;
  fetchedAt: number;
}

interface RatiosState {
  cache: Record<string, RatiosCacheEntry>;
  status: Record<string, RatiosStatus>;
  errors: Record<string, string>;

  getData: (dossierId: string) => RatiosData | null;
  getStatus: (dossierId: string) => RatiosStatus;
  getError: (dossierId: string) => string | null;

  fetch: (dossierId: string, force?: boolean) => Promise<void>;
  invalidate: (dossierId: string) => void;
  invalidateAll: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useRatiosStore = create<RatiosState>((set, get) => ({
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
      const data = await fetchRatios(dossierId);
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

  invalidate: (dossierId) => {
    set((s) => {
      const cache = { ...s.cache };
      delete cache[dossierId];
      return { cache };
    });
  },

  invalidateAll: () => set({ cache: {} }),
}));
