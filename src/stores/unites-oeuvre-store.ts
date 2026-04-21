import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UniteDOeuvreRow } from "@/lib/schemas/unites-oeuvre";

// ── Types ────────────────────────────────────────────────────────────────────

export interface UnitesDOeuvreDraft {
  unites: UniteDOeuvreRow[];
  hasUnsaved: boolean;
}

export interface UnitesDOeuvreState {
  drafts: Record<string, UnitesDOeuvreDraft>;

  getDraft: (dossierId: string) => UnitesDOeuvreDraft;
  hasUnsavedChanges: (dossierId: string) => boolean;

  setUnites: (dossierId: string, rows: UniteDOeuvreRow[]) => void;
  addUnite: (dossierId: string) => void;
  updateUnite: (dossierId: string, index: number, data: Partial<UniteDOeuvreRow>) => void;
  removeUnite: (dossierId: string, index: number) => void;
  duplicateUnite: (dossierId: string, index: number) => void;
  markSaved: (dossierId: string, rows: UniteDOeuvreRow[]) => void;
  clearDraft: (dossierId: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function emptyExercice() {
  return {
    indicateurBase: 0,
    partPct: 0,
    chiffreAffaires: 0,
    nbJours: 365,
    parJour: 0,
    prixMoyen: 0,
    quantite: 0,
  };
}

function emptyUnite(ordre = 0): UniteDOeuvreRow {
  return {
    actif: true,
    hypothese: "COMMUNE",
    libelle: "",
    typeUnite: "COUVERT",
    typeIndicateur: "CHIFFRE_AFFAIRES",
    typeDuree: "JOURS_AN",
    ordre,
    n: emptyExercice(),
    n1: emptyExercice(),
    n2: emptyExercice(),
  };
}

function getEmptyDraft(): UnitesDOeuvreDraft {
  return { unites: [], hasUnsaved: false };
}

function patchDraft(
  state: UnitesDOeuvreState,
  dossierId: string,
  patch: Partial<UnitesDOeuvreDraft>
): Pick<UnitesDOeuvreState, "drafts"> {
  return {
    drafts: {
      ...state.drafts,
      [dossierId]: { ...(state.drafts[dossierId] ?? getEmptyDraft()), ...patch },
    },
  };
}

function updateRow(rows: UniteDOeuvreRow[], index: number, data: Partial<UniteDOeuvreRow>): UniteDOeuvreRow[] {
  const copy = [...rows];
  if (copy[index] !== undefined) copy[index] = { ...copy[index]!, ...data };
  return copy;
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useUnitesDOeuvreStore = create<UnitesDOeuvreState>()(
  persist(
    (set, get) => ({
      drafts: {},

      getDraft(dossierId) {
        return get().drafts[dossierId] ?? getEmptyDraft();
      },

      hasUnsavedChanges(dossierId) {
        return get().drafts[dossierId]?.hasUnsaved ?? false;
      },

      setUnites(dossierId, rows) {
        set((s) => patchDraft(s, dossierId, { unites: rows, hasUnsaved: false }));
      },

      addUnite(dossierId) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            unites: [...d.unites, emptyUnite(d.unites.length)],
            hasUnsaved: true,
          });
        });
      },

      updateUnite(dossierId, index, data) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            unites: updateRow(d.unites, index, data),
            hasUnsaved: true,
          });
        });
      },

      removeUnite(dossierId, index) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            unites: d.unites.filter((_, i) => i !== index),
            hasUnsaved: true,
          });
        });
      },

      duplicateUnite(dossierId, index) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          const source = d.unites[index];
          if (!source) return s;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...rest } = source;
          const clone = { ...rest, libelle: `${rest.libelle} (copie)` };
          const rows = [...d.unites];
          rows.splice(index + 1, 0, clone);
          return patchDraft(s, dossierId, { unites: rows, hasUnsaved: true });
        });
      },

      markSaved(dossierId, rows) {
        set((s) => patchDraft(s, dossierId, { unites: rows, hasUnsaved: false }));
      },

      clearDraft(dossierId) {
        set((s) => {
          const drafts = { ...s.drafts };
          delete drafts[dossierId];
          return { drafts };
        });
      },
    }),
    {
      name: "unites-d-oeuvre-store",
      partialize: (state) => ({ drafts: state.drafts }),
    }
  )
);
