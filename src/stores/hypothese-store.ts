import { create } from "zustand";
import type { HypotheseType } from "@/lib/schemas/hypothese";
import { HYPOTHESE_ACTIVE_DEFAULT } from "@/lib/schemas/hypothese";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HypotheseState {
  /** Hypothèse active par dossierId. */
  active: Record<string, HypotheseType>;

  /** Retourne l'hypothèse active pour un dossier (défaut: REALISTE). */
  getActive: (dossierId: string) => HypotheseType;

  /** Change l'hypothèse active pour un dossier. */
  setActive: (dossierId: string, hypothese: HypotheseType) => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useHypotheseStore = create<HypotheseState>((set, get) => ({
  active: {},

  getActive: (dossierId) =>
    get().active[dossierId] ?? HYPOTHESE_ACTIVE_DEFAULT,

  setActive: (dossierId, hypothese) =>
    set((s) => ({
      active: { ...s.active, [dossierId]: hypothese },
    })),
}));
