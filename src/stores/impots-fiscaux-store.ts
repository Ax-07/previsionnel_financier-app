import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AjustementFiscalRow, ParametresISData } from "@/lib/schemas/impots-fiscaux";
import { defaultParametresIS } from "@/lib/schemas/impots-fiscaux";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ImpotssFiscauxDraft {
  reintegrations: AjustementFiscalRow[];
  deductions: AjustementFiscalRow[];
  parametresIS: ParametresISData;

  hasUnsavedReintegrations: boolean;
  hasUnsavedDeductions: boolean;
  hasUnsavedParametresIS: boolean;
}

export interface ImpotsFiscauxState {
  drafts: Record<string, ImpotssFiscauxDraft>;

  getDraft: (dossierId: string) => ImpotssFiscauxDraft;
  hasUnsavedChanges: (dossierId: string) => boolean;

  // ── Réintégrations ────────────────────────────────────────────────────────
  setReintegrations: (dossierId: string, rows: AjustementFiscalRow[]) => void;
  addReintegration: (dossierId: string) => void;
  updateReintegration: (dossierId: string, index: number, data: Partial<AjustementFiscalRow>) => void;
  removeReintegration: (dossierId: string, index: number) => void;
  duplicateReintegration: (dossierId: string, index: number) => void;
  markReintegrationsSaved: (dossierId: string) => void;

  // ── Déductions ────────────────────────────────────────────────────────────
  setDeductions: (dossierId: string, rows: AjustementFiscalRow[]) => void;
  addDeduction: (dossierId: string) => void;
  updateDeduction: (dossierId: string, index: number, data: Partial<AjustementFiscalRow>) => void;
  removeDeduction: (dossierId: string, index: number) => void;
  duplicateDeduction: (dossierId: string, index: number) => void;
  markDeductionsSaved: (dossierId: string) => void;

  // ── Paramètres IS ─────────────────────────────────────────────────────────
  setParametresIS: (dossierId: string, data: ParametresISData) => void;
  updateParametresIS: (dossierId: string, data: Partial<ParametresISData>) => void;
  markParametresISSaved: (dossierId: string) => void;

  // ── Reset ─────────────────────────────────────────────────────────────────
  clearDraft: (dossierId: string) => void;
}

// ── Valeur initiale d'un draft ────────────────────────────────────────────────

function emptyDraft(): ImpotssFiscauxDraft {
  return {
    reintegrations: [],
    deductions: [],
    parametresIS: { ...defaultParametresIS },
    hasUnsavedReintegrations: false,
    hasUnsavedDeductions: false,
    hasUnsavedParametresIS: false,
  };
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useImpotsFiscauxStore = create<ImpotsFiscauxState>()(
  persist(
    (set, get) => ({
      drafts: {},

      getDraft: (dossierId) => get().drafts[dossierId] ?? emptyDraft(),

      hasUnsavedChanges: (dossierId) => {
        const d = get().drafts[dossierId];
        if (!d) return false;
        return d.hasUnsavedReintegrations || d.hasUnsavedDeductions || d.hasUnsavedParametresIS;
      },

      // ── Réintégrations ─────────────────────────────────────────────────────
      setReintegrations: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: {
              ...(s.drafts[dossierId] ?? emptyDraft()),
              reintegrations: rows,
              hasUnsavedReintegrations: false,
            },
          },
        })),

      addReintegration: (dossierId) =>
        set((s) => {
          const draft = s.drafts[dossierId] ?? emptyDraft();
          const newRow: AjustementFiscalRow = {
            type: "REINTEGRATION",
            actif: true,
            libelle: "",
            montantN: 0,
            montantN1: 0,
            montantN2: 0,
          };
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: {
                ...draft,
                reintegrations: [...draft.reintegrations, newRow],
                hasUnsavedReintegrations: true,
              },
            },
          };
        }),

      updateReintegration: (dossierId, index, data) =>
        set((s) => {
          const draft = s.drafts[dossierId] ?? emptyDraft();
          const rows = draft.reintegrations.map((r, i) => (i === index ? { ...r, ...data } : r));
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...draft, reintegrations: rows, hasUnsavedReintegrations: true },
            },
          };
        }),

      removeReintegration: (dossierId, index) =>
        set((s) => {
          const draft = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: {
                ...draft,
                reintegrations: draft.reintegrations.filter((_, i) => i !== index),
                hasUnsavedReintegrations: true,
              },
            },
          };
        }),

      duplicateReintegration: (dossierId, index) =>
        set((s) => {
          const draft = s.drafts[dossierId] ?? emptyDraft();
          const source = draft.reintegrations[index];
          if (!source) return s;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...rest } = source;
          const clone = { ...rest, libelle: `${rest.libelle} (copie)` };
          const rows = [...draft.reintegrations];
          rows.splice(index + 1, 0, clone);
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...draft, reintegrations: rows, hasUnsavedReintegrations: true },
            },
          };
        }),

      markReintegrationsSaved: (dossierId) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: {
              ...(s.drafts[dossierId] ?? emptyDraft()),
              hasUnsavedReintegrations: false,
            },
          },
        })),

      // ── Déductions ─────────────────────────────────────────────────────────
      setDeductions: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: {
              ...(s.drafts[dossierId] ?? emptyDraft()),
              deductions: rows,
              hasUnsavedDeductions: false,
            },
          },
        })),

      addDeduction: (dossierId) =>
        set((s) => {
          const draft = s.drafts[dossierId] ?? emptyDraft();
          const newRow: AjustementFiscalRow = {
            type: "DEDUCTION",
            actif: true,
            libelle: "",
            montantN: 0,
            montantN1: 0,
            montantN2: 0,
          };
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: {
                ...draft,
                deductions: [...draft.deductions, newRow],
                hasUnsavedDeductions: true,
              },
            },
          };
        }),

      updateDeduction: (dossierId, index, data) =>
        set((s) => {
          const draft = s.drafts[dossierId] ?? emptyDraft();
          const rows = draft.deductions.map((r, i) => (i === index ? { ...r, ...data } : r));
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...draft, deductions: rows, hasUnsavedDeductions: true },
            },
          };
        }),

      removeDeduction: (dossierId, index) =>
        set((s) => {
          const draft = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: {
                ...draft,
                deductions: draft.deductions.filter((_, i) => i !== index),
                hasUnsavedDeductions: true,
              },
            },
          };
        }),

      duplicateDeduction: (dossierId, index) =>
        set((s) => {
          const draft = s.drafts[dossierId] ?? emptyDraft();
          const source = draft.deductions[index];
          if (!source) return s;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...rest } = source;
          const clone = { ...rest, libelle: `${rest.libelle} (copie)` };
          const rows = [...draft.deductions];
          rows.splice(index + 1, 0, clone);
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...draft, deductions: rows, hasUnsavedDeductions: true },
            },
          };
        }),

      markDeductionsSaved: (dossierId) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: {
              ...(s.drafts[dossierId] ?? emptyDraft()),
              hasUnsavedDeductions: false,
            },
          },
        })),

      // ── Paramètres IS ──────────────────────────────────────────────────────
      setParametresIS: (dossierId, data) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: {
              ...(s.drafts[dossierId] ?? emptyDraft()),
              parametresIS: data,
              hasUnsavedParametresIS: false,
            },
          },
        })),

      updateParametresIS: (dossierId, data) =>
        set((s) => {
          const draft = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: {
                ...draft,
                parametresIS: { ...draft.parametresIS, ...data },
                hasUnsavedParametresIS: true,
              },
            },
          };
        }),

      markParametresISSaved: (dossierId) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: {
              ...(s.drafts[dossierId] ?? emptyDraft()),
              hasUnsavedParametresIS: false,
            },
          },
        })),

      // ── Reset ──────────────────────────────────────────────────────────────
      clearDraft: (dossierId) =>
        set((s) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [dossierId]: _removed, ...rest } = s.drafts;
          return { drafts: rest };
        }),
    }),
    {
      name: "impots-fiscaux-drafts",
      // Ne persiste que les données modifiées (hasUnsaved*)
      partialize: (state) => ({
        drafts: Object.fromEntries(
          Object.entries(state.drafts).filter(
            ([, d]) =>
              d.hasUnsavedReintegrations ||
              d.hasUnsavedDeductions ||
              d.hasUnsavedParametresIS
          )
        ),
      }),
    }
  )
);
