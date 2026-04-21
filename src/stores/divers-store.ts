import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  DiversFluxDateRow,
  DiversOperationCapitalRow,
  DiversPretRow,
} from "@/lib/schemas/divers";

// ── Types ────────────────────────────────────────────────────────────────────

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
  addRemboursementCC: (dossierId: string) => void;
  updateRemboursementCC: (dossierId: string, index: number, data: Partial<DiversFluxDateRow>) => void;
  removeRemboursementCC: (dossierId: string, index: number) => void;
  duplicateRemboursementCC: (dossierId: string, index: number) => void;
  markRemboursementsCCSaved: (dossierId: string, rows: DiversFluxDateRow[]) => void;

  // --- Dividendes ---
  setDividendes: (dossierId: string, rows: DiversFluxDateRow[]) => void;
  addDividende: (dossierId: string) => void;
  updateDividende: (dossierId: string, index: number, data: Partial<DiversFluxDateRow>) => void;
  removeDividende: (dossierId: string, index: number) => void;
  duplicateDividende: (dossierId: string, index: number) => void;
  markDividendesSaved: (dossierId: string, rows: DiversFluxDateRow[]) => void;

  // --- Déblocages participation ---
  setDeblocagesParticipation: (dossierId: string, rows: DiversFluxDateRow[]) => void;
  addDeblocageParticipation: (dossierId: string) => void;
  updateDeblocageParticipation: (dossierId: string, index: number, data: Partial<DiversFluxDateRow>) => void;
  removeDeblocageParticipation: (dossierId: string, index: number) => void;
  duplicateDeblocageParticipation: (dossierId: string, index: number) => void;
  markDeblocagesParticipationSaved: (dossierId: string, rows: DiversFluxDateRow[]) => void;

  // --- Encaissements ---
  setEncaissements: (dossierId: string, rows: DiversFluxDateRow[]) => void;
  addEncaissement: (dossierId: string) => void;
  updateEncaissement: (dossierId: string, index: number, data: Partial<DiversFluxDateRow>) => void;
  removeEncaissement: (dossierId: string, index: number) => void;
  duplicateEncaissement: (dossierId: string, index: number) => void;
  markEncaissementsSaved: (dossierId: string, rows: DiversFluxDateRow[]) => void;

  // --- Décaissements ---
  setDecaissements: (dossierId: string, rows: DiversFluxDateRow[]) => void;
  addDecaissement: (dossierId: string) => void;
  updateDecaissement: (dossierId: string, index: number, data: Partial<DiversFluxDateRow>) => void;
  removeDecaissement: (dossierId: string, index: number) => void;
  duplicateDecaissement: (dossierId: string, index: number) => void;
  markDecaissementsSaved: (dossierId: string, rows: DiversFluxDateRow[]) => void;

  // --- Augmentations de capital ---
  setAugmentationsCapital: (dossierId: string, rows: DiversOperationCapitalRow[]) => void;
  addAugmentationCapital: (dossierId: string) => void;
  updateAugmentationCapital: (dossierId: string, index: number, data: Partial<DiversOperationCapitalRow>) => void;
  removeAugmentationCapital: (dossierId: string, index: number) => void;
  duplicateAugmentationCapital: (dossierId: string, index: number) => void;
  markAugmentationsCapitalSaved: (dossierId: string, rows: DiversOperationCapitalRow[]) => void;

  // --- Réductions de capital ---
  setReductionsCapital: (dossierId: string, rows: DiversOperationCapitalRow[]) => void;
  addReductionCapital: (dossierId: string) => void;
  updateReductionCapital: (dossierId: string, index: number, data: Partial<DiversOperationCapitalRow>) => void;
  removeReductionCapital: (dossierId: string, index: number) => void;
  duplicateReductionCapital: (dossierId: string, index: number) => void;
  markReductionsCapitalSaved: (dossierId: string, rows: DiversOperationCapitalRow[]) => void;

  // --- Prêts inter-entreprises ---
  setPrets: (dossierId: string, rows: DiversPretRow[]) => void;
  addPret: (dossierId: string) => void;
  updatePret: (dossierId: string, index: number, data: Partial<DiversPretRow>) => void;
  removePret: (dossierId: string, index: number) => void;
  duplicatePret: (dossierId: string, index: number) => void;
  markPretsSaved: (dossierId: string, rows: DiversPretRow[]) => void;

  clearDraft: (dossierId: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function emptyFlux(type: DiversFluxDateRow["type"]): DiversFluxDateRow {
  return {
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
  };
}

function emptyOperationCapital(type: DiversOperationCapitalRow["type"]): DiversOperationCapitalRow {
  return {
    libelle: "",
    actif: true,
    hypothese: "COMMUNE",
    type,
    date: "",
    montantN: 0,
    montantN1: 0,
    montantN2: 0,
    ordre: 0,
  };
}

function emptyPret(): DiversPretRow {
  return {
    libelle: "",
    actif: true,
    hypothese: "COMMUNE",
    dateDebut: "",
    capital: 0,
    taux: 0,
    dureeMois: 12,
    periodicite: "MENSUELLE",
    ordre: 0,
  };
}

function updateAt<T>(arr: T[], index: number, data: Partial<T>): T[] {
  return arr.map((item, i) => (i === index ? { ...item, ...data } : item));
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useDiversStore = create<DiversState>()(
  persist(
    (set, get) => ({
      drafts: {},

      getDraft: (dossierId) => get().drafts[dossierId] ?? emptyDraft(),

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

      // ── Remboursements C/C ──────────────────────────────────────────────────
      setRemboursementsCC: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), remboursementsCC: rows, hasUnsavedRemboursementsCC: false },
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
      updateRemboursementCC: (dossierId, index, data) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, remboursementsCC: updateAt(d.remboursementsCC, index, data), hasUnsavedRemboursementsCC: true },
            },
          };
        }),
      removeRemboursementCC: (dossierId, index) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, remboursementsCC: d.remboursementsCC.filter((_, i) => i !== index), hasUnsavedRemboursementsCC: true },
            },
          };
        }),
      duplicateRemboursementCC: (dossierId, index) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          const source = d.remboursementsCC[index];
          if (!source) return s;
          const { id, ...rest } = source;
          const rows = [...d.remboursementsCC];
          rows.splice(index + 1, 0, { ...rest, libelle: `${rest.libelle} (copie)` });
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

      // ── Dividendes ──────────────────────────────────────────────────────────
      setDividendes: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), dividendes: rows, hasUnsavedDividendes: false },
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
      updateDividende: (dossierId, index, data) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, dividendes: updateAt(d.dividendes, index, data), hasUnsavedDividendes: true },
            },
          };
        }),
      removeDividende: (dossierId, index) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, dividendes: d.dividendes.filter((_, i) => i !== index), hasUnsavedDividendes: true },
            },
          };
        }),
      duplicateDividende: (dossierId, index) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          const source = d.dividendes[index];
          if (!source) return s;
          const { id, ...rest } = source;
          const rows = [...d.dividendes];
          rows.splice(index + 1, 0, { ...rest, libelle: `${rest.libelle} (copie)` });
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

      // ── Déblocages participation ─────────────────────────────────────────────
      setDeblocagesParticipation: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), deblocagesParticipation: rows, hasUnsavedDeblocagesParticipation: false },
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
      updateDeblocageParticipation: (dossierId, index, data) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, deblocagesParticipation: updateAt(d.deblocagesParticipation, index, data), hasUnsavedDeblocagesParticipation: true },
            },
          };
        }),
      removeDeblocageParticipation: (dossierId, index) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, deblocagesParticipation: d.deblocagesParticipation.filter((_, i) => i !== index), hasUnsavedDeblocagesParticipation: true },
            },
          };
        }),
      duplicateDeblocageParticipation: (dossierId, index) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          const source = d.deblocagesParticipation[index];
          if (!source) return s;
          const { id, ...rest } = source;
          const rows = [...d.deblocagesParticipation];
          rows.splice(index + 1, 0, { ...rest, libelle: `${rest.libelle} (copie)` });
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

      // ── Encaissements ────────────────────────────────────────────────────────
      setEncaissements: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), encaissements: rows, hasUnsavedEncaissements: false },
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
      updateEncaissement: (dossierId, index, data) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, encaissements: updateAt(d.encaissements, index, data), hasUnsavedEncaissements: true },
            },
          };
        }),
      removeEncaissement: (dossierId, index) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, encaissements: d.encaissements.filter((_, i) => i !== index), hasUnsavedEncaissements: true },
            },
          };
        }),
      duplicateEncaissement: (dossierId, index) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          const source = d.encaissements[index];
          if (!source) return s;
          const { id, ...rest } = source;
          const rows = [...d.encaissements];
          rows.splice(index + 1, 0, { ...rest, libelle: `${rest.libelle} (copie)` });
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

      // ── Décaissements ───────────────────────────────────────────────────────
      setDecaissements: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), decaissements: rows, hasUnsavedDecaissements: false },
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
      updateDecaissement: (dossierId, index, data) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, decaissements: updateAt(d.decaissements, index, data), hasUnsavedDecaissements: true },
            },
          };
        }),
      removeDecaissement: (dossierId, index) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, decaissements: d.decaissements.filter((_, i) => i !== index), hasUnsavedDecaissements: true },
            },
          };
        }),
      duplicateDecaissement: (dossierId, index) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          const source = d.decaissements[index];
          if (!source) return s;
          const { id, ...rest } = source;
          const rows = [...d.decaissements];
          rows.splice(index + 1, 0, { ...rest, libelle: `${rest.libelle} (copie)` });
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

      // ── Augmentations de capital ─────────────────────────────────────────────
      setAugmentationsCapital: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), augmentationsCapital: rows, hasUnsavedAugmentationsCapital: false },
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
      updateAugmentationCapital: (dossierId, index, data) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, augmentationsCapital: updateAt(d.augmentationsCapital, index, data), hasUnsavedAugmentationsCapital: true },
            },
          };
        }),
      removeAugmentationCapital: (dossierId, index) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, augmentationsCapital: d.augmentationsCapital.filter((_, i) => i !== index), hasUnsavedAugmentationsCapital: true },
            },
          };
        }),
      duplicateAugmentationCapital: (dossierId, index) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          const source = d.augmentationsCapital[index];
          if (!source) return s;
          const { id, ...rest } = source;
          const rows = [...d.augmentationsCapital];
          rows.splice(index + 1, 0, { ...rest, libelle: `${rest.libelle} (copie)` });
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

      // ── Réductions de capital ────────────────────────────────────────────────
      setReductionsCapital: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), reductionsCapital: rows, hasUnsavedReductionsCapital: false },
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
      updateReductionCapital: (dossierId, index, data) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, reductionsCapital: updateAt(d.reductionsCapital, index, data), hasUnsavedReductionsCapital: true },
            },
          };
        }),
      removeReductionCapital: (dossierId, index) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, reductionsCapital: d.reductionsCapital.filter((_, i) => i !== index), hasUnsavedReductionsCapital: true },
            },
          };
        }),
      duplicateReductionCapital: (dossierId, index) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          const source = d.reductionsCapital[index];
          if (!source) return s;
          const { id, ...rest } = source;
          const rows = [...d.reductionsCapital];
          rows.splice(index + 1, 0, { ...rest, libelle: `${rest.libelle} (copie)` });
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

      // ── Prêts inter-entreprises ──────────────────────────────────────────────
      setPrets: (dossierId, rows) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [dossierId]: { ...(s.drafts[dossierId] ?? emptyDraft()), prets: rows, hasUnsavedPrets: false },
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
      updatePret: (dossierId, index, data) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, prets: updateAt(d.prets, index, data), hasUnsavedPrets: true },
            },
          };
        }),
      removePret: (dossierId, index) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          return {
            drafts: {
              ...s.drafts,
              [dossierId]: { ...d, prets: d.prets.filter((_, i) => i !== index), hasUnsavedPrets: true },
            },
          };
        }),
      duplicatePret: (dossierId, index) =>
        set((s) => {
          const d = s.drafts[dossierId] ?? emptyDraft();
          const source = d.prets[index];
          if (!source) return s;
          const { id, ...rest } = source;
          const rows = [...d.prets];
          rows.splice(index + 1, 0, { ...rest, libelle: `${rest.libelle} (copie)` });
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
