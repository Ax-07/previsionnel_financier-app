import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

import type { ApportRow, EmpruntRow, EmpruntWithEcheancier } from "@/lib/schemas/financement";
import { tempId } from "@/components/app/forms/helpers/table-helpers";

// ── Types locaux ─────────────────────────────────────────────────────────────

export type LocalApport  = ApportRow          & { _dirty?: boolean };
export type LocalEmprunt = EmpruntWithEcheancier & { _dirty?: boolean };

export interface FinancementDraft {
  apports:  LocalApport[];
  emprunts: LocalEmprunt[];
  _deletedApportIds?:  string[];
  _deletedEmpruntIds?: string[];
}

// ── Factory functions ─────────────────────────────────────────────────────────

function emptyApportRow(dateDebutExerciceN?: string, groupe?: string): LocalApport {
  return {
    id:           tempId(),
    libelle:      "",
    type:         "CAPITAL",
    montant:      0,
    dateApport:   dateDebutExerciceN ?? new Date().toISOString().slice(0, 10),
    remboursable: false,
    hypothese:    "COMMUNE",
    actif:        true,
    ordre:        0,
    ...(groupe !== undefined ? { groupe } : {}),
    _dirty: true,
  };
}

function emptyEmpruntRow(dateDebutExerciceN?: string, groupe?: string): LocalEmprunt {
  return {
    id:                    tempId(),
    libelle:               "",
    montant:               0,
    tauxAnnuel:            3.5,
    tauxAssurance:         0.3,
    dureeEnMois:           84,
    periodicite:           "MENSUEL",
    dateDéblocage:         dateDebutExerciceN ?? new Date().toISOString().slice(0, 10),
    typeEmprunt:           "AMORTISSABLE",
    modaliteRemboursement: "ECHEANCE_CONSTANTE",
    typeDiffere:           "AUCUN",
    dureeDiffereEnMois:    0,
    modeAssurance:         "CAPITAL_RESTANT",
    fraisDossier:          0,
    hypothese:             "COMMUNE",
    actif:                 true,
    ordre:                 0,
    lignesEcheancier:      [],
    ...(groupe !== undefined ? { groupe } : {}),
    _dirty: true,
  };
}

function getEmptyDraft(): FinancementDraft {
  return { apports: [], emprunts: [] };
}

const EMPTY_DRAFT: FinancementDraft = getEmptyDraft();

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

// ── State / Actions ───────────────────────────────────────────────────────────

interface FinancementState {
  drafts: Record<string, FinancementDraft>;
}

interface FinancementActions {
  // ── Getters ────────────────────────────────────────────────────────────────
  getDraft: (dossierId: string) => FinancementDraft;
  hasUnsavedChanges: (dossierId: string) => boolean;

  // ── Hydratation depuis le serveur ──────────────────────────────────────────
  hydrateApports:  (dossierId: string, rows: LocalApport[])  => void;
  hydrateEmprunts: (dossierId: string, rows: LocalEmprunt[]) => void;

  // ── Setters updater (post-save ID patching) ────────────────────────────────
  setApports:  (dossierId: string, updater: (prev: LocalApport[])  => LocalApport[])  => void;
  setEmprunts: (dossierId: string, updater: (prev: LocalEmprunt[]) => LocalEmprunt[]) => void;

  // ── Mutations Apports ─────────────────────────────────────────────────────
  addApportRow:       (dossierId: string, dateDebutExerciceN?: string) => void;
  updateApportRow:    (dossierId: string, id: string, data: Partial<LocalApport>) => void;
  removeApportRow:    (dossierId: string, id: string) => void;
  duplicateApportRow: (dossierId: string, id: string) => void;
  addApportGroup:     (dossierId: string, dateDebutExerciceN?: string) => void;
  addApportToGroup:   (dossierId: string, groupe: string, dateDebutExerciceN?: string) => void;
  setApportsRows:     (dossierId: string, rows: LocalApport[]) => void;
  markApportsSaved:   (dossierId: string) => void;

  // ── Mutations Emprunts ────────────────────────────────────────────────────
  addEmpruntRow:       (dossierId: string, dateDebutExerciceN?: string) => void;
  updateEmpruntRow:    (dossierId: string, id: string, data: Partial<LocalEmprunt>) => void;
  updateEmpruntFull:   (dossierId: string, updated: EmpruntRow) => void;
  removeEmpruntRow:    (dossierId: string, id: string) => void;
  duplicateEmpruntRow: (dossierId: string, id: string) => void;
  addEmpruntGroup:     (dossierId: string, dateDebutExerciceN?: string) => void;
  addEmpruntToGroup:   (dossierId: string, groupe: string, dateDebutExerciceN?: string) => void;
  setEmpruntsRows:     (dossierId: string, rows: LocalEmprunt[]) => void;
  markEmpruntsSaved:   (dossierId: string) => void;

  // ── Reset ──────────────────────────────────────────────────────────────────
  clearDraft: (dossierId: string) => void;
}

type FinancementStore = FinancementState & FinancementActions;

const INITIAL_STATE: FinancementState = { drafts: {} };

// ── Store ────────────────────────────────────────────────────────────────────

export const useFinancementStore = create<FinancementStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,

        getDraft: (dossierId) => get().drafts[dossierId] ?? EMPTY_DRAFT,

        hasUnsavedChanges: (dossierId) => {
          const draft = get().drafts[dossierId];
          if (!draft) return false;
          return (
            (draft._deletedApportIds?.length ?? 0) > 0 ||
            (draft._deletedEmpruntIds?.length ?? 0) > 0 ||
            draft.apports.some((r) => r._dirty) ||
            draft.emprunts.some((r) => r._dirty)
          );
        },

        hydrateApports(dossierId, rows) {
          set((state) => {
            const draft = state.drafts[dossierId];
            if (!draft) {
              return { drafts: { ...state.drafts, [dossierId]: { ...getEmptyDraft(), apports: rows } } };
            }
            const merged = mergeRows(rows, draft.apports, draft._deletedApportIds ?? []);
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, apports: merged } } };
          });
        },

        hydrateEmprunts(dossierId, rows) {
          set((state) => {
            const draft = state.drafts[dossierId];
            if (!draft) {
              return { drafts: { ...state.drafts, [dossierId]: { ...getEmptyDraft(), emprunts: rows } } };
            }
            const merged = mergeRows(rows, draft.emprunts, draft._deletedEmpruntIds ?? []);
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, emprunts: merged } } };
          });
        },

        setApports(dossierId, updater) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, apports: updater(draft.apports) } } };
          });
        },

        setEmprunts(dossierId, updater) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return { drafts: { ...state.drafts, [dossierId]: { ...draft, emprunts: updater(draft.emprunts) } } };
          });
        },

        // ── Apports ──────────────────────────────────────────────────────────

        addApportRow(dossierId, dateDebutExerciceN) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  apports: [...draft.apports, { ...emptyApportRow(dateDebutExerciceN), ordre: draft.apports.length }],
                },
              },
            };
          });
        },

        updateApportRow(dossierId, id, data) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  apports: draft.apports.map((r) => r.id === id ? { ...r, ...data, _dirty: true } : r),
                },
              },
            };
          });
        },

        removeApportRow(dossierId, id) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const isPersisted = draft.apports.some((r) => r.id === id && !r.id?.startsWith("__new__"));
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  apports: draft.apports.filter((r) => r.id !== id),
                  _deletedApportIds: isPersisted
                    ? [...(draft._deletedApportIds ?? []), id]
                    : (draft._deletedApportIds ?? []),
                },
              },
            };
          });
        },

        duplicateApportRow(dossierId, id) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const idx = draft.apports.findIndex((r) => r.id === id);
            if (idx < 0) return state;
            const source = draft.apports[idx];
            const copy: LocalApport = {
              ...source,
              id: tempId(),
              libelle: `${source.libelle} (copie)`,
              ordre: idx + 1,
              _dirty: true,
            };
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  apports: [...draft.apports.slice(0, idx + 1), copy, ...draft.apports.slice(idx + 1)],
                },
              },
            };
          });
        },

        addApportGroup(dossierId, dateDebutExerciceN) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const existing = new Set(draft.apports.filter((r) => r.groupe).map((r) => r.groupe!));
            let n = 1;
            while (existing.has(`Groupe ${n}`)) n++;
            const name = `Groupe ${n}`;
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  apports: [...draft.apports, { ...emptyApportRow(dateDebutExerciceN, name), ordre: draft.apports.length }],
                },
              },
            };
          });
        },

        addApportToGroup(dossierId, groupe, dateDebutExerciceN) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const groupRows = draft.apports.filter((r) => r.groupe === groupe);
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  apports: [...draft.apports, { ...emptyApportRow(dateDebutExerciceN, groupe), ordre: groupRows.length }],
                },
              },
            };
          });
        },

        setApportsRows(dossierId, rows) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: { ...draft, apports: rows.map((r) => ({ ...r, _dirty: true })) },
              },
            };
          });
        },

        markApportsSaved(dossierId) {
          set((state) => {
            const draft = state.drafts[dossierId];
            if (!draft) return state;
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  _deletedApportIds: [],
                  apports: draft.apports.map((r) => ({ ...r, _dirty: false })),
                },
              },
            };
          });
        },

        // ── Emprunts ─────────────────────────────────────────────────────────

        addEmpruntRow(dossierId, dateDebutExerciceN) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  emprunts: [...draft.emprunts, { ...emptyEmpruntRow(dateDebutExerciceN), ordre: draft.emprunts.length }],
                },
              },
            };
          });
        },

        updateEmpruntRow(dossierId, id, data) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  emprunts: draft.emprunts.map((r) => r.id === id ? { ...r, ...data, _dirty: true } : r),
                },
              },
            };
          });
        },

        updateEmpruntFull(dossierId, updated) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  emprunts: draft.emprunts.map((r) =>
                    r.id === updated.id ? { ...r, ...updated, _dirty: true } : r
                  ),
                },
              },
            };
          });
        },

        removeEmpruntRow(dossierId, id) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const isPersisted = draft.emprunts.some((r) => r.id === id && !r.id?.startsWith("__new__"));
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  emprunts: draft.emprunts.filter((r) => r.id !== id),
                  _deletedEmpruntIds: isPersisted
                    ? [...(draft._deletedEmpruntIds ?? []), id]
                    : (draft._deletedEmpruntIds ?? []),
                },
              },
            };
          });
        },

        duplicateEmpruntRow(dossierId, id) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const idx = draft.emprunts.findIndex((r) => r.id === id);
            if (idx < 0) return state;
            const source = draft.emprunts[idx];
            const copy: LocalEmprunt = {
              ...source,
              id: tempId(),
              libelle: `${source.libelle} (copie)`,
              ordre: idx + 1,
              lignesEcheancier: [],
              _dirty: true,
            };
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  emprunts: [...draft.emprunts.slice(0, idx + 1), copy, ...draft.emprunts.slice(idx + 1)],
                },
              },
            };
          });
        },

        addEmpruntGroup(dossierId, dateDebutExerciceN) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const existing = new Set(draft.emprunts.filter((r) => r.groupe).map((r) => r.groupe!));
            let n = 1;
            while (existing.has(`Groupe ${n}`)) n++;
            const name = `Groupe ${n}`;
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  emprunts: [...draft.emprunts, { ...emptyEmpruntRow(dateDebutExerciceN, name), ordre: draft.emprunts.length }],
                },
              },
            };
          });
        },

        addEmpruntToGroup(dossierId, groupe, dateDebutExerciceN) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const groupRows = draft.emprunts.filter((r) => r.groupe === groupe);
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  emprunts: [...draft.emprunts, { ...emptyEmpruntRow(dateDebutExerciceN, groupe), ordre: groupRows.length }],
                },
              },
            };
          });
        },

        setEmpruntsRows(dossierId, rows) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: { ...draft, emprunts: rows.map((r) => ({ ...r, _dirty: true })) },
              },
            };
          });
        },

        markEmpruntsSaved(dossierId) {
          set((state) => {
            const draft = state.drafts[dossierId];
            if (!draft) return state;
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  _deletedEmpruntIds: [],
                  emprunts: draft.emprunts.map((r) => ({ ...r, _dirty: false })),
                },
              },
            };
          });
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
        name: "previsia-financement-v2",
        partialize: (s) => ({ drafts: s.drafts }),
      }
    ),
    { name: "FinancementStore" }
  )
);
