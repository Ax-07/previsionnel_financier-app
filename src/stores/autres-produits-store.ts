import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AutreProduitRepriseRow,
  AutreProduitDateRow,
  AutreProduitConstateRow,
} from "@/lib/schemas/autres-produits";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AutresProduitsDraft {
  reprises: AutreProduitRepriseRow[];
  transferts: AutreProduitDateRow[];
  gestionCourante: AutreProduitDateRow[];
  financiers: AutreProduitDateRow[];
  exceptionnels: AutreProduitDateRow[];
  pca: AutreProduitConstateRow[];

  hasUnsavedReprises: boolean;
  hasUnsavedTransferts: boolean;
  hasUnsavedGestionCourante: boolean;
  hasUnsavedFinanciers: boolean;
  hasUnsavedExceptionnels: boolean;
  hasUnsavedPCA: boolean;
}

export interface AutresProduitsState {
  drafts: Record<string, AutresProduitsDraft>;

  getDraft: (dossierId: string) => AutresProduitsDraft;
  hasUnsavedChanges: (dossierId: string) => boolean;

  // Reprises
  setReprises: (dossierId: string, rows: AutreProduitRepriseRow[]) => void;
  addReprise: (dossierId: string) => void;
  updateReprise: (dossierId: string, index: number, data: Partial<AutreProduitRepriseRow>) => void;
  removeReprise: (dossierId: string, index: number) => void;
  duplicateReprise: (dossierId: string, index: number) => void;
  markReprisesSaved: (dossierId: string, rows: AutreProduitRepriseRow[]) => void;

  // Transferts
  setTransferts: (dossierId: string, rows: AutreProduitDateRow[]) => void;
  addTransfert: (dossierId: string) => void;
  updateTransfert: (dossierId: string, index: number, data: Partial<AutreProduitDateRow>) => void;
  removeTransfert: (dossierId: string, index: number) => void;
  duplicateTransfert: (dossierId: string, index: number) => void;
  markTransfertsSaved: (dossierId: string, rows: AutreProduitDateRow[]) => void;

  // Gestion courante
  setGestionCourante: (dossierId: string, rows: AutreProduitDateRow[]) => void;
  addGestionCourante: (dossierId: string) => void;
  updateGestionCourante: (dossierId: string, index: number, data: Partial<AutreProduitDateRow>) => void;
  removeGestionCourante: (dossierId: string, index: number) => void;
  duplicateGestionCourante: (dossierId: string, index: number) => void;
  markGestionCouranteSaved: (dossierId: string, rows: AutreProduitDateRow[]) => void;

  // Financiers
  setFinanciers: (dossierId: string, rows: AutreProduitDateRow[]) => void;
  addFinancier: (dossierId: string) => void;
  updateFinancier: (dossierId: string, index: number, data: Partial<AutreProduitDateRow>) => void;
  removeFinancier: (dossierId: string, index: number) => void;
  duplicateFinancier: (dossierId: string, index: number) => void;
  markFinanciersSaved: (dossierId: string, rows: AutreProduitDateRow[]) => void;

  // Exceptionnels
  setExceptionnels: (dossierId: string, rows: AutreProduitDateRow[]) => void;
  addExceptionnel: (dossierId: string) => void;
  updateExceptionnel: (dossierId: string, index: number, data: Partial<AutreProduitDateRow>) => void;
  removeExceptionnel: (dossierId: string, index: number) => void;
  duplicateExceptionnel: (dossierId: string, index: number) => void;
  markExceptionnelsSaved: (dossierId: string, rows: AutreProduitDateRow[]) => void;

  // PCA
  setPCA: (dossierId: string, rows: AutreProduitConstateRow[]) => void;
  addPCA: (dossierId: string) => void;
  updatePCA: (dossierId: string, index: number, data: Partial<AutreProduitConstateRow>) => void;
  removePCA: (dossierId: string, index: number) => void;
  duplicatePCA: (dossierId: string, index: number) => void;
  markPCASaved: (dossierId: string, rows: AutreProduitConstateRow[]) => void;

  clearDraft: (dossierId: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function emptyReprise(): AutreProduitRepriseRow {
  return { id: `__new__${crypto.randomUUID()}`, libelle: "", actif: true, hypothese: "COMMUNE", nature: "", montantN: 0, montantN1: 0, montantN2: 0, ordre: 0 };
}

function emptyDate(
  categorie: "TRANSFERT" | "GESTION_COURANTE" | "FINANCIER" | "EXCEPTIONNEL"
): AutreProduitDateRow {
  return {
    id: `__new__${crypto.randomUUID()}`,
    libelle: "",
    actif: true,
    hypothese: "COMMUNE",
    categorie,
    dateN: "",
    montantN: 0,
    dateN1: "",
    montantN1: 0,
    dateN2: "",
    montantN2: 0,
    tauxTVA: 0,
    typeTVA: null,
    ordre: 0,
  };
}

function emptyConstate(): AutreProduitConstateRow {
  return { id: `__new__${crypto.randomUUID()}`, libelle: "", actif: true, hypothese: "COMMUNE", nature: "", montantN: 0, montantN1: 0, montantN2: 0, ordre: 0 };
}

function getEmptyDraft(): AutresProduitsDraft {
  return {
    reprises: [],
    transferts: [],
    gestionCourante: [],
    financiers: [],
    exceptionnels: [],
    pca: [],
    hasUnsavedReprises: false,
    hasUnsavedTransferts: false,
    hasUnsavedGestionCourante: false,
    hasUnsavedFinanciers: false,
    hasUnsavedExceptionnels: false,
    hasUnsavedPCA: false,
  };
}

function patchDraft(
  state: AutresProduitsState,
  dossierId: string,
  patch: Partial<AutresProduitsDraft>
): Pick<AutresProduitsState, "drafts"> {
  return {
    drafts: {
      ...state.drafts,
      [dossierId]: { ...(state.drafts[dossierId] ?? getEmptyDraft()), ...patch },
    },
  };
}

function updateRow<T>(rows: T[], index: number, data: Partial<T>): T[] {
  const copy = [...rows];
  if (copy[index] !== undefined) copy[index] = { ...copy[index]!, ...data };
  return copy;
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useAutresProduitsStore = create<AutresProduitsState>()(
  persist(
    (set, get) => ({
      drafts: {},

      getDraft(dossierId) {
        return get().drafts[dossierId] ?? getEmptyDraft();
      },

      hasUnsavedChanges(dossierId) {
        const d = get().drafts[dossierId];
        if (!d) return false;
        return (
          d.hasUnsavedReprises ||
          d.hasUnsavedTransferts ||
          d.hasUnsavedGestionCourante ||
          d.hasUnsavedFinanciers ||
          d.hasUnsavedExceptionnels ||
          d.hasUnsavedPCA
        );
      },

      // ── Reprises ─────────────────────────────────────────────────────────

      setReprises(dossierId, rows) {
        set((s) => patchDraft(s, dossierId, { reprises: rows, hasUnsavedReprises: false }));
      },
      addReprise(dossierId) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            reprises: [...d.reprises, emptyReprise()],
            hasUnsavedReprises: true,
          });
        });
      },
      updateReprise(dossierId, index, data) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            reprises: updateRow(d.reprises, index, data),
            hasUnsavedReprises: true,
          });
        });
      },
      removeReprise(dossierId, index) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            reprises: d.reprises.filter((_, i) => i !== index),
            hasUnsavedReprises: true,
          });
        });
      },
      duplicateReprise(dossierId, index) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          const source = d.reprises[index];
          if (!source) return s;
          const { id: _id, ...rest } = source;
          const rows = [...d.reprises];
          rows.splice(index + 1, 0, { ...rest, id: `__new__${crypto.randomUUID()}`, libelle: `${rest.libelle} (copie)` });
          return patchDraft(s, dossierId, { reprises: rows, hasUnsavedReprises: true });
        });
      },
      markReprisesSaved(dossierId, rows) {
        set((s) => patchDraft(s, dossierId, { reprises: rows, hasUnsavedReprises: false }));
      },

      // ── Transferts ───────────────────────────────────────────────────────

      setTransferts(dossierId, rows) {
        set((s) => patchDraft(s, dossierId, { transferts: rows, hasUnsavedTransferts: false }));
      },
      addTransfert(dossierId) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            transferts: [...d.transferts, emptyDate("TRANSFERT")],
            hasUnsavedTransferts: true,
          });
        });
      },
      updateTransfert(dossierId, index, data) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            transferts: updateRow(d.transferts, index, data),
            hasUnsavedTransferts: true,
          });
        });
      },
      removeTransfert(dossierId, index) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            transferts: d.transferts.filter((_, i) => i !== index),
            hasUnsavedTransferts: true,
          });
        });
      },
      duplicateTransfert(dossierId, index) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          const source = d.transferts[index];
          if (!source) return s;
          const { id: _id, ...rest } = source;
          const rows = [...d.transferts];
          rows.splice(index + 1, 0, { ...rest, id: `__new__${crypto.randomUUID()}`, libelle: `${rest.libelle} (copie)` });
          return patchDraft(s, dossierId, { transferts: rows, hasUnsavedTransferts: true });
        });
      },
      markTransfertsSaved(dossierId, rows) {
        set((s) => patchDraft(s, dossierId, { transferts: rows, hasUnsavedTransferts: false }));
      },

      // ── Gestion courante ─────────────────────────────────────────────────

      setGestionCourante(dossierId, rows) {
        set((s) => patchDraft(s, dossierId, { gestionCourante: rows, hasUnsavedGestionCourante: false }));
      },
      addGestionCourante(dossierId) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            gestionCourante: [...d.gestionCourante, emptyDate("GESTION_COURANTE")],
            hasUnsavedGestionCourante: true,
          });
        });
      },
      updateGestionCourante(dossierId, index, data) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            gestionCourante: updateRow(d.gestionCourante, index, data),
            hasUnsavedGestionCourante: true,
          });
        });
      },
      removeGestionCourante(dossierId, index) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            gestionCourante: d.gestionCourante.filter((_, i) => i !== index),
            hasUnsavedGestionCourante: true,
          });
        });
      },
      duplicateGestionCourante(dossierId, index) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          const source = d.gestionCourante[index];
          if (!source) return s;
          const { id: _id, ...rest } = source;
          const rows = [...d.gestionCourante];
          rows.splice(index + 1, 0, { ...rest, id: `__new__${crypto.randomUUID()}`, libelle: `${rest.libelle} (copie)` });
          return patchDraft(s, dossierId, { gestionCourante: rows, hasUnsavedGestionCourante: true });
        });
      },
      markGestionCouranteSaved(dossierId, rows) {
        set((s) => patchDraft(s, dossierId, { gestionCourante: rows, hasUnsavedGestionCourante: false }));
      },

      // ── Financiers ───────────────────────────────────────────────────────

      setFinanciers(dossierId, rows) {
        set((s) => patchDraft(s, dossierId, { financiers: rows, hasUnsavedFinanciers: false }));
      },
      addFinancier(dossierId) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            financiers: [...d.financiers, emptyDate("FINANCIER")],
            hasUnsavedFinanciers: true,
          });
        });
      },
      updateFinancier(dossierId, index, data) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            financiers: updateRow(d.financiers, index, data),
            hasUnsavedFinanciers: true,
          });
        });
      },
      removeFinancier(dossierId, index) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            financiers: d.financiers.filter((_, i) => i !== index),
            hasUnsavedFinanciers: true,
          });
        });
      },
      duplicateFinancier(dossierId, index) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          const source = d.financiers[index];
          if (!source) return s;
          const { id: _id, ...rest } = source;
          const rows = [...d.financiers];
          rows.splice(index + 1, 0, { ...rest, id: `__new__${crypto.randomUUID()}`, libelle: `${rest.libelle} (copie)` });
          return patchDraft(s, dossierId, { financiers: rows, hasUnsavedFinanciers: true });
        });
      },
      markFinanciersSaved(dossierId, rows) {
        set((s) => patchDraft(s, dossierId, { financiers: rows, hasUnsavedFinanciers: false }));
      },

      // ── Exceptionnels ────────────────────────────────────────────────────

      setExceptionnels(dossierId, rows) {
        set((s) => patchDraft(s, dossierId, { exceptionnels: rows, hasUnsavedExceptionnels: false }));
      },
      addExceptionnel(dossierId) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            exceptionnels: [...d.exceptionnels, emptyDate("EXCEPTIONNEL")],
            hasUnsavedExceptionnels: true,
          });
        });
      },
      updateExceptionnel(dossierId, index, data) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            exceptionnels: updateRow(d.exceptionnels, index, data),
            hasUnsavedExceptionnels: true,
          });
        });
      },
      removeExceptionnel(dossierId, index) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            exceptionnels: d.exceptionnels.filter((_, i) => i !== index),
            hasUnsavedExceptionnels: true,
          });
        });
      },
      duplicateExceptionnel(dossierId, index) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          const source = d.exceptionnels[index];
          if (!source) return s;
          const { id: _id, ...rest } = source;
          const rows = [...d.exceptionnels];
          rows.splice(index + 1, 0, { ...rest, id: `__new__${crypto.randomUUID()}`, libelle: `${rest.libelle} (copie)` });
          return patchDraft(s, dossierId, { exceptionnels: rows, hasUnsavedExceptionnels: true });
        });
      },
      markExceptionnelsSaved(dossierId, rows) {
        set((s) => patchDraft(s, dossierId, { exceptionnels: rows, hasUnsavedExceptionnels: false }));
      },

      // ── PCA ──────────────────────────────────────────────────────────────

      setPCA(dossierId, rows) {
        set((s) => patchDraft(s, dossierId, { pca: rows, hasUnsavedPCA: false }));
      },
      addPCA(dossierId) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            pca: [...d.pca, emptyConstate()],
            hasUnsavedPCA: true,
          });
        });
      },
      updatePCA(dossierId, index, data) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            pca: updateRow(d.pca, index, data),
            hasUnsavedPCA: true,
          });
        });
      },
      removePCA(dossierId, index) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            pca: d.pca.filter((_, i) => i !== index),
            hasUnsavedPCA: true,
          });
        });
      },
      duplicatePCA(dossierId, index) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          const source = d.pca[index];
          if (!source) return s;
          const { id: _id, ...rest } = source;
          const rows = [...d.pca];
          rows.splice(index + 1, 0, { ...rest, id: `__new__${crypto.randomUUID()}`, libelle: `${rest.libelle} (copie)` });
          return patchDraft(s, dossierId, { pca: rows, hasUnsavedPCA: true });
        });
      },
      markPCASaved(dossierId, rows) {
        set((s) => patchDraft(s, dossierId, { pca: rows, hasUnsavedPCA: false }));
      },

      clearDraft(dossierId) {
        set((s) => {
          const { [dossierId]: _, ...rest } = s.drafts;
          return { drafts: rest };
        });
      },
    }),
    {
      name: "autres-produits-store",
      partialize: (state) => ({ drafts: state.drafts }),
    }
  )
);
