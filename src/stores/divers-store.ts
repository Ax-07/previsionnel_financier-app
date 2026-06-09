import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  DiversFluxDateRow,
  DiversOperationCapitalRow,
  DiversPretRow,
} from "@/lib/schemas/divers";

// ── Types ────────────────────────────────────────────────────────────────────────────

export interface DiversDraft {
  // Flux datés
  remboursementsCC: DiversFluxDateRow[];
  dividendes: DiversFluxDateRow[];
  deblocagesParticipation: DiversFluxDateRow[];
  encaissements: DiversFluxDateRow[];
  decaissements: DiversFluxDateRow[];
  // Opérations en capital
  augmentationsCapital: DiversOperationCapitalRow[];
  reductionsCapital: DiversOperationCapitalRow[];
  // Prêts inter-entreprises
  prets: DiversPretRow[];

  // Dirty flags par section
  hasUnsavedRemboursementsCC: boolean;
  hasUnsavedDividendes: boolean;
  hasUnsavedDeblocagesParticipation: boolean;
  hasUnsavedEncaissements: boolean;
  hasUnsavedDecaissements: boolean;
  hasUnsavedAugmentationsCapital: boolean;
  hasUnsavedReductionsCapital: boolean;
  hasUnsavedPrets: boolean;
}

export interface DiversState {
  drafts: Record<string, DiversDraft>;

  getDraft: (dossierId: string) => DiversDraft;
  hasUnsavedChanges: (dossierId: string) => boolean;

  // --- Remboursements C/C ---
  setRemboursementsCC: (dossierId: string, rows: DiversFluxDateRow[]) => void;
  setRemboursementsCCRows: (dossierId: string, rows: DiversFluxDateRow[]) => void;
  addRemboursementCC: (dossierId: string) => void;
  addRemboursementsCCGroup: (dossierId: string) => void;
  addRemboursementsCCToGroup: (dossierId: string, groupe: string) => void;
  updateRemboursementCC: (dossierId: string, id: string, data: Partial<DiversFluxDateRow>) => void;
  removeRemboursementCC: (dossierId: string, id: string) => void;
  duplicateRemboursementCC: (dossierId: string, id: string) => void;
  markRemboursementsCCSaved: (dossierId: string, rows: DiversFluxDateRow[]) => void;

  // --- Dividendes ---
  setDividendes: (dossierId: string, rows: DiversFluxDateRow[]) => void;
  setDividendesRows: (dossierId: string, rows: DiversFluxDateRow[]) => void;
  addDividende: (dossierId: string) => void;
  addDividendesGroup: (dossierId: string) => void;
  addDividendesToGroup: (dossierId: string, groupe: string) => void;
  updateDividende: (dossierId: string, id: string, data: Partial<DiversFluxDateRow>) => void;
  removeDividende: (dossierId: string, id: string) => void;
  duplicateDividende: (dossierId: string, id: string) => void;
  markDividendesSaved: (dossierId: string, rows: DiversFluxDateRow[]) => void;

  // --- Déblocages participation ---
  setDeblocagesParticipation: (dossierId: string, rows: DiversFluxDateRow[]) => void;
  setDeblocagesParticipationRows: (dossierId: string, rows: DiversFluxDateRow[]) => void;
  addDeblocageParticipation: (dossierId: string) => void;
  addDeblocagesParticipationGroup: (dossierId: string) => void;
  addDeblocagesParticipationToGroup: (dossierId: string, groupe: string) => void;
  updateDeblocageParticipation: (dossierId: string, id: string, data: Partial<DiversFluxDateRow>) => void;
  removeDeblocageParticipation: (dossierId: string, id: string) => void;
  duplicateDeblocageParticipation: (dossierId: string, id: string) => void;
  markDeblocagesParticipationSaved: (dossierId: string, rows: DiversFluxDateRow[]) => void;

  // --- Encaissements ---
  setEncaissements: (dossierId: string, rows: DiversFluxDateRow[]) => void;
  setEncaissementsRows: (dossierId: string, rows: DiversFluxDateRow[]) => void;
  addEncaissement: (dossierId: string) => void;
  addEncaissementsGroup: (dossierId: string) => void;
  addEncaissementsToGroup: (dossierId: string, groupe: string) => void;
  updateEncaissement: (dossierId: string, id: string, data: Partial<DiversFluxDateRow>) => void;
  removeEncaissement: (dossierId: string, id: string) => void;
  duplicateEncaissement: (dossierId: string, id: string) => void;
  markEncaissementsSaved: (dossierId: string, rows: DiversFluxDateRow[]) => void;

  // --- Décaissements ---
  setDecaissements: (dossierId: string, rows: DiversFluxDateRow[]) => void;
  setDecaissementsRows: (dossierId: string, rows: DiversFluxDateRow[]) => void;
  addDecaissement: (dossierId: string) => void;
  addDecaissementsGroup: (dossierId: string) => void;
  addDecaissementsToGroup: (dossierId: string, groupe: string) => void;
  updateDecaissement: (dossierId: string, id: string, data: Partial<DiversFluxDateRow>) => void;
  removeDecaissement: (dossierId: string, id: string) => void;
  duplicateDecaissement: (dossierId: string, id: string) => void;
  markDecaissementsSaved: (dossierId: string, rows: DiversFluxDateRow[]) => void;

  // --- Augmentations de capital ---
  setAugmentationsCapital: (dossierId: string, rows: DiversOperationCapitalRow[]) => void;
  setAugmentationsCapitalRows: (dossierId: string, rows: DiversOperationCapitalRow[]) => void;
  addAugmentationCapital: (dossierId: string) => void;
  addAugmentationsCapitalGroup: (dossierId: string) => void;
  addAugmentationsCapitalToGroup: (dossierId: string, groupe: string) => void;
  updateAugmentationCapital: (dossierId: string, id: string, data: Partial<DiversOperationCapitalRow>) => void;
  removeAugmentationCapital: (dossierId: string, id: string) => void;
  duplicateAugmentationCapital: (dossierId: string, id: string) => void;
  markAugmentationsCapitalSaved: (dossierId: string, rows: DiversOperationCapitalRow[]) => void;

  // --- Réductions de capital ---
  setReductionsCapital: (dossierId: string, rows: DiversOperationCapitalRow[]) => void;
  setReductionsCapitalRows: (dossierId: string, rows: DiversOperationCapitalRow[]) => void;
  addReductionCapital: (dossierId: string) => void;
  addReductionsCapitalGroup: (dossierId: string) => void;
  addReductionsCapitalToGroup: (dossierId: string, groupe: string) => void;
  updateReductionCapital: (dossierId: string, id: string, data: Partial<DiversOperationCapitalRow>) => void;
  removeReductionCapital: (dossierId: string, id: string) => void;
  duplicateReductionCapital: (dossierId: string, id: string) => void;
  markReductionsCapitalSaved: (dossierId: string, rows: DiversOperationCapitalRow[]) => void;

  // --- Prêts inter-entreprises ---
  setPrets: (dossierId: string, rows: DiversPretRow[]) => void;
  setPretsRows: (dossierId: string, rows: DiversPretRow[]) => void;
  addPret: (dossierId: string) => void;
  addPretsGroup: (dossierId: string) => void;
  addPretsToGroup: (dossierId: string, groupe: string) => void;
  updatePret: (dossierId: string, id: string, data: Partial<DiversPretRow>) => void;
  removePret: (dossierId: string, id: string) => void;
  duplicatePret: (dossierId: string, id: string) => void;
  markPretsSaved: (dossierId: string, rows: DiversPretRow[]) => void;

  clearDraft: (dossierId: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────────

const tempId = () => `__new__${crypto.randomUUID()}`;

function emptyDraft(): DiversDraft {
  return {
    remboursementsCC: [],
    dividendes: [],
    deblocagesParticipation: [],
    encaissements: [],
    decaissements: [],
    augmentationsCapital: [],
    reductionsCapital: [],
    prets: [],
    hasUnsavedRemboursementsCC: false,
    hasUnsavedDividendes: false,
    hasUnsavedDeblocagesParticipation: false,
    hasUnsavedEncaissements: false,
    hasUnsavedDecaissements: false,
    hasUnsavedAugmentationsCapital: false,
    hasUnsavedReductionsCapital: false,
    hasUnsavedPrets: false,
  };
}

/**
 * Référence stable pour getDraft quand aucun draft n’existe encore.
 * Évite de créer un nouvel objet à chaque appel (qui causerait des
 * boucles infinies de re-render dans les hooks utilisant useGroupedDnd).
 */
const EMPTY_DIVERS_DRAFT: DiversDraft = emptyDraft();

function emptyFlux(type: DiversFluxDateRow["type"], groupe?: string | null): DiversFluxDateRow {
  return {
    id: tempId(),
    libelle: "",
    actif: true,
    hypothese: "COMMUNE",
    type,
    dateN: "",
    montantN: 0,
    dateN1: "",
    montantN1: 0,
    dateN2: "",
    montantN2: 0,
    ordre: 0,
    groupe: groupe ?? null,
  };
}

function emptyOperationCapital(type: DiversOperationCapitalRow["type"], groupe?: string | null): DiversOperationCapitalRow {
  return {
    id: tempId(),
    libelle: "",
    actif: true,
    hypothese: "COMMUNE",
    type,
    date: "",
    montantN: 0,
    montantN1: 0,
    montantN2: 0,
    ordre: 0,
    groupe: groupe ?? null,
  };
}

function emptyPret(groupe?: string | null): DiversPretRow {
  return {
    id: tempId(),
    libelle: "",
    actif: true,
    hypothese: "COMMUNE",
    dateDebut: "",
    capital: 0,
    taux: 0,
    dureeMois: 12,
    periodicite: "MENSUELLE",
    ordre: 0,
    groupe: groupe ?? null,
  };
}

// helper to auto-generate group name
function nextGroupName(rows: { groupe?: string | null }[]): string {
  const existing = new Set(rows.filter((r) => r.groupe).map((r) => r.groupe!));
  let n = 1;
  while (existing.has(`Groupe ${n}`)) n++;
  return `Groupe ${n}`;
}

// ── Store ────────────────────────────────────────────────────────────────────────────

export const useDiversStore = create<DiversState>()(
  persist(
    (set, get) => ({
      drafts: {},

      getDraft: (dossierId) => get().drafts[dossierId] ?? EMPTY_DIVERS_DRAFT,

      hasUnsavedChanges: (dossierId) => {
        const d = get().drafts[dossierId];
        if (!d) return false;
        return (
          d.hasUnsavedRemboursementsCC ||
          d.hasUnsavedDividendes ||
          d.hasUnsavedDeblocagesParticipation ||
          d.hasUnsavedEncaissements ||
          d.hasUnsavedDecaissements ||
          d.hasUnsavedAugmentationsCapital ||
          d.hasUnsavedReductionsCapital ||
          d.hasUnsavedPrets
        );
      },

      // ── RemboursementsCC ──
      setRemboursementsCC: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), remboursementsCC: rows, hasUnsavedRemboursementsCC: false },
          },
        })),
      setRemboursementsCCRows: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), remboursementsCC: rows, hasUnsavedRemboursementsCC: true },
          },
        })),
      addRemboursementCC: (dossierId) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, remboursementsCC: [...d.remboursementsCC, emptyFlux("REMBOURSEMENT_CC")], hasUnsavedRemboursementsCC: true },
            },
          };
        }),
      addRemboursementsCCGroup: (dossierId) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, remboursementsCC: [...d.remboursementsCC, emptyFlux("REMBOURSEMENT_CC", nextGroupName(d.remboursementsCC))], hasUnsavedRemboursementsCC: true },
            },
          };
        }),
      addRemboursementsCCToGroup: (dossierId, groupe) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, remboursementsCC: [...d.remboursementsCC, emptyFlux("REMBOURSEMENT_CC", groupe)], hasUnsavedRemboursementsCC: true },
            },
          };
        }),
      updateRemboursementCC: (dossierId, id, data) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, remboursementsCC: d.remboursementsCC.map((r) => (r.id === id ? { ...r, ...data } : r)), hasUnsavedRemboursementsCC: true },
            },
          };
        }),
      removeRemboursementCC: (dossierId, id) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, remboursementsCC: d.remboursementsCC.filter((r) => r.id !== id), hasUnsavedRemboursementsCC: true },
            },
          };
        }),
      duplicateRemboursementCC: (dossierId, id) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          const idx = d.remboursementsCC.findIndex((r) => r.id === id);
          if (idx === -1) return s;
          const { id: _id, ...rest } = d.remboursementsCC[idx];
          const copy = { ...rest, id: tempId(), libelle: `${rest.libelle} (copie)` };
          const rows = [...d.remboursementsCC];
          rows.splice(idx + 1, 0, copy);
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, remboursementsCC: rows, hasUnsavedRemboursementsCC: true },
            },
          };
        }),
      markRemboursementsCCSaved: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), remboursementsCC: rows, hasUnsavedRemboursementsCC: false },
          },
        })),

      // ── Dividendes ──
      setDividendes: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), dividendes: rows, hasUnsavedDividendes: false },
          },
        })),
      setDividendesRows: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), dividendes: rows, hasUnsavedDividendes: true },
          },
        })),
      addDividende: (dossierId) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, dividendes: [...d.dividendes, emptyFlux("DIVIDENDE")], hasUnsavedDividendes: true },
            },
          };
        }),
      addDividendesGroup: (dossierId) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, dividendes: [...d.dividendes, emptyFlux("DIVIDENDE", nextGroupName(d.dividendes))], hasUnsavedDividendes: true },
            },
          };
        }),
      addDividendesToGroup: (dossierId, groupe) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, dividendes: [...d.dividendes, emptyFlux("DIVIDENDE", groupe)], hasUnsavedDividendes: true },
            },
          };
        }),
      updateDividende: (dossierId, id, data) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, dividendes: d.dividendes.map((r) => (r.id === id ? { ...r, ...data } : r)), hasUnsavedDividendes: true },
            },
          };
        }),
      removeDividende: (dossierId, id) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, dividendes: d.dividendes.filter((r) => r.id !== id), hasUnsavedDividendes: true },
            },
          };
        }),
      duplicateDividende: (dossierId, id) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          const idx = d.dividendes.findIndex((r) => r.id === id);
          if (idx === -1) return s;
          const { id: _id, ...rest } = d.dividendes[idx];
          const copy = { ...rest, id: tempId(), libelle: `${rest.libelle} (copie)` };
          const rows = [...d.dividendes];
          rows.splice(idx + 1, 0, copy);
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, dividendes: rows, hasUnsavedDividendes: true },
            },
          };
        }),
      markDividendesSaved: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), dividendes: rows, hasUnsavedDividendes: false },
          },
        })),

      // ── DeblocagesParticipation ──
      setDeblocagesParticipation: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), deblocagesParticipation: rows, hasUnsavedDeblocagesParticipation: false },
          },
        })),
      setDeblocagesParticipationRows: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), deblocagesParticipation: rows, hasUnsavedDeblocagesParticipation: true },
          },
        })),
      addDeblocageParticipation: (dossierId) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, deblocagesParticipation: [...d.deblocagesParticipation, emptyFlux("DEBLOCAGE_PARTICIPATION")], hasUnsavedDeblocagesParticipation: true },
            },
          };
        }),
      addDeblocagesParticipationGroup: (dossierId) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, deblocagesParticipation: [...d.deblocagesParticipation, emptyFlux("DEBLOCAGE_PARTICIPATION", nextGroupName(d.deblocagesParticipation))], hasUnsavedDeblocagesParticipation: true },
            },
          };
        }),
      addDeblocagesParticipationToGroup: (dossierId, groupe) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, deblocagesParticipation: [...d.deblocagesParticipation, emptyFlux("DEBLOCAGE_PARTICIPATION", groupe)], hasUnsavedDeblocagesParticipation: true },
            },
          };
        }),
      updateDeblocageParticipation: (dossierId, id, data) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, deblocagesParticipation: d.deblocagesParticipation.map((r) => (r.id === id ? { ...r, ...data } : r)), hasUnsavedDeblocagesParticipation: true },
            },
          };
        }),
      removeDeblocageParticipation: (dossierId, id) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, deblocagesParticipation: d.deblocagesParticipation.filter((r) => r.id !== id), hasUnsavedDeblocagesParticipation: true },
            },
          };
        }),
      duplicateDeblocageParticipation: (dossierId, id) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          const idx = d.deblocagesParticipation.findIndex((r) => r.id === id);
          if (idx === -1) return s;
          const { id: _id, ...rest } = d.deblocagesParticipation[idx];
          const copy = { ...rest, id: tempId(), libelle: `${rest.libelle} (copie)` };
          const rows = [...d.deblocagesParticipation];
          rows.splice(idx + 1, 0, copy);
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, deblocagesParticipation: rows, hasUnsavedDeblocagesParticipation: true },
            },
          };
        }),
      markDeblocagesParticipationSaved: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), deblocagesParticipation: rows, hasUnsavedDeblocagesParticipation: false },
          },
        })),

      // ── Encaissements ──
      setEncaissements: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), encaissements: rows, hasUnsavedEncaissements: false },
          },
        })),
      setEncaissementsRows: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), encaissements: rows, hasUnsavedEncaissements: true },
          },
        })),
      addEncaissement: (dossierId) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, encaissements: [...d.encaissements, emptyFlux("ENCAISSEMENT")], hasUnsavedEncaissements: true },
            },
          };
        }),
      addEncaissementsGroup: (dossierId) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, encaissements: [...d.encaissements, emptyFlux("ENCAISSEMENT", nextGroupName(d.encaissements))], hasUnsavedEncaissements: true },
            },
          };
        }),
      addEncaissementsToGroup: (dossierId, groupe) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, encaissements: [...d.encaissements, emptyFlux("ENCAISSEMENT", groupe)], hasUnsavedEncaissements: true },
            },
          };
        }),
      updateEncaissement: (dossierId, id, data) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, encaissements: d.encaissements.map((r) => (r.id === id ? { ...r, ...data } : r)), hasUnsavedEncaissements: true },
            },
          };
        }),
      removeEncaissement: (dossierId, id) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, encaissements: d.encaissements.filter((r) => r.id !== id), hasUnsavedEncaissements: true },
            },
          };
        }),
      duplicateEncaissement: (dossierId, id) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          const idx = d.encaissements.findIndex((r) => r.id === id);
          if (idx === -1) return s;
          const { id: _id, ...rest } = d.encaissements[idx];
          const copy = { ...rest, id: tempId(), libelle: `${rest.libelle} (copie)` };
          const rows = [...d.encaissements];
          rows.splice(idx + 1, 0, copy);
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, encaissements: rows, hasUnsavedEncaissements: true },
            },
          };
        }),
      markEncaissementsSaved: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), encaissements: rows, hasUnsavedEncaissements: false },
          },
        })),

      // ── Decaissements ──
      setDecaissements: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), decaissements: rows, hasUnsavedDecaissements: false },
          },
        })),
      setDecaissementsRows: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), decaissements: rows, hasUnsavedDecaissements: true },
          },
        })),
      addDecaissement: (dossierId) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, decaissements: [...d.decaissements, emptyFlux("DECAISSEMENT")], hasUnsavedDecaissements: true },
            },
          };
        }),
      addDecaissementsGroup: (dossierId) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, decaissements: [...d.decaissements, emptyFlux("DECAISSEMENT", nextGroupName(d.decaissements))], hasUnsavedDecaissements: true },
            },
          };
        }),
      addDecaissementsToGroup: (dossierId, groupe) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, decaissements: [...d.decaissements, emptyFlux("DECAISSEMENT", groupe)], hasUnsavedDecaissements: true },
            },
          };
        }),
      updateDecaissement: (dossierId, id, data) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, decaissements: d.decaissements.map((r) => (r.id === id ? { ...r, ...data } : r)), hasUnsavedDecaissements: true },
            },
          };
        }),
      removeDecaissement: (dossierId, id) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, decaissements: d.decaissements.filter((r) => r.id !== id), hasUnsavedDecaissements: true },
            },
          };
        }),
      duplicateDecaissement: (dossierId, id) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          const idx = d.decaissements.findIndex((r) => r.id === id);
          if (idx === -1) return s;
          const { id: _id, ...rest } = d.decaissements[idx];
          const copy = { ...rest, id: tempId(), libelle: `${rest.libelle} (copie)` };
          const rows = [...d.decaissements];
          rows.splice(idx + 1, 0, copy);
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, decaissements: rows, hasUnsavedDecaissements: true },
            },
          };
        }),
      markDecaissementsSaved: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), decaissements: rows, hasUnsavedDecaissements: false },
          },
        })),

      // ── AugmentationsCapital ──
      setAugmentationsCapital: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), augmentationsCapital: rows, hasUnsavedAugmentationsCapital: false },
          },
        })),
      setAugmentationsCapitalRows: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), augmentationsCapital: rows, hasUnsavedAugmentationsCapital: true },
          },
        })),
      addAugmentationCapital: (dossierId) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, augmentationsCapital: [...d.augmentationsCapital, emptyOperationCapital("AUGMENTATION_INCORPORATION")], hasUnsavedAugmentationsCapital: true },
            },
          };
        }),
      addAugmentationsCapitalGroup: (dossierId) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, augmentationsCapital: [...d.augmentationsCapital, emptyOperationCapital("AUGMENTATION_INCORPORATION", nextGroupName(d.augmentationsCapital))], hasUnsavedAugmentationsCapital: true },
            },
          };
        }),
      addAugmentationsCapitalToGroup: (dossierId, groupe) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, augmentationsCapital: [...d.augmentationsCapital, emptyOperationCapital("AUGMENTATION_INCORPORATION", groupe)], hasUnsavedAugmentationsCapital: true },
            },
          };
        }),
      updateAugmentationCapital: (dossierId, id, data) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, augmentationsCapital: d.augmentationsCapital.map((r) => (r.id === id ? { ...r, ...data } : r)), hasUnsavedAugmentationsCapital: true },
            },
          };
        }),
      removeAugmentationCapital: (dossierId, id) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, augmentationsCapital: d.augmentationsCapital.filter((r) => r.id !== id), hasUnsavedAugmentationsCapital: true },
            },
          };
        }),
      duplicateAugmentationCapital: (dossierId, id) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          const idx = d.augmentationsCapital.findIndex((r) => r.id === id);
          if (idx === -1) return s;
          const { id: _id, ...rest } = d.augmentationsCapital[idx];
          const copy = { ...rest, id: tempId(), libelle: `${rest.libelle} (copie)` };
          const rows = [...d.augmentationsCapital];
          rows.splice(idx + 1, 0, copy);
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, augmentationsCapital: rows, hasUnsavedAugmentationsCapital: true },
            },
          };
        }),
      markAugmentationsCapitalSaved: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), augmentationsCapital: rows, hasUnsavedAugmentationsCapital: false },
          },
        })),

      // ── ReductionsCapital ──
      setReductionsCapital: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), reductionsCapital: rows, hasUnsavedReductionsCapital: false },
          },
        })),
      setReductionsCapitalRows: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), reductionsCapital: rows, hasUnsavedReductionsCapital: true },
          },
        })),
      addReductionCapital: (dossierId) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, reductionsCapital: [...d.reductionsCapital, emptyOperationCapital("REDUCTION")], hasUnsavedReductionsCapital: true },
            },
          };
        }),
      addReductionsCapitalGroup: (dossierId) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, reductionsCapital: [...d.reductionsCapital, emptyOperationCapital("REDUCTION", nextGroupName(d.reductionsCapital))], hasUnsavedReductionsCapital: true },
            },
          };
        }),
      addReductionsCapitalToGroup: (dossierId, groupe) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, reductionsCapital: [...d.reductionsCapital, emptyOperationCapital("REDUCTION", groupe)], hasUnsavedReductionsCapital: true },
            },
          };
        }),
      updateReductionCapital: (dossierId, id, data) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, reductionsCapital: d.reductionsCapital.map((r) => (r.id === id ? { ...r, ...data } : r)), hasUnsavedReductionsCapital: true },
            },
          };
        }),
      removeReductionCapital: (dossierId, id) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, reductionsCapital: d.reductionsCapital.filter((r) => r.id !== id), hasUnsavedReductionsCapital: true },
            },
          };
        }),
      duplicateReductionCapital: (dossierId, id) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          const idx = d.reductionsCapital.findIndex((r) => r.id === id);
          if (idx === -1) return s;
          const { id: _id, ...rest } = d.reductionsCapital[idx];
          const copy = { ...rest, id: tempId(), libelle: `${rest.libelle} (copie)` };
          const rows = [...d.reductionsCapital];
          rows.splice(idx + 1, 0, copy);
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, reductionsCapital: rows, hasUnsavedReductionsCapital: true },
            },
          };
        }),
      markReductionsCapitalSaved: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), reductionsCapital: rows, hasUnsavedReductionsCapital: false },
          },
        })),

      // ── Prêts inter-entreprises ──
      setPrets: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), prets: rows, hasUnsavedPrets: false },
          },
        })),
      setPretsRows: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), prets: rows, hasUnsavedPrets: true },
          },
        })),
      addPret: (dossierId) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, prets: [...d.prets, emptyPret()], hasUnsavedPrets: true },
            },
          };
        }),
      addPretsGroup: (dossierId) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, prets: [...d.prets, emptyPret(nextGroupName(d.prets))], hasUnsavedPrets: true },
            },
          };
        }),
      addPretsToGroup: (dossierId, groupe) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, prets: [...d.prets, emptyPret(groupe)], hasUnsavedPrets: true },
            },
          };
        }),
      updatePret: (dossierId, id, data) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, prets: d.prets.map((r) => (r.id === id ? { ...r, ...data } : r)), hasUnsavedPrets: true },
            },
          };
        }),
      removePret: (dossierId, id) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, prets: d.prets.filter((r) => r.id !== id), hasUnsavedPrets: true },
            },
          };
        }),
      duplicatePret: (dossierId, id) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          const idx = d.prets.findIndex((r) => r.id === id);
          if (idx === -1) return s;
          const { id: _id, ...rest } = d.prets[idx];
          const copy = { ...rest, id: tempId(), libelle: `${rest.libelle} (copie)` };
          const rows = [...d.prets];
          rows.splice(idx + 1, 0, copy);
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, prets: rows, hasUnsavedPrets: true },
            },
          };
        }),
      markPretsSaved: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), prets: rows, hasUnsavedPrets: false },
          },
        })),

      clearDraft: (dossierId) =>
        set((s) => {
          const { [dossierId]: _, ...rest } = s.drafts;
          return { drafts: rest };
        }),
    }),
    {
      name: "divers-store",
      partialize: (state) => ({ drafts: state.drafts }),
    }
  )
);
