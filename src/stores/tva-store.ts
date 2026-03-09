import { create } from "zustand";
import { fetchVAT, type VATData } from "@/app/actions/controle/tva";

// ── Types ─────────────────────────────────────────────────────────────────────

export type VATStatus = "idle" | "loading" | "success" | "error";

interface VATCacheEntry {
  data: VATData;
  fetchedAt: number;
}

interface VATState {
  cache: Record<string, VATCacheEntry>;
  status: Record<string, VATStatus>;
  errors: Record<string, string>;

  getData: (dossierId: string) => VATData | null;
  getStatus: (dossierId: string) => VATStatus;
  getError: (dossierId: string) => string | null;

  fetch: (dossierId: string, force?: boolean) => Promise<void>;
  invalidate: (dossierId: string) => void;
  invalidateAll: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useVATStore = create<VATState>((set, get) => ({
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
      const data = await fetchVAT(dossierId);
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
