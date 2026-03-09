import { create } from "zustand";
import { fetchSynthese, type SyntheseData } from "@/app/actions/controle/synthese";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SyntheseStatus = "idle" | "loading" | "success" | "error";

interface SyntheseCacheEntry {
  data: SyntheseData;
  fetchedAt: number;
}

interface SyntheseState {
  cache: Record<string, SyntheseCacheEntry>;
  status: Record<string, SyntheseStatus>;
  errors: Record<string, string>;

  getData: (dossierId: string) => SyntheseData | null;
  getStatus: (dossierId: string) => SyntheseStatus;
  getError: (dossierId: string) => string | null;

  fetch: (dossierId: string, force?: boolean) => Promise<void>;
  invalidate: (dossierId: string) => void;
  invalidateAll: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useSyntheseStore = create<SyntheseState>((set, get) => ({
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
      const data = await fetchSynthese(dossierId);
      set((s) => ({
        cache: { ...s.cache, [dossierId]: { data, fetchedAt: Date.now() } },
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
