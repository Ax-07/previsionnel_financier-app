import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ActiviteRow,
  ActiviteCommissionRow,
  ProductionImmobiliseeRow,
  SubventionExploitationRow,
} from "@/lib/schemas/activite";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ActiviteDraft {
  // Lignes des 4 sections
  activites: ActiviteRow[];
  activitesCommissionnees: ActiviteCommissionRow[];
  productionsImmobilisees: ProductionImmobiliseeRow[];
  subventionsExploitation: SubventionExploitationRow[];

  // Tracking des modifications par section
  hasUnsavedActivites: boolean;
  hasUnsavedCommissions: boolean;
  hasUnsavedProductions: boolean;
  hasUnsavedSubventions: boolean;
}

export interface ActiviteState {
  // Drafts par dossier
  drafts: Record<string, ActiviteDraft>;

  // ── Getters ────────────────────────────────────────────────────────────────
  getDraft: (dossierId: string) => ActiviteDraft;
  hasUnsavedChanges: (dossierId: string) => boolean;

  // ── Setters Activités (Chiffre d'affaires) ────────────────────────────────
  setActivites: (dossierId: string, activites: ActiviteRow[]) => void;
  addActivite: (dossierId: string) => void;
  updateActivite: (dossierId: string, index: number, data: Partial<ActiviteRow>) => void;
  removeActivite: (dossierId: string, index: number) => void;
  duplicateActivite: (dossierId: string, index: number) => void;
  markActivitesSaved: (dossierId: string) => void;

  // ── Setters Activités commissionnées ───────────────────────────────────────
  setActivitesCommissionnees: (dossierId: string, rows: ActiviteCommissionRow[]) => void;
  addActiviteCommission: (dossierId: string) => void;
  updateActiviteCommission: (dossierId: string, index: number, data: Partial<ActiviteCommissionRow>) => void;
  removeActiviteCommission: (dossierId: string, index: number) => void;
  duplicateActiviteCommission: (dossierId: string, index: number) => void;
  markCommissionsSaved: (dossierId: string) => void;

  // ── Setters Productions immobilisées ───────────────────────────────────────
  setProductionsImmobilisees: (dossierId: string, rows: ProductionImmobiliseeRow[]) => void;
  addProductionImmobilisee: (dossierId: string) => void;
  updateProductionImmobilisee: (dossierId: string, index: number, data: Partial<ProductionImmobiliseeRow>) => void;
  removeProductionImmobilisee: (dossierId: string, index: number) => void;
  duplicateProductionImmobilisee: (dossierId: string, index: number) => void;
  markProductionsSaved: (dossierId: string) => void;

  // ── Setters Subventions d'exploitation ─────────────────────────────────────
  setSubventionsExploitation: (dossierId: string, rows: SubventionExploitationRow[]) => void;
  addSubventionExploitation: (dossierId: string) => void;
  updateSubventionExploitation: (dossierId: string, index: number, data: Partial<SubventionExploitationRow>) => void;
  removeSubventionExploitation: (dossierId: string, index: number) => void;
  duplicateSubventionExploitation: (dossierId: string, index: number) => void;
  markSubventionsSaved: (dossierId: string) => void;

  // ── Reset ──────────────────────────────────────────────────────────────────
  clearDraft: (dossierId: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function createEmptyActivite(): ActiviteRow {
  return {
    libelle: "",
    secteur: "PRODUCTION",
    hypothese: "COMMUNE",
    montantN: 0,
    evolutionN1: 0,
    montantN1: 0,
    evolutionN2: 0,
    montantN2: 0,
    tauxMarge: 0,
    stocks: 0,
    reglementClients: 30,
    tvaVentes: 20,
    reglementFournisseurs: 30,
    tvaAchats: 20,
    actif: true,
  };
}

function createEmptyCommission(): ActiviteCommissionRow {
  return {
    libelle: "",
    hypothese: "COMMUNE",
    montantN: 0,
    evolutionN1: 0,
    montantN1: 0,
    evolutionN2: 0,
    montantN2: 0,
    calculCommission: "HT",
    tauxCommission: 0,
    tvaCommission: 20,
    stocks: 0,
    reglementFournisseurs: 30,
    actif: true,
  };
}

function createEmptyProductionImmobilisee(): ProductionImmobiliseeRow {
  return {
    libelle: "",
    nature: "CORPOREL",
    hypothese: "COMMUNE",
    date: new Date().toISOString().split("T")[0],
    montant: 0,
    amortissement: "LINEAIRE",
    differe: 0,
    duree: 5,
    actif: true,
  };
}

function createEmptySubvention(): SubventionExploitationRow {
  return {
    libelle: "",
    hypothese: "COMMUNE",
    montantN: 0,
    montantN1: 0,
    montantN2: 0,
    tva: 0,
    typeTva: "NON_RECUPERABLE",
    actif: true,
  };
}

function getEmptyDraft(): ActiviteDraft {
  return {
    activites: [],
    activitesCommissionnees: [],
    productionsImmobilisees: [],
    subventionsExploitation: [],
    hasUnsavedActivites: false,
    hasUnsavedCommissions: false,
    hasUnsavedProductions: false,
    hasUnsavedSubventions: false,
  };
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useActiviteStore = create<ActiviteState>()(
  persist(
    (set, get) => ({
      drafts: {},

      // ── Getters ────────────────────────────────────────────────────────────
      getDraft: (dossierId) => {
        return get().drafts[dossierId] ?? getEmptyDraft();
      },

      hasUnsavedChanges: (dossierId) => {
        const draft = get().drafts[dossierId];
        if (!draft) return false;
        return (
          draft.hasUnsavedActivites ||
          draft.hasUnsavedCommissions ||
          draft.hasUnsavedProductions ||
          draft.hasUnsavedSubventions
        );
      },

      // ── Activités (Chiffre d'affaires) ─────────────────────────────────────
      setActivites: (dossierId, activites) => {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [dossierId]: {
              ...(state.drafts[dossierId] ?? getEmptyDraft()),
              activites,
              hasUnsavedActivites: false,
            },
          },
        }));
      },

      addActivite: (dossierId) => {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...draft,
                activites: [...draft.activites, createEmptyActivite()],
                hasUnsavedActivites: true,
              },
            },
          };
        });
      },

      updateActivite: (dossierId, index, data) => {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          const updated = [...draft.activites];
          updated[index] = { ...updated[index], ...data };
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...draft,
                activites: updated,
                hasUnsavedActivites: true,
              },
            },
          };
        });
      },

      removeActivite: (dossierId, index) => {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          const updated = draft.activites.filter((_, i) => i !== index);
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...draft,
                activites: updated,
                hasUnsavedActivites: true,
              },
            },
          };
        });
      },

      duplicateActivite: (dossierId, index) => {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          const source = draft.activites[index];
          if (!source) return state;
          const { id, ...rest } = source;
          const rows = [...draft.activites];
          rows.splice(index + 1, 0, { ...rest, libelle: `${rest.libelle} (copie)` });
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: { ...draft, activites: rows, hasUnsavedActivites: true },
            },
          };
        });
      },

      markActivitesSaved: (dossierId) => {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [dossierId]: {
              ...(state.drafts[dossierId] ?? getEmptyDraft()),
              hasUnsavedActivites: false,
            },
          },
        }));
      },

      // ── Activités commissionnées ───────────────────────────────────────────
      setActivitesCommissionnees: (dossierId, rows) => {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [dossierId]: {
              ...(state.drafts[dossierId] ?? getEmptyDraft()),
              activitesCommissionnees: rows,
              hasUnsavedCommissions: false,
            },
          },
        }));
      },

      addActiviteCommission: (dossierId) => {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...draft,
                activitesCommissionnees: [
                  ...draft.activitesCommissionnees,
                  createEmptyCommission(),
                ],
                hasUnsavedCommissions: true,
              },
            },
          };
        });
      },

      updateActiviteCommission: (dossierId, index, data) => {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          const updated = [...draft.activitesCommissionnees];
          updated[index] = { ...updated[index], ...data };
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...draft,
                activitesCommissionnees: updated,
                hasUnsavedCommissions: true,
              },
            },
          };
        });
      },

      removeActiviteCommission: (dossierId, index) => {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          const updated = draft.activitesCommissionnees.filter((_, i) => i !== index);
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...draft,
                activitesCommissionnees: updated,
                hasUnsavedCommissions: true,
              },
            },
          };
        });
      },

      duplicateActiviteCommission: (dossierId, index) => {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          const source = draft.activitesCommissionnees[index];
          if (!source) return state;
          const { id, ...rest } = source;
          const rows = [...draft.activitesCommissionnees];
          rows.splice(index + 1, 0, { ...rest, libelle: `${rest.libelle} (copie)` });
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: { ...draft, activitesCommissionnees: rows, hasUnsavedCommissions: true },
            },
          };
        });
      },

      markCommissionsSaved: (dossierId) => {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [dossierId]: {
              ...(state.drafts[dossierId] ?? getEmptyDraft()),
              hasUnsavedCommissions: false,
            },
          },
        }));
      },

      // ── Productions immobilisées ───────────────────────────────────────────
      setProductionsImmobilisees: (dossierId, rows) => {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [dossierId]: {
              ...(state.drafts[dossierId] ?? getEmptyDraft()),
              productionsImmobilisees: rows,
              hasUnsavedProductions: false,
            },
          },
        }));
      },

      addProductionImmobilisee: (dossierId) => {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...draft,
                productionsImmobilisees: [
                  ...draft.productionsImmobilisees,
                  createEmptyProductionImmobilisee(),
                ],
                hasUnsavedProductions: true,
              },
            },
          };
        });
      },

      updateProductionImmobilisee: (dossierId, index, data) => {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          const updated = [...draft.productionsImmobilisees];
          updated[index] = { ...updated[index], ...data };
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...draft,
                productionsImmobilisees: updated,
                hasUnsavedProductions: true,
              },
            },
          };
        });
      },

      removeProductionImmobilisee: (dossierId, index) => {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          const updated = draft.productionsImmobilisees.filter((_, i) => i !== index);
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...draft,
                productionsImmobilisees: updated,
                hasUnsavedProductions: true,
              },
            },
          };
        });
      },

      duplicateProductionImmobilisee: (dossierId, index) => {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          const source = draft.productionsImmobilisees[index];
          if (!source) return state;
          const { id, ...rest } = source;
          const rows = [...draft.productionsImmobilisees];
          rows.splice(index + 1, 0, { ...rest, libelle: `${rest.libelle} (copie)` });
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: { ...draft, productionsImmobilisees: rows, hasUnsavedProductions: true },
            },
          };
        });
      },

      markProductionsSaved: (dossierId) => {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [dossierId]: {
              ...(state.drafts[dossierId] ?? getEmptyDraft()),
              hasUnsavedProductions: false,
            },
          },
        }));
      },

      // ── Subventions d'exploitation ─────────────────────────────────────────
      setSubventionsExploitation: (dossierId, rows) => {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [dossierId]: {
              ...(state.drafts[dossierId] ?? getEmptyDraft()),
              subventionsExploitation: rows,
              hasUnsavedSubventions: false,
            },
          },
        }));
      },

      addSubventionExploitation: (dossierId) => {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...draft,
                subventionsExploitation: [
                  ...draft.subventionsExploitation,
                  createEmptySubvention(),
                ],
                hasUnsavedSubventions: true,
              },
            },
          };
        });
      },

      updateSubventionExploitation: (dossierId, index, data) => {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          const updated = [...draft.subventionsExploitation];
          updated[index] = { ...updated[index], ...data };
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...draft,
                subventionsExploitation: updated,
                hasUnsavedSubventions: true,
              },
            },
          };
        });
      },

      removeSubventionExploitation: (dossierId, index) => {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          const updated = draft.subventionsExploitation.filter((_, i) => i !== index);
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...draft,
                subventionsExploitation: updated,
                hasUnsavedSubventions: true,
              },
            },
          };
        });
      },

      duplicateSubventionExploitation: (dossierId, index) => {
        set((state) => {
          const draft = state.drafts[dossierId] ?? getEmptyDraft();
          const source = draft.subventionsExploitation[index];
          if (!source) return state;
          const { id, ...rest } = source;
          const rows = [...draft.subventionsExploitation];
          rows.splice(index + 1, 0, { ...rest, libelle: `${rest.libelle} (copie)` });
          return {
            drafts: {
              ...state.drafts,
              [dossierId]: { ...draft, subventionsExploitation: rows, hasUnsavedSubventions: true },
            },
          };
        });
      },

      markSubventionsSaved: (dossierId) => {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [dossierId]: {
              ...(state.drafts[dossierId] ?? getEmptyDraft()),
              hasUnsavedSubventions: false,
            },
          },
        }));
      },

      // ── Reset ──────────────────────────────────────────────────────────────
      clearDraft: (dossierId) => {
        set((state) => {
          const { [dossierId]: _, ...rest } = state.drafts;
          return { drafts: rest };
        });
      },
    }),
    {
      name: "activite-storage",
      partialize: (state) => ({ drafts: state.drafts }),
    }
  )
);
