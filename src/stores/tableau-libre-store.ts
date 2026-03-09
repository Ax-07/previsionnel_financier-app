import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type TableauLibreRow,
  type TableauLibreLigneRow,
  type DetailMensuelRow,
  emptyTableau,
  emptyLigne,
} from "@/lib/schemas/tableau-libre";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TableauxLibresDraft {
  tableaux: TableauLibreRow[];
  hasUnsaved: boolean;
}

export interface TableauxLibresState {
  drafts: Record<string, TableauxLibresDraft>;

  getDraft: (dossierId: string) => TableauxLibresDraft;
  hasUnsavedChanges: (dossierId: string) => boolean;

  setTableaux: (dossierId: string, rows: TableauLibreRow[]) => void;
  addTableau: (dossierId: string) => void;
  updateTableau: (dossierId: string, index: number, data: Partial<TableauLibreRow>) => void;
  removeTableau: (dossierId: string, index: number) => void;

  addLigne: (dossierId: string, tableauIndex: number) => void;
  updateLigne: (
    dossierId: string,
    tableauIndex: number,
    ligneIndex: number,
    data: Partial<TableauLibreLigneRow>
  ) => void;
  removeLigne: (dossierId: string, tableauIndex: number, ligneIndex: number) => void;
  setDetails: (
    dossierId: string,
    tableauIndex: number,
    ligneIndex: number,
    details: DetailMensuelRow[]
  ) => void;

  markSaved: (dossierId: string, rows: TableauLibreRow[]) => void;
  clearDraft: (dossierId: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getEmptyDraft(): TableauxLibresDraft {
  return { tableaux: [], hasUnsaved: false };
}

function patchDraft(
  state: TableauxLibresState,
  dossierId: string,
  patch: Partial<TableauxLibresDraft>
): Pick<TableauxLibresState, "drafts"> {
  return {
    drafts: {
      ...state.drafts,
      [dossierId]: { ...(state.drafts[dossierId] ?? getEmptyDraft()), ...patch },
    },
  };
}

function updateTableauAt(
  tableaux: TableauLibreRow[],
  index: number,
  updater: (t: TableauLibreRow) => TableauLibreRow
): TableauLibreRow[] {
  const copy = [...tableaux];
  if (copy[index] !== undefined) copy[index] = updater(copy[index]!);
  return copy;
}

function updateLigneAt(
  lignes: TableauLibreLigneRow[],
  index: number,
  data: Partial<TableauLibreLigneRow>
): TableauLibreLigneRow[] {
  const copy = [...lignes];
  if (copy[index] !== undefined) copy[index] = { ...copy[index]!, ...data };
  return copy;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useTableauxLibresStore = create<TableauxLibresState>()(
  persist(
    (set, get) => ({
      drafts: {},

      getDraft(dossierId) {
        return get().drafts[dossierId] ?? getEmptyDraft();
      },

      hasUnsavedChanges(dossierId) {
        return get().drafts[dossierId]?.hasUnsaved ?? false;
      },

      setTableaux(dossierId, rows) {
        set((state) => {
          const current = state.drafts[dossierId];
          // Guard : ne pas écraser un brouillon non sauvegardé
          if (current?.hasUnsaved) return state;
          return patchDraft(state, dossierId, { tableaux: rows, hasUnsaved: false });
        });
      },

      addTableau(dossierId) {
        set((state) => {
          const current = state.drafts[dossierId] ?? getEmptyDraft();
          const newTableau = emptyTableau(current.tableaux.length);
          return patchDraft(state, dossierId, {
            tableaux: [...current.tableaux, newTableau],
            hasUnsaved: true,
          });
        });
      },

      updateTableau(dossierId, index, data) {
        set((state) => {
          const current = state.drafts[dossierId] ?? getEmptyDraft();
          const updated = updateTableauAt(current.tableaux, index, (t) => ({ ...t, ...data }));
          return patchDraft(state, dossierId, { tableaux: updated, hasUnsaved: true });
        });
      },

      removeTableau(dossierId, index) {
        set((state) => {
          const current = state.drafts[dossierId] ?? getEmptyDraft();
          const updated = current.tableaux.filter((_, i) => i !== index);
          return patchDraft(state, dossierId, { tableaux: updated, hasUnsaved: true });
        });
      },

      addLigne(dossierId, tableauIndex) {
        set((state) => {
          const current = state.drafts[dossierId] ?? getEmptyDraft();
          const updated = updateTableauAt(current.tableaux, tableauIndex, (t) => ({
            ...t,
            lignes: [...t.lignes, emptyLigne(t.lignes.length)],
          }));
          return patchDraft(state, dossierId, { tableaux: updated, hasUnsaved: true });
        });
      },

      updateLigne(dossierId, tableauIndex, ligneIndex, data) {
        set((state) => {
          const current = state.drafts[dossierId] ?? getEmptyDraft();
          const updated = updateTableauAt(current.tableaux, tableauIndex, (t) => ({
            ...t,
            lignes: updateLigneAt(t.lignes, ligneIndex, data),
          }));
          return patchDraft(state, dossierId, { tableaux: updated, hasUnsaved: true });
        });
      },

      removeLigne(dossierId, tableauIndex, ligneIndex) {
        set((state) => {
          const current = state.drafts[dossierId] ?? getEmptyDraft();
          const updated = updateTableauAt(current.tableaux, tableauIndex, (t) => ({
            ...t,
            lignes: t.lignes.filter((_, i) => i !== ligneIndex),
          }));
          return patchDraft(state, dossierId, { tableaux: updated, hasUnsaved: true });
        });
      },

      setDetails(dossierId, tableauIndex, ligneIndex, details) {
        set((state) => {
          const current = state.drafts[dossierId] ?? getEmptyDraft();
          const updated = updateTableauAt(current.tableaux, tableauIndex, (t) => ({
            ...t,
            lignes: updateLigneAt(t.lignes, ligneIndex, { details }),
          }));
          return patchDraft(state, dossierId, { tableaux: updated, hasUnsaved: true });
        });
      },

      markSaved(dossierId, rows) {
        set((state) =>
          patchDraft(state, dossierId, { tableaux: rows, hasUnsaved: false })
        );
      },

      clearDraft(dossierId) {
        set((state) => {
          const drafts = { ...state.drafts };
          delete drafts[dossierId];
          return { drafts };
        });
      },
    }),
    {
      name: "tableaux-libres-store",
      partialize: (state) => ({ drafts: state.drafts }),
    }
  )
);
