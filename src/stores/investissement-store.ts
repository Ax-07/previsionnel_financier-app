import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

import type {
  ImmobilisationRow,
  CessionRow,
  CreditBailRow,
} from "@/lib/schemas/investissement";
import { tempId } from "@/components/app/forms/helpers/table-helpers";

// ── Types locaux (miroir du formulaire) ──────────────────────────────────────

export type LocalImmo = ImmobilisationRow & { _dirty?: boolean };
export type LocalCession = CessionRow & { _dirty?: boolean };
export type LocalCredit = CreditBailRow & { _dirty?: boolean };

export interface InvestissementDraft {
  immos: LocalImmo[];
  cessions: LocalCession[];
  credits: LocalCredit[];
  /** Mis à true quand une ligne persistée est supprimée localement (avant save) */
  _deletedImmoIds?: string[];
  _deletedCessionIds?: string[];
  _deletedCreditIds?: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function emptyImmoRow(dateDebutExerciceN?: string, groupe?: string): LocalImmo {
  return {
    id: tempId(),
    libelle: "",
    nature: "CORPOREL",
    dateAcquisition: dateDebutExerciceN ?? new Date().toISOString().slice(0, 10),
    montantHT: 0,
    modeAmortissement: "LINEAIRE",
    differe: 0,
    dureeAmortissement: 5,
    tauxTVA: 20,
    typeTva: "RECUPERABLE",
    hypothese: "COMMUNE",
    actif: true,
    ordre: 0,
    ...(groupe !== undefined ? { groupe } : {}),
    _dirty: true,
  };
}

function getEmptyDraft(): InvestissementDraft {
  return { immos: [], cessions: [], credits: [] };
}

function emptyCessionRow(dateDebutExerciceN?: string, groupe?: string): LocalCession {
  return {
    id: tempId(),
    libelle: "",
    nature: "CORPOREL",
    dateCession: dateDebutExerciceN ?? new Date().toISOString().slice(0, 10),
    prixVente: 0,
    prixAchat: 0,
    dejaAmortie: 0,
    tauxTVA: 20,
    hypothese: "COMMUNE",
    actif: true,
    ordre: 0,
    ...(groupe !== undefined ? { groupe } : {}),
    _dirty: true,
  };
}

function emptyCreditRow(dateDebutExerciceN?: string, groupe?: string): LocalCredit {
  return {
    id: tempId(),
    libelle: "",
    dateDebut: dateDebutExerciceN ?? new Date().toISOString().slice(0, 10),
    montantHT: 0,
    taux: 0,
    duree: 36,
    periodicite: "MENSUEL",
    dateEcheance: "",
    valeurResiduelle: 0,
    premierLoyer: 0,
    loyerHT: 0,
    tauxTVA: 20,
    hypothese: "COMMUNE",
    actif: true,
    ordre: 0,
    ...(groupe !== undefined ? { groupe } : {}),
    _dirty: true,
  };
}

// ── State / Actions ───────────────────────────────────────────────────────────

interface InvestissementState {
  /** Drafts par dossierId */
  drafts: Record<string, InvestissementDraft>;
}

interface InvestissementActions {
  // ── Getters ────────────────────────────────────────────────────────────────
  getDraft: (dossierId: string) => InvestissementDraft;
  hasUnsavedChanges: (dossierId: string) => boolean;

  /** Mise à jour via fonction updater (même API que useState) */
  setImmos: (dossierId: string, updater: (prev: LocalImmo[]) => LocalImmo[]) => void;
  setCessions: (dossierId: string, updater: (prev: LocalCession[]) => LocalCession[]) => void;
  setCredits: (dossierId: string, updater: (prev: LocalCredit[]) => LocalCredit[]) => void;
  /**
   * Hydratation depuis le serveur.
   * - Si absence de lignes dans le store → on prend les données serveur.
   * - Si lignes présentes mais toutes propres (_dirty: false) → on refresh depuis serveur.
   * - Si lignes dirty en attente → on conserve le draft local.
   */
  hydrateImmos: (dossierId: string, rows: LocalImmo[]) => void;
  hydrateCessions: (dossierId: string, rows: LocalCession[]) => void;
  hydrateCredits: (dossierId: string, rows: LocalCredit[]) => void;
  /** Purge les données d'un dossier (ex : fermeture du dossier) */
  clearDossier: (dossierId: string) => void;

  // ── Mutations immobilisations ────────────────────────────────────────────────
  addImmoRow: (dossierId: string, dateDebutExerciceN?: string) => void;
  updateImmoRow: (dossierId: string, id: string, data: Partial<LocalImmo>) => void;
  /** Suppression locale (le serveur fera le diff au prochain save) */
  removeImmoRow: (dossierId: string, id: string) => void;
  duplicateImmoRow: (dossierId: string, id: string) => void;
  addImmoGroup: (dossierId: string, dateDebutExerciceN?: string) => void;
  addImmoToGroup: (dossierId: string, groupe: string, dateDebutExerciceN?: string) => void;
  /** Remplacement complet du tableau (DnD) — marque toutes les lignes dirty */
  setImmosRows: (dossierId: string, rows: LocalImmo[]) => void;

  /** Après save réussi : efface tous les flags _dirty sur les immos */
  markImmosSaved: (dossierId: string) => void;

  // ── Mutations Cessions ────────────────────────────────────────────────────
  addCessionRow: (dossierId: string, dateDebutExerciceN?: string) => void;
  updateCessionRow: (dossierId: string, id: string, data: Partial<LocalCession>) => void;
  removeCessionRow: (dossierId: string, id: string) => void;
  duplicateCessionRow: (dossierId: string, id: string) => void;
  addCessionGroup: (dossierId: string, dateDebutExerciceN?: string) => void;
  addCessionToGroup: (dossierId: string, groupe: string, dateDebutExerciceN?: string) => void;
  setCessionsRows: (dossierId: string, rows: LocalCession[]) => void;
  markCessionsSaved: (dossierId: string) => void;

  // ── Mutations Crédit-bail ────────────────────────────────────────────────
  addCreditRow: (dossierId: string, dateDebutExerciceN?: string) => void;
  updateCreditRow: (dossierId: string, id: string, data: Partial<LocalCredit>) => void;
  removeCreditRow: (dossierId: string, id: string) => void;
  duplicateCreditRow: (dossierId: string, id: string) => void;
  addCreditGroup: (dossierId: string, dateDebutExerciceN?: string) => void;
  addCreditToGroup: (dossierId: string, groupe: string, dateDebutExerciceN?: string) => void;
  setCreditsRows: (dossierId: string, rows: LocalCredit[]) => void;
  markCreditsSaved: (dossierId: string) => void;

  // ── Reset ──────────────────────────────────────────────────────────────────
  clearDraft: (dossierId: string) => void;
}

type InvestissementStore = InvestissementState & InvestissementActions;

const INITIAL_STATE: InvestissementState = {
  drafts: {},
};

/** Référence stable pour getDraft() quand aucun draft n'existe. */
const EMPTY_INVESTISSEMENT_DRAFT: InvestissementDraft = getEmptyDraft();

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

// ── Store ────────────────────────────────────────────────────────────────────

export const useInvestissementStore = create<InvestissementStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,

        getDraft: (dossierId) => get().drafts[dossierId] ?? EMPTY_INVESTISSEMENT_DRAFT,

        hasUnsavedChanges: (dossierId) => {
          const draft = get().drafts[dossierId];
          if (!draft) return false;
          return (
            (draft._deletedImmoIds?.length ?? 0) > 0 ||
            (draft._deletedCessionIds?.length ?? 0) > 0 ||
            (draft._deletedCreditIds?.length ?? 0) > 0 ||
            draft.immos.some((r) => r._dirty) ||
            draft.cessions.some((r) => r._dirty) ||
            draft.credits.some((r) => r._dirty)
          );
        },

        // ── Hydratation depuis le serveur ──────────────────────────────────────
        hydrateImmos(dossierId, rows) {
          set((state) => {
            const draft = state.drafts[dossierId];
            if (!draft) {
              return { drafts: { ...state.drafts, [dossierId]: { ...getEmptyDraft(), immos: rows } } };
            }
            const merged = mergeRows(rows, draft.immos, draft._deletedImmoIds ?? []);
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: { ...draft, immos: merged },
              },
            };
          });
        },

        hydrateCessions(dossierId, rows) {
          set((state) => {
            const draft = state.drafts[dossierId];
            if (!draft) {
              return { drafts: { ...state.drafts, [dossierId]: { ...getEmptyDraft(), cessions: rows } } };
            }
            const merged = mergeRows(rows, draft.cessions, draft._deletedCessionIds ?? []);
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: { ...draft, cessions: merged },
              },
            };
          });
        },

        hydrateCredits(dossierId, rows) {
          set((state) => {
            const draft = state.drafts[dossierId];
            if (!draft) {
              return { drafts: { ...state.drafts, [dossierId]: { ...getEmptyDraft(), credits: rows } } };
            }
            const merged = mergeRows(rows, draft.credits, draft._deletedCreditIds ?? []);
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: { ...draft, credits: merged },
              },
            };
          });
        },

        // ── Setters batch pour DnD (marque dirty=true) ─────────────────────────
        setImmos(dossierId, updater) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: { ...state.drafts, [dossierId]: { ...draft, immos: updater(draft.immos) } },
            };
          });
        },

        setCessions(dossierId, updater) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: { ...state.drafts, [dossierId]: { ...draft, cessions: updater(draft.cessions) } },
            };
          });
        },

        setCredits(dossierId, updater) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: { ...state.drafts, [dossierId]: { ...draft, credits: updater(draft.credits) } },
            };
          });
        },

        // ── Mutations Immobilisations ───────────────────────────────────────────────
        addImmoRow(dossierId, dateDebutExerciceN) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  immos: [...draft.immos, { ...emptyImmoRow(dateDebutExerciceN), ordre: draft.immos.length }],
                },
              },
            };
          });
        },

        updateImmoRow(dossierId, id, data) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  immos: draft.immos.map((r) => r.id === id ? { ...r, ...data, _dirty: true } : r),
                },
              },
            };
          });
        },

        removeImmoRow(dossierId, id) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const isPersisted = draft.immos.some((r) => r.id === id && !r.id?.startsWith("__new__"));
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  immos: draft.immos.filter((r) => r.id !== id),
                  _deletedImmoIds: isPersisted ? [...(draft._deletedImmoIds ?? []), id] : (draft._deletedImmoIds ?? []),
                },
              },
            };
          });
        },

        duplicateImmoRow(dossierId, id) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const idx = draft.immos.findIndex((r) => r.id === id);
            if (idx < 0) return state;
            const source = draft.immos[idx];
            const copy: LocalImmo = {
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
                  immos: [...draft.immos.slice(0, idx + 1), copy, ...draft.immos.slice(idx + 1)],
                },
              },
            };
          });
        },

        addImmoGroup(dossierId, dateDebutExerciceN) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const existing = new Set(draft.immos.filter((r) => r.groupe).map((r) => r.groupe!));
            let n = 1;
            while (existing.has(`Groupe ${n}`)) n++;
            const name = `Groupe ${n}`;
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  immos: [...draft.immos, { ...emptyImmoRow(dateDebutExerciceN, name), ordre: draft.immos.length }],
                },
              },
            };
          });
        },

        addImmoToGroup(dossierId, groupe, dateDebutExerciceN) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const groupRows = draft.immos.filter((r) => r.groupe === groupe);
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  immos: [...draft.immos, { ...emptyImmoRow(dateDebutExerciceN, groupe), ordre: groupRows.length }],
                },
              },
            };
          });
        },

        setImmosRows(dossierId, rows) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: { ...draft, immos: rows.map((r) => ({ ...r, _dirty: true })) },
              },
            };
          });
        },

        markImmosSaved(dossierId) {
          set((state) => {
            const draft = state.drafts[dossierId];
            if (!draft) return state;
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  _deletedImmoIds: [],
                  immos: draft.immos.map((r) => ({ ...r, _dirty: false })),
                },
              },
            };
          });
        },

        // ── Mutations Cessions ────────────────────────────────────────────────
        addCessionRow(dossierId, dateDebutExerciceN) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  cessions: [...draft.cessions, { ...emptyCessionRow(dateDebutExerciceN), ordre: draft.cessions.length }],
                },
              },
            };
          });
        },

        updateCessionRow(dossierId, id, data) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  cessions: draft.cessions.map((r) => r.id === id ? { ...r, ...data, _dirty: true } : r),
                },
              },
            };
          });
        },

        removeCessionRow(dossierId, id) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const isPersisted = draft.cessions.some((r) => r.id === id && !r.id?.startsWith("__new__"));
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  cessions: draft.cessions.filter((r) => r.id !== id),
                  _deletedCessionIds: isPersisted ? [...(draft._deletedCessionIds ?? []), id] : (draft._deletedCessionIds ?? []),
                },
              },
            };
          });
        },

        duplicateCessionRow(dossierId, id) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const idx = draft.cessions.findIndex((r) => r.id === id);
            if (idx < 0) return state;
            const source = draft.cessions[idx];
            const copy: LocalCession = {
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
                  cessions: [...draft.cessions.slice(0, idx + 1), copy, ...draft.cessions.slice(idx + 1)],
                },
              },
            };
          });
        },

        addCessionGroup(dossierId, dateDebutExerciceN) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const existing = new Set(draft.cessions.filter((r) => r.groupe).map((r) => r.groupe!));
            let n = 1;
            while (existing.has(`Groupe ${n}`)) n++;
            const name = `Groupe ${n}`;
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  cessions: [...draft.cessions, { ...emptyCessionRow(dateDebutExerciceN, name), ordre: draft.cessions.length }],
                },
              },
            };
          });
        },

        addCessionToGroup(dossierId, groupe, dateDebutExerciceN) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const groupRows = draft.cessions.filter((r) => r.groupe === groupe);
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  cessions: [...draft.cessions, { ...emptyCessionRow(dateDebutExerciceN, groupe), ordre: groupRows.length }],
                },
              },
            };
          });
        },

        setCessionsRows(dossierId, rows) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: { ...draft, cessions: rows.map((r) => ({ ...r, _dirty: true })) },
              },
            };
          });
        },

        markCessionsSaved(dossierId) {
          set((state) => {
            const draft = state.drafts[dossierId];
            if (!draft) return state;
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  _deletedCessionIds: [],
                  cessions: draft.cessions.map((r) => ({ ...r, _dirty: false })),
                },
              },
            };
          });
        },

        // ── Mutations Crédit-bail ────────────────────────────────────────────
        addCreditRow(dossierId, dateDebutExerciceN) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  credits: [...draft.credits, { ...emptyCreditRow(dateDebutExerciceN), ordre: draft.credits.length }],
                },
              },
            };
          });
        },

        updateCreditRow(dossierId, id, data) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  credits: draft.credits.map((r) => r.id === id ? { ...r, ...data, _dirty: true } : r),
                },
              },
            };
          });
        },

        removeCreditRow(dossierId, id) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const isPersisted = draft.credits.some((r) => r.id === id && !r.id?.startsWith("__new__"));
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  credits: draft.credits.filter((r) => r.id !== id),
                  _deletedCreditIds: isPersisted ? [...(draft._deletedCreditIds ?? []), id] : (draft._deletedCreditIds ?? []),
                },
              },
            };
          });
        },

        duplicateCreditRow(dossierId, id) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const idx = draft.credits.findIndex((r) => r.id === id);
            if (idx < 0) return state;
            const source = draft.credits[idx];
            const copy: LocalCredit = {
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
                  credits: [...draft.credits.slice(0, idx + 1), copy, ...draft.credits.slice(idx + 1)],
                },
              },
            };
          });
        },

        addCreditGroup(dossierId, dateDebutExerciceN) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const existing = new Set(draft.credits.filter((r) => r.groupe).map((r) => r.groupe!));
            let n = 1;
            while (existing.has(`Groupe ${n}`)) n++;
            const name = `Groupe ${n}`;
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  credits: [...draft.credits, { ...emptyCreditRow(dateDebutExerciceN, name), ordre: draft.credits.length }],
                },
              },
            };
          });
        },

        addCreditToGroup(dossierId, groupe, dateDebutExerciceN) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            const groupRows = draft.credits.filter((r) => r.groupe === groupe);
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  credits: [...draft.credits, { ...emptyCreditRow(dateDebutExerciceN, groupe), ordre: groupRows.length }],
                },
              },
            };
          });
        },

        setCreditsRows(dossierId, rows) {
          set((state) => {
            const draft = state.drafts[dossierId] ?? getEmptyDraft();
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: { ...draft, credits: rows.map((r) => ({ ...r, _dirty: true })) },
              },
            };
          });
        },

        markCreditsSaved(dossierId) {
          set((state) => {
            const draft = state.drafts[dossierId];
            if (!draft) return state;
            return {
              drafts: {
                ...state.drafts,
                [dossierId]: {
                  ...draft,
                  _deletedCreditIds: [],
                  credits: draft.credits.map((r) => ({ ...r, _dirty: false })),
                },
              },
            };
          });
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
        name: "previsia-investissement",
        partialize: (state) => ({
          drafts: Object.fromEntries(
            Object.entries(state.drafts).map(([id, draft]) => [
              id,
              {
                ...draft,
                _deletedImmoIds: [],
                _deletedCessionIds: [],
                _deletedCreditIds: [],
              },
            ])
          ),
        }),
      }
    ),
    { name: "InvestissementStore" }
  )
);
