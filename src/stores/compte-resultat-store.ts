import { create } from "zustand";
import { fetchCompteResultat, type CompteResultatData } from "@/app/actions/controle/compte-resultat";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CRStatus = "idle" | "loading" | "success" | "error";

export interface CRCacheEntry {
  data: CompteResultatData;
  fetchedAt: number; // timestamp ms
}

export interface CRError {
  message: string;
}

export interface CompteResultatState {
  /** Données mises en cache par dossierId */
  cache: Record<string, CRCacheEntry>;
  /** Statut de chargement par dossierId */
  status: Record<string, CRStatus>;
  /** Erreurs par dossierId */
  errors: Record<string, string>;

  // ── Sélecteurs ──────────────────────────────────────────────────────────────
  getData: (dossierId: string) => CompteResultatData | null;
  getStatus: (dossierId: string) => CRStatus;
  getError: (dossierId: string) => string | null;

  // ── Actions ──────────────────────────────────────────────────────────────────
  /**
   * Charge les données si absentes du cache.
   * Passe `force: true` pour ignorer le cache (équivaut à Actualiser).
   */
  fetch: (dossierId: string, force?: boolean) => Promise<void>;

  /** Invalide le cache pour un dossier (prochain appel à fetch re-téléchargera). */
  invalidate: (dossierId: string) => void;

  /** Invalide tous les caches (ex: changement global). */
  invalidateAll: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useCompteResultatStore = create<CompteResultatState>((set, get) => ({
  cache: {},
  status: {},
  errors: {},

  // ── Sélecteurs ───────────────────────────────────────────────────────────────

  getData: (dossierId) => get().cache[dossierId]?.data ?? null,

  getStatus: (dossierId) => get().status[dossierId] ?? "idle",

  getError: (dossierId) => get().errors[dossierId] ?? null,

  // ── Actions ───────────────────────────────────────────────────────────────────

  fetch: async (dossierId, force = false) => {
    const { cache, status } = get();

    // Ne pas re-déclencher si déjà en cours
    if (status[dossierId] === "loading") return;

    // Utiliser le cache si présent et non forcé
    if (!force && cache[dossierId]) return;

    // Marquer comme en chargement
    set((s) => ({
      status: { ...s.status, [dossierId]: "loading" },
      errors: { ...s.errors, [dossierId]: "" },
    }));

    try {
      const data = await fetchCompteResultat(dossierId);
      set((s) => ({
        cache: {
          ...s.cache,
          [dossierId]: { data, fetchedAt: Date.now() },
        },
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
    set({ cache: {}, status: {}, errors: {} });
  },
}));
