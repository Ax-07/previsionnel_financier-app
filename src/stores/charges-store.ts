import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChargeExploitationRow, ImpotTaxeRow } from "@/lib/schemas/charges";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ChargesDraft {
  // Lignes des 3 sections
  fournitures: ChargeExploitationRow[];
  services: ChargeExploitationRow[];
  impots: ImpotTaxeRow[];

  // Tracking des modifications par section
  hasUnsavedFournitures: boolean;
  hasUnsavedServices: boolean;
  hasUnsavedImpots: boolean;
}

export interface ChargesState {
  // Drafts par dossier
  drafts: Record<string, ChargesDraft>;

  // Indique si le store a été réhydraté depuis localStorage
  _hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;

  // ── Getters ────────────────────────────────────────────────────────────────
  getDraft: (dossierId: string) => ChargesDraft;
  hasUnsavedChanges: (dossierId: string) => boolean;

  // ── Setters Fournitures consommables ───────────────────────────────────────
  setFournitures: (dossierId: string, rows: ChargeExploitationRow[]) => void;
  addFourniture: (dossierId: string) => void;
  updateFourniture: (dossierId: string, index: number, data: Partial<ChargeExploitationRow>) => void;
  removeFourniture: (dossierId: string, index: number) => void;
  markFournituresSaved: (dossierId: string) => void;

  // ── Setters Services extérieurs ────────────────────────────────────────────
  setServices: (dossierId: string, rows: ChargeExploitationRow[]) => void;
  addService: (dossierId: string) => void;
  updateService: (dossierId: string, index: number, data: Partial<ChargeExploitationRow>) => void;
  removeService: (dossierId: string, index: number) => void;
  markServicesSaved: (dossierId: string) => void;

  // ── Setters Impôts et taxes ────────────────────────────────────────────────
  setImpots: (dossierId: string, rows: ImpotTaxeRow[]) => void;
  addImpot: (dossierId: string) => void;
  updateImpot: (dossierId: string, index: number, data: Partial<ImpotTaxeRow>) => void;
  removeImpot: (dossierId: string, index: number) => void;
  markImpotsSaved: (dossierId: string) => void;

  // ── Reset ──────────────────────────────────────────────────────────────────
  clearDraft: (dossierId: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function createEmptyFourniture(): ChargeExploitationRow {
  return {
    libelle: "",
    categorie: "FOURNITURE_CONSOMMABLE",
    actif: true,
    hypothese: "normale",
    montantN: 0,
    evolutionN1: 0,
    montantN1: 0,
    evolutionN2: 0,
    montantN2: 0,
    tauxFixe: 0,
    frequence: "MENSUELLE",
    delaiReglement: 30,
    tauxTVA: 20,
    typeTVA: "FACTURATION",
  };
}

function createEmptyService(): ChargeExploitationRow {
  return {
    libelle: "",
    categorie: "SERVICE_EXTERIEUR",
    actif: true,
    hypothese: "normale",
    montantN: 0,
    evolutionN1: 0,
    montantN1: 0,
    evolutionN2: 0,
    montantN2: 0,
    tauxFixe: 0,
    frequence: "MENSUELLE",
    delaiReglement: 30,
    tauxTVA: 20,
    typeTVA: "FACTURATION",
  };
}

function createEmptyImpot(): ImpotTaxeRow {
  return {
    libelle: "",
    actif: true,
    hypothese: "normale",
    isCFE: false,
    cfeModeCalc: false,
    dateN: "",
    montantN: 0,
    dateN1: "",
    montantN1: 0,
    dateN2: "",
    montantN2: 0,
  };
}

function getEmptyDraft(): ChargesDraft {
  return {
    fournitures: [],
    services: [],
    impots: [],
    hasUnsavedFournitures: false,
    hasUnsavedServices: false,
    hasUnsavedImpots: false,
  };
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useChargesStore = create<ChargesState>()(
  persist(
    (set, get) => ({
      drafts: {},

      _hasHydrated: false,
      setHasHydrated(val) {
        set({ _hasHydrated: val });
      },

      getDraft(dossierId) {
        return get().drafts[dossierId] ?? getEmptyDraft();
      },

      hasUnsavedChanges(dossierId) {
        const d = get().drafts[dossierId];
        if (!d) return false;
        return d.hasUnsavedFournitures || d.hasUnsavedServices || d.hasUnsavedImpots;
      },

      // ── Fournitures ──────────────────────────────────────────────────────

      setFournitures(dossierId, rows) {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [dossierId]: {
              ...(state.drafts[dossierId] ?? getEmptyDraft()),
              fournitures: rows,
              hasUnsavedFournitures: false,
            },
          },
        }));
      },

      addFourniture(dossierId) {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...draft,
                fournitures: [...draft.fournitures, createEmptyFourniture()],
                hasUnsavedFournitures: true,
              },
            },
          };
        });
      },

      updateFourniture(dossierId, index, data) {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          const rows = [...draft.fournitures];
          const row = rows[index];
          if (!row) return state;
          // Auto-calcul N+1 et N+2 si montantN ou évolution change
          const merged = { ...row, ...data };
          if ("montantN" in data || "evolutionN1" in data) {
            merged.montantN1 = parseFloat(
              (merged.montantN * (1 + merged.evolutionN1 / 100)).toFixed(2)
            );
          }
          if ("montantN1" in data || "evolutionN2" in data || "montantN" in data || "evolutionN1" in data) {
            merged.montantN2 = parseFloat(
              (merged.montantN1 * (1 + merged.evolutionN2 / 100)).toFixed(2)
            );
          }
          rows[index] = merged;
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: { ...draft, fournitures: rows, hasUnsavedFournitures: true },
            },
          };
        });
      },

      removeFourniture(dossierId, index) {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          const rows = draft.fournitures.filter((_, i) => i !== index);
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: { ...draft, fournitures: rows, hasUnsavedFournitures: true },
            },
          };
        });
      },

      markFournituresSaved(dossierId) {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [dossierId]: {
              ...(state.drafts[dossierId] ?? getEmptyDraft()),
              hasUnsavedFournitures: false,
            },
          },
        }));
      },

      // ── Services extérieurs ──────────────────────────────────────────────

      setServices(dossierId, rows) {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [dossierId]: {
              ...(state.drafts[dossierId] ?? getEmptyDraft()),
              services: rows,
              hasUnsavedServices: false,
            },
          },
        }));
      },

      addService(dossierId) {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...draft,
                services: [...draft.services, createEmptyService()],
                hasUnsavedServices: true,
              },
            },
          };
        });
      },

      updateService(dossierId, index, data) {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          const rows = [...draft.services];
          const row = rows[index];
          if (!row) return state;
          const merged = { ...row, ...data };
          if ("montantN" in data || "evolutionN1" in data) {
            merged.montantN1 = parseFloat(
              (merged.montantN * (1 + merged.evolutionN1 / 100)).toFixed(2)
            );
          }
          if ("montantN1" in data || "evolutionN2" in data || "montantN" in data || "evolutionN1" in data) {
            merged.montantN2 = parseFloat(
              (merged.montantN1 * (1 + merged.evolutionN2 / 100)).toFixed(2)
            );
          }
          rows[index] = merged;
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: { ...draft, services: rows, hasUnsavedServices: true },
            },
          };
        });
      },

      removeService(dossierId, index) {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          const rows = draft.services.filter((_, i) => i !== index);
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: { ...draft, services: rows, hasUnsavedServices: true },
            },
          };
        });
      },

      markServicesSaved(dossierId) {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [dossierId]: {
              ...(state.drafts[dossierId] ?? getEmptyDraft()),
              hasUnsavedServices: false,
            },
          },
        }));
      },

      // ── Impôts et taxes ──────────────────────────────────────────────────

      setImpots(dossierId, rows) {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [dossierId]: {
              ...(state.drafts[dossierId] ?? getEmptyDraft()),
              impots: rows,
              hasUnsavedImpots: false,
            },
          },
        }));
      },

      addImpot(dossierId) {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...draft,
                impots: [...draft.impots, createEmptyImpot()],
                hasUnsavedImpots: true,
              },
            },
          };
        });
      },

      updateImpot(dossierId, index, data) {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          const rows = [...draft.impots];
          const row = rows[index];
          if (!row) return state;
          rows[index] = { ...row, ...data };
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: { ...draft, impots: rows, hasUnsavedImpots: true },
            },
          };
        });
      },

      removeImpot(dossierId, index) {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          const rows = draft.impots.filter((_, i) => i !== index);
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: { ...draft, impots: rows, hasUnsavedImpots: true },
            },
          };
        });
      },

      markImpotsSaved(dossierId) {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [dossierId]: {
              ...(state.drafts[dossierId] ?? getEmptyDraft()),
              hasUnsavedImpots: false,
            },
          },
        }));
      },

      // ── Reset ────────────────────────────────────────────────────────────

      clearDraft(dossierId) {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [dossierId]: _, ...rest } = state.drafts;
          return { drafts: rest };
        });
      },
    }),
    {
      name: "charges-store",
      partialize: (state) => ({ drafts: state.drafts }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
