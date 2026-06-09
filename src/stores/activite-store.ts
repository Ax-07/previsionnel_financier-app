import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import type {
  ActiviteRow,
  ActiviteCommissionRow,
  ProductionImmobiliseeRow,
  SubventionExploitationRow,
} from "@/lib/schemas/activite";
import { tempId } from "@/components/app/forms/helpers/table-helpers";

// ── Types ────────────────────────────────────────────────────────────────────

export type LocalActiviteRow = ActiviteRow & { _dirty?: boolean };
export type LocalActiviteCommissionRow = ActiviteCommissionRow & { _dirty?: boolean };
export type LocalProductionImmobiliseeRow = ProductionImmobiliseeRow & { _dirty?: boolean };
export type LocalSubventionExploitationRow = SubventionExploitationRow & { _dirty?: boolean };

export interface ActiviteDraft {
  activites: LocalActiviteRow[];
  activitesCommissionnees: LocalActiviteCommissionRow[];
  productionsImmobilisees: LocalProductionImmobiliseeRow[];
  subventionsExploitation: LocalSubventionExploitationRow[];
  _deletedActiviteIds?: string[];
  _deletedCommissionIds?: string[];
  _deletedProductionIds?: string[];
  _deletedSubventionIds?: string[];
}

interface ActiviteState {
  drafts: Record<string, ActiviteDraft>;
}

interface ActiviteActions {
  // ── Getters ────────────────────────────────────────────────────────────────
  getDraft: (dossierId: string) => ActiviteDraft;
  hasUnsavedChanges: (dossierId: string) => boolean;

  // ── Hydratation depuis le serveur (avec garde draft local) ─────────────────
  hydrateActivites: (dossierId: string, rows: LocalActiviteRow[]) => void;
  hydrateCommissions: (dossierId: string, rows: LocalActiviteCommissionRow[]) => void;
  hydrateProductions: (dossierId: string, rows: LocalProductionImmobiliseeRow[]) => void;
  hydrateSubventions: (dossierId: string, rows: LocalSubventionExploitationRow[]) => void;

  // ── Setters updater (même API que useState — utilisés pour patcher les IDs post-save) ────
  setActivites: (dossierId: string, updater: (prev: LocalActiviteRow[]) => LocalActiviteRow[]) => void;
  setCommissions: (dossierId: string, updater: (prev: LocalActiviteCommissionRow[]) => LocalActiviteCommissionRow[]) => void;
  setProductions: (dossierId: string, updater: (prev: LocalProductionImmobiliseeRow[]) => LocalProductionImmobiliseeRow[]) => void;
  setSubventions: (dossierId: string, updater: (prev: LocalSubventionExploitationRow[]) => LocalSubventionExploitationRow[]) => void;

  // ── Setters batch pour DnD (marque _dirty=true sur chaque ligne) ───────────
  setActivitesRows: (dossierId: string, rows: LocalActiviteRow[]) => void;
  setCommissionsRows: (dossierId: string, rows: LocalActiviteCommissionRow[]) => void;
  setProductionsRows: (dossierId: string, rows: LocalProductionImmobiliseeRow[]) => void;
  setSubventionsRows: (dossierId: string, rows: LocalSubventionExploitationRow[]) => void;

  // ── Mutations Activités (Chiffre d'affaires) ──────────────────────────────
  addActiviteRow: (dossierId: string) => void;
  updateActiviteRow: (dossierId: string, index: number, data: Partial<ActiviteRow>) => void;
  removeActiviteRow: (dossierId: string, index: number) => void;
  duplicateActiviteRow: (dossierId: string, index: number) => void;
  markActivitesSaved: (dossierId: string) => void;
  addActiviteGroup: (dossierId: string) => void;
  addActiviteToGroup: (dossierId: string, groupe: string) => void;

  // ── Mutations Activités commissionnées ─────────────────────────────────────
  addActiviteCommissionRow: (dossierId: string) => void;
  updateActiviteCommissionRow: (dossierId: string, index: number, data: Partial<ActiviteCommissionRow>) => void;
  removeActiviteCommissionRow: (dossierId: string, index: number) => void;
  duplicateActiviteCommissionRow: (dossierId: string, index: number) => void;
  markCommissionsSaved: (dossierId: string) => void;
  addActiviteCommissionGroup: (dossierId: string) => void;
  addActiviteCommissionToGroup: (dossierId: string, groupe: string) => void;

  // ── Mutations Productions immobilisées ─────────────────────────────────────
  addProductionImmobiliseeRow: (dossierId: string) => void;
  updateProductionImmobiliseeRow: (dossierId: string, index: number, data: Partial<ProductionImmobiliseeRow>) => void;
  removeProductionImmobiliseeRow: (dossierId: string, index: number) => void;
  duplicateProductionImmobiliseeRow: (dossierId: string, index: number) => void;
  markProductionsSaved: (dossierId: string) => void;
  addProductionImmobiliseeGroup: (dossierId: string) => void;
  addProductionImmobiliseeToGroup: (dossierId: string, groupe: string) => void;

  // ── Mutations Subventions d'exploitation ───────────────────────────────────
  addSubventionExploitationRow: (dossierId: string) => void;
  updateSubventionExploitationRow: (dossierId: string, index: number, data: Partial<SubventionExploitationRow>) => void;
  removeSubventionExploitationRow: (dossierId: string, index: number) => void;
  duplicateSubventionExploitationRow: (dossierId: string, index: number) => void;
  markSubventionsSaved: (dossierId: string) => void;
  addSubventionExploitationGroup: (dossierId: string) => void;
  addSubventionExploitationToGroup: (dossierId: string, groupe: string) => void;

  // ── Reset ──────────────────────────────────────────────────────────────────
  clearDraft: (dossierId: string) => void;
  /** Alias de clearDraft, pour fermeture de dossier */
  clearDossier: (dossierId: string) => void;
}

export type ActiviteStore = ActiviteState & ActiviteActions;

// ── Helpers ──────────────────────────────────────────────────────────────────

function emptyActiviteRow(groupe?: string): LocalActiviteRow {
  return {
    id: tempId(),
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
    _dirty: true,
    ...(groupe !== undefined ? { groupe } : {}),
  };
}

function emptyCommissionRow(groupe?: string): LocalActiviteCommissionRow {
  return {
    id: tempId(),
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
    _dirty: true,
    ...(groupe !== undefined ? { groupe } : {}),
  };
}

function emptyProductionImmobiliseeRow(groupe?: string): LocalProductionImmobiliseeRow {
  return {
    id: tempId(),
    libelle: "",
    nature: "CORPOREL",
    hypothese: "COMMUNE",
    date: new Date().toISOString().split("T")[0],
    montant: 0,
    amortissement: "LINEAIRE",
    differe: 0,
    duree: 5,
    actif: true,
    _dirty: true,
    ...(groupe !== undefined ? { groupe } : {}),
  };
}

function emptySubventionRow(groupe?: string): LocalSubventionExploitationRow {
  return {
    id: tempId(),
    libelle: "",
    hypothese: "COMMUNE",
    dateN: "",
    montantN: 0,
    dateN1: "",
    montantN1: 0,
    dateN2: "",
    montantN2: 0,
    tva: 0,
    typeTva: "NON_RECUPERABLE",
    actif: true,
    _dirty: true,
    ...(groupe !== undefined ? { groupe } : {}),
  };
}

function getEmptyDraft(): ActiviteDraft {
  return {
    activites: [],
    activitesCommissionnees: [],
    productionsImmobilisees: [],
    subventionsExploitation: [],
  };
}

/** Référence stable pour getDraft() quand aucun draft n'existe. */
const EMPTY_ACTIVITE_DRAFT: ActiviteDraft = getEmptyDraft();
const INITIAL_STATE: ActiviteState = { drafts: {} };
const createNewGroup = (n: number) => `Groupe ${n}`;

/**
 * Fusionne les données serveur avec le draft local.
 * - Exclut les lignes dont l'ID est dans `deletedIds` (suppression pendante)
 * - Préserve les lignes `_dirty` avec ID persisté (éditions en cours)
 * - Conserve les nouvelles lignes `__new__` non encore sauvegardées
 */
function mergeRows<T extends { id?: string | null; _dirty?: boolean }>(
  serverRows: T[],
  localRows: T[],
  deletedIds: string[]
): T[] {
  const deleted = new Set(deletedIds);
  const dirtyMap = new Map(
    localRows
      .filter((r) => r._dirty && r.id && !r.id.startsWith("__new__"))
      .map((r) => [r.id!, r])
  );
  const newRows = localRows.filter((r) => r._dirty && (!r.id || r.id.startsWith("__new__")));
  const merged = serverRows
    .filter((r) => !r.id || !deleted.has(r.id))
    .map((r) => (r.id && dirtyMap.has(r.id) ? dirtyMap.get(r.id)! : r));
  return [...merged, ...newRows];
}

// ── Store ──────────────────────────────────────────────────────────────────────────────

export const useActiviteStore = create<ActiviteStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,

        // ── Getters ────────────────────────────────────────────────────────────
        getDraft: (dossierId) => get().drafts[dossierId] ?? EMPTY_ACTIVITE_DRAFT,

        hasUnsavedChanges: (dossierId) => {
          const draft = get().drafts[dossierId];
          if (!draft) return false;
          return (
            (draft._deletedActiviteIds?.length ?? 0) > 0 ||
            (draft._deletedCommissionIds?.length ?? 0) > 0 ||
            (draft._deletedProductionIds?.length ?? 0) > 0 ||
            (draft._deletedSubventionIds?.length ?? 0) > 0 ||
            draft.activites.some((r) => r._dirty) ||
            draft.activitesCommissionnees.some((r) => r._dirty) ||
            draft.productionsImmobilisees.some((r) => r._dirty) ||
            draft.subventionsExploitation.some((r) => r._dirty)
          );
        },

        // ── Hydratation depuis le serveur ──────────────────────────────────────
        hydrateActivites(dossierId, rows) {
          set((state) => {
            const existing = state.drafts[dossierId];
            if (!existing) return { drafts: { ...state.drafts, [dossierId]: { ...getEmptyDraft(), activites: rows } } };
            return { drafts: { ...state.drafts, [dossierId]: { ...existing, activites: mergeRows(rows, existing.activites, existing._deletedActiviteIds ?? []) } } };
          });
        },

        hydrateCommissions(dossierId, rows) {
          set((state) => {
            const existing = state.drafts[dossierId];
            if (!existing) return { drafts: { ...state.drafts, [dossierId]: { ...getEmptyDraft(), activitesCommissionnees: rows } } };
            return { drafts: { ...state.drafts, [dossierId]: { ...existing, activitesCommissionnees: mergeRows(rows, existing.activitesCommissionnees, existing._deletedCommissionIds ?? []) } } };
          });
        },

        hydrateProductions(dossierId, rows) {
          set((state) => {
            const existing = state.drafts[dossierId];
            if (!existing) return { drafts: { ...state.drafts, [dossierId]: { ...getEmptyDraft(), productionsImmobilisees: rows } } };
            return { drafts: { ...state.drafts, [dossierId]: { ...existing, productionsImmobilisees: mergeRows(rows, existing.productionsImmobilisees, existing._deletedProductionIds ?? []) } } };
          });
        },

        hydrateSubventions(dossierId, rows) {
          set((state) => {
            const existing = state.drafts[dossierId];
            if (!existing) return { drafts: { ...state.drafts, [dossierId]: { ...getEmptyDraft(), subventionsExploitation: rows } } };
            return { drafts: { ...state.drafts, [dossierId]: { ...existing, subventionsExploitation: mergeRows(rows, existing.subventionsExploitation, existing._deletedSubventionIds ?? []) } } };
          });
        },

        // ── Mutations Activités (Chiffre d'affaires) ──────────────────────────
        addActiviteRow: (dossierId) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  activites: [...draft.activites, emptyActiviteRow()],
                },
              },
            };
          });
        },

        updateActiviteRow: (dossierId, index, data) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            if (index < 0 || index >= draft.activites.length) return state;
            const updated = [...draft.activites];
            updated[index] = { ...updated[index], ...data, _dirty: true };
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  activites: updated,
                },
              },
            };
          });
        },

        removeActiviteRow: (dossierId, index) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const row = draft.activites[index];
            const isPersisted = !!row?.id && !row.id.startsWith("__new__");
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  activites: draft.activites.filter((_, i) => i !== index),
                  _deletedActiviteIds: isPersisted ? [...(draft._deletedActiviteIds ?? []), row!.id!] : (draft._deletedActiviteIds ?? []),
                },
              },
            };
          });
        },

        duplicateActiviteRow: (dossierId, index) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const source = draft.activites[index];
            if (!source) return state;
            const { id: _id, ...rest } = source;
            const rows = [...draft.activites];
            rows.splice(index + 1, 0, { ...rest, id: tempId(), libelle: `${rest.libelle} (copie)`, _dirty: true });
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: { ...draft, activites: rows },
              },
            };
          });
        },

        markActivitesSaved: (dossierId) => {
          set((state) => {
            const draft = state.drafts[dossierId];
            if (!draft) return state;
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  _deletedActiviteIds: [],
                  activites: draft.activites.map((r) => ({ ...r, _dirty: false })),
                },
              },
            };
          });
        },

        addActiviteGroup: (dossierId) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const existing = new Set(draft.activites.filter((r) => r.groupe).map((r) => r.groupe!));
            let n = 1;
            while (existing.has(createNewGroup(n))) n++;
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  activites: [...draft.activites, emptyActiviteRow(createNewGroup(n))],
                },
              },
            };
          });
        },

        addActiviteToGroup(dossierId, groupe) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  activites: [...draft.activites, emptyActiviteRow(groupe)],
                },
              },
            };
          });
        },

        // ── Mutations Activités commissionnées ───────────────────────────────
        addActiviteCommissionRow: (dossierId) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  activitesCommissionnees: [
                    ...draft.activitesCommissionnees,
                    emptyCommissionRow(),
                  ],
                },
              },
            };
          });
        },

        updateActiviteCommissionRow: (dossierId, index, data) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            if (index < 0 || index >= draft.activitesCommissionnees.length) return state;
            const updated = [...draft.activitesCommissionnees];
            updated[index] = { ...updated[index], ...data, _dirty: true };
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  activitesCommissionnees: updated,
                },
              },
            };
          });
        },

        removeActiviteCommissionRow: (dossierId, index) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const row = draft.activitesCommissionnees[index];
            const isPersisted = !!row?.id && !row.id.startsWith("__new__");
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  activitesCommissionnees: draft.activitesCommissionnees.filter((_, i) => i !== index),
                  _deletedCommissionIds: isPersisted ? [...(draft._deletedCommissionIds ?? []), row!.id!] : (draft._deletedCommissionIds ?? []),
                },
              },
            };
          });
        },

        duplicateActiviteCommissionRow: (dossierId, index) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const source = draft.activitesCommissionnees[index];
            if (!source) return state;
            const { id: _id, ...rest } = source;
            const rows = [...draft.activitesCommissionnees];
            rows.splice(index + 1, 0, { ...rest, id: tempId(), libelle: `${rest.libelle} (copie)`, _dirty: true });
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: { ...draft, activitesCommissionnees: rows },
              },
            };
          });
        },

        markCommissionsSaved: (dossierId) => {
          set((state) => {
            const draft = state.drafts[dossierId];
            if (!draft) return state;
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  _deletedCommissionIds: [],
                  activitesCommissionnees: draft.activitesCommissionnees.map((r) => ({ ...r, _dirty: false })),
                },
              },
            };
          });
        },

        addActiviteCommissionGroup: (dossierId) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const existing = new Set(draft.activitesCommissionnees.filter((r) => r.groupe).map((r) => r.groupe!));
            let n = 1;
            while (existing.has(createNewGroup(n))) n++;
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  activitesCommissionnees: [...draft.activitesCommissionnees, emptyCommissionRow(createNewGroup(n))],
                },
              },
            };
          });
        },

        addActiviteCommissionToGroup(dossierId, groupe) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  activitesCommissionnees: [...draft.activitesCommissionnees, emptyCommissionRow(groupe)],
                },
              },
            };
          });
        },

        // ── Mutations Productions immobilisées ───────────────────────────────
        addProductionImmobiliseeRow: (dossierId) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  productionsImmobilisees: [
                    ...draft.productionsImmobilisees,
                    emptyProductionImmobiliseeRow(),
                  ],
                },
              },
            };
          });
        },

        updateProductionImmobiliseeRow: (dossierId, index, data) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            if (index < 0 || index >= draft.productionsImmobilisees.length) return state;
            const updated = [...draft.productionsImmobilisees];
            updated[index] = { ...updated[index], ...data, _dirty: true };
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  productionsImmobilisees: updated,
                },
              },
            };
          });
        },

        removeProductionImmobiliseeRow: (dossierId, index) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const row = draft.productionsImmobilisees[index];
            const isPersisted = !!row?.id && !row.id.startsWith("__new__");
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  productionsImmobilisees: draft.productionsImmobilisees.filter((_, i) => i !== index),
                  _deletedProductionIds: isPersisted ? [...(draft._deletedProductionIds ?? []), row!.id!] : (draft._deletedProductionIds ?? []),
                },
              },
            };
          });
        },

        duplicateProductionImmobiliseeRow: (dossierId, index) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const source = draft.productionsImmobilisees[index];
            if (!source) return state;
            const { id: _id, ...rest } = source;
            const rows = [...draft.productionsImmobilisees];
            rows.splice(index + 1, 0, { ...rest, id: tempId(), libelle: `${rest.libelle} (copie)`, _dirty: true });
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: { ...draft, productionsImmobilisees: rows },
              },
            };
          });
        },

        markProductionsSaved: (dossierId) => {
          set((state) => {
            const draft = state.drafts[dossierId];
            if (!draft) return state;
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  _deletedProductionIds: [],
                  productionsImmobilisees: draft.productionsImmobilisees.map((r) => ({ ...r, _dirty: false })),
                },
              },
            };
          });
        },

        addProductionImmobiliseeGroup: (dossierId) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const existing = new Set(draft.productionsImmobilisees.filter((r) => r.groupe).map((r) => r.groupe!));
            let n = 1;
            while (existing.has(createNewGroup(n))) n++;
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  productionsImmobilisees: [...draft.productionsImmobilisees, emptyProductionImmobiliseeRow(createNewGroup(n))],
                },
              },
            };
          });
        },

        addProductionImmobiliseeToGroup: (dossierId, groupe) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  productionsImmobilisees: [...draft.productionsImmobilisees, emptyProductionImmobiliseeRow(groupe)],
                },
              },
            };
          });
        },

        // ── Mutations Subventions d'exploitation ────────────────────────────
        addSubventionExploitationRow: (dossierId) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  subventionsExploitation: [
                    ...draft.subventionsExploitation,
                    emptySubventionRow(),
                  ],
                },
              },
            };
          });
        },

        updateSubventionExploitationRow: (dossierId, index, data) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            if (index < 0 || index >= draft.subventionsExploitation.length) return state;
            const updated = [...draft.subventionsExploitation];
            updated[index] = { ...updated[index], ...data, _dirty: true };
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  subventionsExploitation: updated,
                },
              },
            };
          });
        },

        removeSubventionExploitationRow: (dossierId, index) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const row = draft.subventionsExploitation[index];
            const isPersisted = !!row?.id && !row.id.startsWith("__new__");
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  subventionsExploitation: draft.subventionsExploitation.filter((_, i) => i !== index),
                  _deletedSubventionIds: isPersisted ? [...(draft._deletedSubventionIds ?? []), row!.id!] : (draft._deletedSubventionIds ?? []),
                },
              },
            };
          });
        },

        duplicateSubventionExploitationRow: (dossierId, index) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const source = draft.subventionsExploitation[index];
            if (!source) return state;
            const { id: _id, ...rest } = source;
            const rows = [...draft.subventionsExploitation];
            rows.splice(index + 1, 0, { ...rest, id: tempId(), libelle: `${rest.libelle} (copie)`, _dirty: true });
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: { ...draft, subventionsExploitation: rows },
              },
            };
          });
        },

        markSubventionsSaved: (dossierId) => {
          set((state) => {
            const draft = state.drafts[dossierId];
            if (!draft) return state;
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  _deletedSubventionIds: [],
                  subventionsExploitation: draft.subventionsExploitation.map((r) => ({ ...r, _dirty: false })),
                },
              },
            };
          });
        },

        addSubventionExploitationGroup: (dossierId) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const existing = new Set(draft.subventionsExploitation.filter((r) => r.groupe).map((r) => r.groupe!));
            let n = 1;
            while (existing.has(createNewGroup(n))) n++;
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  subventionsExploitation: [...draft.subventionsExploitation, emptySubventionRow(createNewGroup(n))],
                },
              },
            };
          });
        },

        addSubventionExploitationToGroup: (dossierId, groupe) => {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  subventionsExploitation: [...draft.subventionsExploitation, emptySubventionRow(groupe)],
                },
              },
            };
          });
        },

        // ── Setters updater (patchage IDs post-save) ──────────────────────────
        setActivites(dossierId, updater) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: { ...state.drafts, [dossierId]: { ...draft, activites: updater(draft.activites) } },
            };
          });
        },

        setCommissions(dossierId, updater) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: { ...state.drafts, [dossierId]: { ...draft, activitesCommissionnees: updater(draft.activitesCommissionnees) } },
            };
          });
        },

        setProductions(dossierId, updater) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: { ...state.drafts, [dossierId]: { ...draft, productionsImmobilisees: updater(draft.productionsImmobilisees) } },
            };
          });
        },

        setSubventions(dossierId, updater) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: { ...state.drafts, [dossierId]: { ...draft, subventionsExploitation: updater(draft.subventionsExploitation) } },
            };
          });
        },

        // ── Setters batch pour DnD (marque dirty=true) ─────────────────────────
        setActivitesRows: (dossierId, rows) => {
          set((state) => ({
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...(state.drafts[dossierId] ?? getEmptyDraft()),
                activites: rows.map((r) => ({ ...r, _dirty: true })),
              },
            },
          }));
        },

        setCommissionsRows: (dossierId, rows) => {
          set((state) => ({
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...(state.drafts[dossierId] ?? getEmptyDraft()),
                activitesCommissionnees: rows.map((r) => ({ ...r, _dirty: true })),
              },
            },
          }));
        },

        setProductionsRows: (dossierId, rows) => {
          set((state) => ({
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...(state.drafts[dossierId] ?? getEmptyDraft()),
                productionsImmobilisees: rows.map((r) => ({ ...r, _dirty: true })),
              },
            },
          }));
        },

        setSubventionsRows: (dossierId, rows) => {
          set((state) => ({
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...(state.drafts[dossierId] ?? getEmptyDraft()),
                subventionsExploitation: rows.map((r) => ({ ...r, _dirty: true })),
              },
            },
          }));
        },

        // ── Reset ──────────────────────────────────────────────────────────────
        clearDraft(dossierId) {
          set((state) => {
            const drafts = { ...state.drafts };
            delete drafts[dossierId];
            return { drafts };
          });
        },

        clearDossier(dossierId) {
          get().clearDraft(dossierId);
        },
      }),
      {
        name: "activite-storage",
        partialize: (state) => ({
          drafts: Object.fromEntries(
            Object.entries(state.drafts).map(([id, draft]) => [
              id,
              {
                ...draft,
                _deletedActiviteIds: [],
                _deletedCommissionIds: [],
                _deletedProductionIds: [],
                _deletedSubventionIds: [],
              },
            ])
          ),
        }),
      }
    ),
    { name: "ActiviteStore" }
  )
);
