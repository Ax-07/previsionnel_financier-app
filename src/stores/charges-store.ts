import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import type { ChargeExploitationRow, ImpotTaxeRow } from "@/lib/schemas/charges";
import { tempId } from "@/components/app/forms/helpers/table-helpers";

// ── Types ────────────────────────────────────────────────────────────────────

export type LocalChargeExploitationRow = ChargeExploitationRow & { _dirty?: boolean };
export type LocalImpotTaxeRow = ImpotTaxeRow & { _dirty?: boolean };

export interface ChargesDraft {
  fournitures: LocalChargeExploitationRow[];
  services: LocalChargeExploitationRow[];
  impots: LocalImpotTaxeRow[];
  _deletedFournitureIds?: string[];
  _deletedServiceIds?: string[];
  _deletedImpotIds?: string[];
}

interface ChargesState {
  drafts: Record<string, ChargesDraft>;
}

interface ChargesActions {
  // ── Getters ────────────────────────────────────────────────────────────────
  getDraft: (dossierId: string) => ChargesDraft;
  hasUnsavedChanges: (dossierId: string) => boolean;

  // ── Hydratation depuis le serveur (avec garde draft local) ─────────────────
  hydrateFournitures: (dossierId: string, rows: LocalChargeExploitationRow[]) => void;
  hydrateServices: (dossierId: string, rows: LocalChargeExploitationRow[]) => void;
  hydrateImpots: (dossierId: string, rows: LocalImpotTaxeRow[]) => void;

  // ── Setters updater (même API que useState — utilisés pour patcher les IDs post-save) ────
  setFournitures: (dossierId: string, updater: (prev: LocalChargeExploitationRow[]) => LocalChargeExploitationRow[]) => void;
  setServices: (dossierId: string, updater: (prev: LocalChargeExploitationRow[]) => LocalChargeExploitationRow[]) => void;
  setImpots: (dossierId: string, updater: (prev: LocalImpotTaxeRow[]) => LocalImpotTaxeRow[]) => void;

  // ── Setters batch pour DnD (marque _dirty=true sur chaque ligne) ───────────
  setFournituresRows: (dossierId: string, rows: LocalChargeExploitationRow[]) => void;
  setServicesRows: (dossierId: string, rows: LocalChargeExploitationRow[]) => void;
  setImpotsRows: (dossierId: string, rows: LocalImpotTaxeRow[]) => void;

  // ── Mutations Fournitures ─────────────────────────────────────────────────────────────
  addFournitureRow: (dossierId: string) => void;
  addFournitureGroup: (dossierId: string) => void;
  addFournitureToGroup: (dossierId: string, groupe: string) => void;
  updateFournitureRow: (dossierId: string, index: number, data: Partial<LocalChargeExploitationRow>) => void;
  removeFournitureRow: (dossierId: string, index: number) => void;
  duplicateFournitureRow: (dossierId: string, index: number) => void;
  markFournituresSaved: (dossierId: string) => void;

  // ── Mutations Services ─────────────────────────────────────────────────────────────
  addServiceRow: (dossierId: string) => void;
  addServiceGroup: (dossierId: string) => void;
  addServiceToGroup: (dossierId: string, groupe: string) => void;
  updateServiceRow: (dossierId: string, index: number, data: Partial<LocalChargeExploitationRow>) => void;
  removeServiceRow: (dossierId: string, index: number) => void;
  duplicateServiceRow: (dossierId: string, index: number) => void;
  markServicesSaved: (dossierId: string) => void;

  // ── Mutations Impots ─────────────────────────────────────────────────────────────
  addImpotRow: (dossierId: string) => void;
  addImpotGroup: (dossierId: string) => void;
  addImpotToGroup: (dossierId: string, groupe: string) => void;
  updateImpotRow: (dossierId: string, index: number, data: Partial<LocalImpotTaxeRow>) => void;
  removeImpotRow: (dossierId: string, index: number) => void;
  duplicateImpotRow: (dossierId: string, index: number) => void;
  markImpotsSaved: (dossierId: string) => void;

  // ── Reset ──────────────────────────────────────────────────────────────
  clearDraft: (dossierId: string) => void;
  /** Alias de clearDraft, pour fermeture de dossier */
  clearDossier: (dossierId: string) => void;
}

export type ChargesStore = ChargesState & ChargesActions;

// ── Helpers ──────────────────────────────────────────────────────────────────

function emptyFourniture(groupe?: string): LocalChargeExploitationRow {
  return {
    id: tempId(),
    libelle: "",
    categorie: "FOURNITURE_CONSOMMABLE",
    actif: true,
    hypothese: "COMMUNE",
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
    ...(groupe !== undefined ? { groupe } : {}),
    _dirty: true,
  };
}

function emptyService(groupe?: string): LocalChargeExploitationRow {
  return {
    id: tempId(),
    libelle: "",
    categorie: "SERVICE_EXTERIEUR",
    actif: true,
    hypothese: "COMMUNE",
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
    ...(groupe !== undefined ? { groupe } : {}),
    _dirty: true,
  };
}

function emptyImpot(groupe?: string): LocalImpotTaxeRow {
  return {
    id: tempId(),
    libelle: "",
    actif: true,
    hypothese: "COMMUNE",
    isCFE: false,
    cfeModeCalc: false,
    dateN: "",
    montantN: 0,
    dateN1: "",
    montantN1: 0,
    dateN2: "",
    montantN2: 0,
    ...(groupe !== undefined ? { groupe } : {}),
    _dirty: true,
  };
}

function getEmptyDraft(): ChargesDraft {
  return { fournitures: [], services: [], impots: [] };
}

/** Référence stable pour getDraft() quand aucun draft n'existe. */
const EMPTY_CHARGES_DRAFT: ChargesDraft = getEmptyDraft();
const INITIAL_STATE: ChargesState = { drafts: {} };
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

// Store

export const useChargesStore = create<ChargesStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,

        // ── Getters ────────────────────────────────────────────────────────────
        getDraft(dossierId) {
          return get().drafts[dossierId] ?? EMPTY_CHARGES_DRAFT;
        },

        hasUnsavedChanges(dossierId) {
          const draft = get().drafts[dossierId];
          if (!draft) return false;
          return (
            (draft._deletedFournitureIds?.length ?? 0) > 0 ||
            (draft._deletedServiceIds?.length ?? 0) > 0 ||
            (draft._deletedImpotIds?.length ?? 0) > 0 ||
            draft.fournitures.some((r) => r._dirty) ||
            draft.services.some((r) => r._dirty) ||
            draft.impots.some((r) => r._dirty)
          );
        },

        // ── Hydratation depuis le serveur ──────────────────────────────────────
        hydrateFournitures(dossierId, rows) {
          set((state) => {
            const draft = state.drafts[dossierId];
            if (!draft) {
              return { drafts: { ...state.drafts, [dossierId]: { ...getEmptyDraft(), fournitures: rows } } };
            }
            const merged = mergeRows(rows, draft.fournitures, draft._deletedFournitureIds ?? []);
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, fournitures: merged } } };
          });
        },

        hydrateServices(dossierId, rows) {
          set((state) => {
            const draft = state.drafts[dossierId];
            if (!draft) {
              return { drafts: { ...state.drafts, [dossierId]: { ...getEmptyDraft(), services: rows } } };
            }
            const merged = mergeRows(rows, draft.services, draft._deletedServiceIds ?? []);
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, services: merged } } };
          });
        },

        hydrateImpots(dossierId, rows) {
          set((state) => {
            const draft = state.drafts[dossierId];
            if (!draft) {
              return { drafts: { ...state.drafts, [dossierId]: { ...getEmptyDraft(), impots: rows } } };
            }
            const merged = mergeRows(rows, draft.impots, draft._deletedImpotIds ?? []);
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, impots: merged } } };
          });
        },

        // ── Setters updater (patchage IDs post-save) ──────────────────────────
        setFournitures(dossierId, updater) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, fournitures: updater(draft.fournitures) } } };
          });
        },

        setServices(dossierId, updater) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, services: updater(draft.services) } } };
          });
        },

        setImpots(dossierId, updater) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, impots: updater(draft.impots) } } };
          });
        },

        // ── Setters batch pour DnD (marque dirty=true) ─────────────────────────
        setFournituresRows(dossierId, rows) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, fournitures: rows.map((r) => ({ ...r, _dirty: true })) } } };
          });
        },

        setServicesRows(dossierId, rows) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, services: rows.map((r) => ({ ...r, _dirty: true })) } } };
          });
        },

        setImpotsRows(dossierId, rows) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, impots: rows.map((r) => ({ ...r, _dirty: true })) } } };
          });
        },

        // ── Mutations Fournitures ─────────────────────────────────────────────────────────────
        addFournitureRow(dossierId) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, fournitures: [...draft.fournitures, emptyFourniture()] } } };
          });
        },

        addFournitureGroup(dossierId) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const existing = new Set(draft.fournitures.filter((r) => r.groupe).map((r) => r.groupe!));
            let n = 1;
            while (existing.has(createNewGroup(n))) n++;
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  fournitures: [...draft.fournitures, emptyFourniture(createNewGroup(n))]
                }
              }
            };
          });
        },

        addFournitureToGroup(dossierId, groupe) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, fournitures: [...draft.fournitures, emptyFourniture(groupe)] } } };
          });
        },

        updateFournitureRow(dossierId, index, data) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const rows = [...draft.fournitures];
            const row = rows[index];
            if (!row) return state;
            const merged = { ...row, ...data };
            const isPourcentageCA = merged.detailCalc?.modeCalc === "POURCENTAGE_CA";
            if (!isPourcentageCA) {
              if ("montantN" in data || "evolutionN1" in data) {
                merged.montantN1 = parseFloat((merged.montantN * (1 + merged.evolutionN1 / 100)).toFixed(2));
              }
              if ("montantN1" in data || "evolutionN2" in data || "montantN" in data || "evolutionN1" in data) {
                merged.montantN2 = parseFloat((merged.montantN1 * (1 + merged.evolutionN2 / 100)).toFixed(2));
              }
            }
            rows[index] = { ...merged, _dirty: true };
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, fournitures: rows } } };
          });
        },

        removeFournitureRow(dossierId, index) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const row = draft.fournitures[index];
            if (!row) return state;
            const isPersisted = row.id && !row.id.startsWith("__new__");
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  fournitures: draft.fournitures.filter((_, i) => i !== index),
                  _deletedFournitureIds: isPersisted
                    ? [...(draft._deletedFournitureIds ?? []), row.id!]
                    : (draft._deletedFournitureIds ?? []),
                },
              },
            };
          });
        },

        duplicateFournitureRow(dossierId, index) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const source = draft.fournitures[index];
            if (!source) return state;
            const copy: LocalChargeExploitationRow = { ...source, id: tempId(), libelle: `${source.libelle} (copie)`, _dirty: true };
            const rows = [...draft.fournitures];
            rows.splice(index + 1, 0, copy);
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, fournitures: rows } } };
          });
        },

        markFournituresSaved(dossierId) {
          set((state) => ({
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...(state.drafts[dossierId] ?? getEmptyDraft()),
                fournitures: (state.drafts[dossierId]?.fournitures ?? []).map((r) => ({ ...r, _dirty: false })),
                _deletedFournitureIds: [],
              },
            },
          }));
        },

        // ── Mutations Services ─────────────────────────────────────────────────────────────
        addServiceRow(dossierId) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, services: [...draft.services, emptyService()] } } };
          });
        },

        addServiceGroup(dossierId) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const existing = new Set(draft.services.filter((r) => r.groupe).map((r) => r.groupe!));
            let n = 1;
            while (existing.has(createNewGroup(n))) n++;
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  services: [...draft.services, emptyService(createNewGroup(n))]
                }
              }
            };
          });
        },

        addServiceToGroup(dossierId, groupe) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, services: [...draft.services, emptyService(groupe)] } } };
          });
        },

        updateServiceRow(dossierId, index, data) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const rows = [...draft.services];
            const row = rows[index];
            if (!row) return state;
            const merged = { ...row, ...data };
            const isPourcentageCA = merged.detailCalc?.modeCalc === "POURCENTAGE_CA";
            if (!isPourcentageCA) {
              if ("montantN" in data || "evolutionN1" in data) {
                merged.montantN1 = parseFloat((merged.montantN * (1 + merged.evolutionN1 / 100)).toFixed(2));
              }
              if ("montantN1" in data || "evolutionN2" in data || "montantN" in data || "evolutionN1" in data) {
                merged.montantN2 = parseFloat((merged.montantN1 * (1 + merged.evolutionN2 / 100)).toFixed(2));
              }
            }
            rows[index] = { ...merged, _dirty: true };
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, services: rows } } };
          });
        },

        removeServiceRow(dossierId, index) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const row = draft.services[index];
            if (!row) return state;
            const isPersisted = row.id && !row.id.startsWith("__new__");
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  services: draft.services.filter((_, i) => i !== index),
                  _deletedServiceIds: isPersisted
                    ? [...(draft._deletedServiceIds ?? []), row.id!]
                    : (draft._deletedServiceIds ?? []),
                },
              },
            };
          });
        },

        duplicateServiceRow(dossierId, index) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const source = draft.services[index];
            if (!source) return state;
            const copy: LocalChargeExploitationRow = { ...source, id: tempId(), libelle: `${source.libelle} (copie)`, _dirty: true };
            const rows = [...draft.services];
            rows.splice(index + 1, 0, copy);
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, services: rows } } };
          });
        },

        markServicesSaved(dossierId) {
          set((state) => ({
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...(state.drafts[dossierId] ?? getEmptyDraft()),
                services: (state.drafts[dossierId]?.services ?? []).map((r) => ({ ...r, _dirty: false })),
                _deletedServiceIds: [],
              },
            },
          }));
        },

        // ── Mutations Impots ─────────────────────────────────────────────────────────────
        addImpotRow(dossierId) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, impots: [...draft.impots, emptyImpot()] } } };
          });
        },

        addImpotGroup(dossierId) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const existing = new Set(draft.impots.filter((r) => r.groupe).map((r) => r.groupe!));
            let n = 1;
            while (existing.has(createNewGroup(n))) n++;
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, impots: [...draft.impots, emptyImpot(createNewGroup(n))] } } };
          });
        },

        addImpotToGroup(dossierId, groupe) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  impots: [...draft.impots, emptyImpot(groupe)]
                }
              }
            };
          });
        },

        updateImpotRow(dossierId, index, data) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const rows = [...draft.impots];
            const row = rows[index];
            if (!row) return state;
            rows[index] = { ...row, ...data, _dirty: true };
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, impots: rows } } };
          });
        },

        removeImpotRow(dossierId, index) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const row = draft.impots[index];
            if (!row) return state;
            const isPersisted = row.id && !row.id.startsWith("__new__");
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  impots: draft.impots.filter((_, i) => i !== index),
                  _deletedImpotIds: isPersisted
                    ? [...(draft._deletedImpotIds ?? []), row.id!]
                    : (draft._deletedImpotIds ?? []),
                },
              },
            };
          });
        },

        duplicateImpotRow(dossierId, index) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const source = draft.impots[index];
            if (!source) return state;
            const copy: LocalImpotTaxeRow = { ...source, id: tempId(), libelle: `${source.libelle} (copie)`, _dirty: true };
            const rows = [...draft.impots];
            rows.splice(index + 1, 0, copy);
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, impots: rows } } };
          });
        },

        markImpotsSaved(dossierId) {
          set((state) => ({
            drafts: {
              ...state.drafts,
              [dossierId]: {
                ...(state.drafts[dossierId] ?? getEmptyDraft()),
                impots: (state.drafts[dossierId]?.impots ?? []).map((r) => ({ ...r, _dirty: false })),
                _deletedImpotIds: [],
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
        name: "previsia-charges-v2",
        partialize: (state) => ({ drafts: state.drafts }),
      }
    ),
    { name: "charges-store" }
  )
);