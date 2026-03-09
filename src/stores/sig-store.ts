import { create } from "zustand";
import { fetchSig, type SigData } from "@/app/actions/controle/sig";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SigStatus = "idle" | "loading" | "success" | "error";

interface SigCacheEntry {
  data: SigData;
  fetchedAt: number;
}

interface SigState {
  cache: Record<string, SigCacheEntry>;
  status: Record<string, SigStatus>;
  errors: Record<string, string>;

  getData: (dossierId: string) => SigData | null;
  getStatus: (dossierId: string) => SigStatus;
  getError: (dossierId: string) => string | null;

  fetch: (dossierId: string, force?: boolean) => Promise<void>;
  invalidate: (dossierId: string) => void;
  invalidateAll: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useSigStore = create<SigState>((set, get) => ({
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
      const data = await fetchSig(dossierId);
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
