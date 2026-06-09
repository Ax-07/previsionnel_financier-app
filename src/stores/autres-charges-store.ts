import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import type {
  AutreChargeProvisionRow,
  AutreChargeDateeRow,
  AutreChargeBilanRow,
} from "@/lib/schemas/autres-charges";
import { tempId } from "@/components/app/forms/helpers/table-helpers";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AutresChargesDraft {
  provisions: AutreChargeProvisionRow[];
  gestionCourante: AutreChargeDateeRow[];
  financieres: AutreChargeDateeRow[];
  exceptionnelles: AutreChargeDateeRow[];
  cca: AutreChargeBilanRow[];
  cap: AutreChargeBilanRow[];

  hasUnsavedProvisions: boolean;
  hasUnsavedGestionCourante: boolean;
  hasUnsavedFinancieres: boolean;
  hasUnsavedExceptionnelles: boolean;
  hasUnsavedCCA: boolean;
  hasUnsavedCAP: boolean;
}

interface AutresChargesState {
  drafts: Record<string, AutresChargesDraft>;
}

interface AutresChargesActions {
  getDraft: (dossierId: string) => AutresChargesDraft;
  hasUnsavedChanges: (dossierId: string) => boolean;

  // Provisions
  setProvisions: (dossierId: string, rows: AutreChargeProvisionRow[]) => void;
  addProvision: (dossierId: string) => void;
  updateProvision: (dossierId: string, index: number, data: Partial<AutreChargeProvisionRow>) => void;
  removeProvision: (dossierId: string, index: number) => void;
  duplicateProvision: (dossierId: string, index: number) => void;
  markProvisionsSaved: (dossierId: string, rows: AutreChargeProvisionRow[]) => void;

  // Gestion courante
  setGestionCourante: (dossierId: string, rows: AutreChargeDateeRow[]) => void;
  addGestionCourante: (dossierId: string) => void;
  updateGestionCourante: (dossierId: string, index: number, data: Partial<AutreChargeDateeRow>) => void;
  removeGestionCourante: (dossierId: string, index: number) => void;
  duplicateGestionCourante: (dossierId: string, index: number) => void;
  markGestionCouranteSaved: (dossierId: string, rows: AutreChargeDateeRow[]) => void;

  // Financières
  setFinancieres: (dossierId: string, rows: AutreChargeDateeRow[]) => void;
  addFinanciere: (dossierId: string) => void;
  updateFinanciere: (dossierId: string, index: number, data: Partial<AutreChargeDateeRow>) => void;
  removeFinanciere: (dossierId: string, index: number) => void;
  duplicateFinanciere: (dossierId: string, index: number) => void;
  markFinancieresSaved: (dossierId: string, rows: AutreChargeDateeRow[]) => void;

  // Exceptionnelles
  setExceptionnelles: (dossierId: string, rows: AutreChargeDateeRow[]) => void;
  addExceptionnelle: (dossierId: string) => void;
  updateExceptionnelle: (dossierId: string, index: number, data: Partial<AutreChargeDateeRow>) => void;
  removeExceptionnelle: (dossierId: string, index: number) => void;
  duplicateExceptionnelle: (dossierId: string, index: number) => void;
  markExceptionnellesSaved: (dossierId: string, rows: AutreChargeDateeRow[]) => void;

  // CCA
  setCCA: (dossierId: string, rows: AutreChargeBilanRow[]) => void;
  addCCA: (dossierId: string) => void;
  updateCCA: (dossierId: string, index: number, data: Partial<AutreChargeBilanRow>) => void;
  removeCCA: (dossierId: string, index: number) => void;
  duplicateCCA: (dossierId: string, index: number) => void;
  markCCASaved: (dossierId: string, rows: AutreChargeBilanRow[]) => void;

  // CAP
  setCAP: (dossierId: string, rows: AutreChargeBilanRow[]) => void;
  addCAP: (dossierId: string) => void;
  updateCAP: (dossierId: string, index: number, data: Partial<AutreChargeBilanRow>) => void;
  removeCAP: (dossierId: string, index: number) => void;
  duplicateCAP: (dossierId: string, index: number) => void;
  markCAPSaved: (dossierId: string, rows: AutreChargeBilanRow[]) => void;

  clearDraft: (dossierId: string) => void;
}

type AutresChargesStore = AutresChargesState & AutresChargesActions;

// ── Helpers ──────────────────────────────────────────────────────────────────

export function emptyProvision(groupe?: string): AutreChargeProvisionRow {
  return { 
    id: tempId(),
    libelle: "",
    actif: true,
    hypothese: "COMMUNE",
    nature: "",
    montantN: 0,
    montantN1: 0,
    montantN2: 0,
    ordre: 0,
    groupe,
  };
}

export function emptyDatee(categorie: "GESTION_COURANTE" | "FINANCIERE" | "EXCEPTIONNELLE"): AutreChargeDateeRow {
  return {
    id: tempId(),
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

export function emptyBilan(type: "CHARGE_CONSTATEE_AVANCE" | "CHARGE_A_PAYER"): AutreChargeBilanRow {
  return { 
    id: tempId(),
    libelle: "",
    actif: true,
    hypothese: "COMMUNE",
    type,
    nature: "",
    montantN: 0,
    montantN1: 0,
    montantN2: 0,
    ordre: 0,
  };
}

function getEmptyDraft(): AutresChargesDraft {
  return {
    provisions: [],
    gestionCourante: [],
    financieres: [],
    exceptionnelles: [],
    cca: [],
    cap: [],
    hasUnsavedProvisions: false,
    hasUnsavedGestionCourante: false,
    hasUnsavedFinancieres: false,
    hasUnsavedExceptionnelles: false,
    hasUnsavedCCA: false,
    hasUnsavedCAP: false,
  };
}

const EMPTY_DRAFT: AutresChargesDraft = getEmptyDraft();

const INITIAL_STATE: AutresChargesState = { drafts: {} };

function patchDraft(
  state: AutresChargesState,
  dossierId: string,
  patch: Partial<AutresChargesDraft>
): Pick<AutresChargesState, "drafts"> {
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

export const useAutresChargesStore = create<AutresChargesStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,

        getDraft: (dossierId) => get().drafts[dossierId] ?? EMPTY_DRAFT,

        hasUnsavedChanges: (dossierId) => {
          const d = get().drafts[dossierId];
          if (!d) return false;
          return (
            d.hasUnsavedProvisions ||
            d.hasUnsavedGestionCourante ||
            d.hasUnsavedFinancieres ||
            d.hasUnsavedExceptionnelles ||
            d.hasUnsavedCCA ||
            d.hasUnsavedCAP
          );
        },

      // ── Provisions ───────────────────────────────────────────────────────

      setProvisions(dossierId, rows) {
        set((s) => patchDraft(s, dossierId, { provisions: rows, hasUnsavedProvisions: false }));
      },
      addProvision(dossierId) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            provisions: [...d.provisions, emptyProvision()],
            hasUnsavedProvisions: true,
          });
        });
      },
      updateProvision(dossierId, index, data) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            provisions: updateRow(d.provisions, index, data),
            hasUnsavedProvisions: true,
          });
        });
      },
      removeProvision(dossierId, index) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            provisions: d.provisions.filter((_, i) => i !== index),
            hasUnsavedProvisions: true,
          });
        });
      },
      duplicateProvision(dossierId, index) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          const source = d.provisions[index];
          if (!source) return s;
          const { id: _id, ...rest } = source;
          const clone = { ...rest, id: `__new__${crypto.randomUUID()}`, libelle: `${rest.libelle} (copie)` };
          const rows = [...d.provisions];
          rows.splice(index + 1, 0, clone);
          return patchDraft(s, dossierId, { provisions: rows, hasUnsavedProvisions: true });
        });
      },
      markProvisionsSaved(dossierId, rows) {
        set((s) => patchDraft(s, dossierId, { provisions: rows, hasUnsavedProvisions: false }));
      },

        // ── Gestion courante ─────────────────────────────────────────────────

        setGestionCourante: (dossierId, rows) => {
          set((s) => patchDraft(s, dossierId, { gestionCourante: rows, hasUnsavedGestionCourante: false }));
        },
        addGestionCourante: (dossierId) => {
          set((s) => {
            const d = s.drafts[dossierId] ?? getEmptyDraft();
            return patchDraft(s, dossierId, {
              gestionCourante: [...d.gestionCourante, emptyDatee("GESTION_COURANTE")],
              hasUnsavedGestionCourante: true,
            });
          });
        },
        updateGestionCourante: (dossierId, index, data) => {
          set((s) => {
            const d = s.drafts[dossierId] ?? getEmptyDraft();
            return patchDraft(s, dossierId, {
              gestionCourante: updateRow(d.gestionCourante, index, data),
              hasUnsavedGestionCourante: true,
            });
          });
        },
        removeGestionCourante: (dossierId, index) => {
          set((s) => {
            const d = s.drafts[dossierId] ?? getEmptyDraft();
            return patchDraft(s, dossierId, {
              gestionCourante: d.gestionCourante.filter((_, i) => i !== index),
              hasUnsavedGestionCourante: true,
            });
          });
        },
        duplicateGestionCourante: (dossierId, index) => {
          set((s) => {
            const d = s.drafts[dossierId] ?? getEmptyDraft();
            const source = d.gestionCourante[index];
            if (!source) return s;
            const { id: _id, ...rest } = source;
            const clone = { ...rest, id: tempId(), libelle: `${rest.libelle} (copie)` };
            const rows = [...d.gestionCourante];
            rows.splice(index + 1, 0, clone);
            return patchDraft(s, dossierId, { gestionCourante: rows, hasUnsavedGestionCourante: true });
          });
        },
        markGestionCouranteSaved: (dossierId, rows) => {
          set((s) => patchDraft(s, dossierId, { gestionCourante: rows, hasUnsavedGestionCourante: false }));
        },

      // ── Financières ──────────────────────────────────────────────────────

      setFinancieres(dossierId, rows) {
        set((s) => patchDraft(s, dossierId, { financieres: rows, hasUnsavedFinancieres: false }));
      },
      addFinanciere(dossierId) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            financieres: [...d.financieres, emptyDatee("FINANCIERE")],
            hasUnsavedFinancieres: true,
          });
        });
      },
      updateFinanciere(dossierId, index, data) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            financieres: updateRow(d.financieres, index, data),
            hasUnsavedFinancieres: true,
          });
        });
      },
      removeFinanciere(dossierId, index) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          return patchDraft(s, dossierId, {
            financieres: d.financieres.filter((_, i) => i !== index),
            hasUnsavedFinancieres: true,
          });
        });
      },
      duplicateFinanciere(dossierId, index) {
        set((s) => {
          const d = s.drafts[dossierId] ?? getEmptyDraft();
          const source = d.financieres[index];
          if (!source) return s;
          const { id: _id, ...rest } = source;
          const clone = { ...rest, id: `__new__${crypto.randomUUID()}`, libelle: `${rest.libelle} (copie)` };
          const rows = [...d.financieres];
          rows.splice(index + 1, 0, clone);
          return patchDraft(s, dossierId, { financieres: rows, hasUnsavedFinancieres: true });
        });
      },
      markFinancieresSaved(dossierId, rows) {
        set((s) => patchDraft(s, dossierId, { financieres: rows, hasUnsavedFinancieres: false }));
      },

        // ── Exceptionnelles ──────────────────────────────────────────────────

        setExceptionnelles: (dossierId, rows) => {
          set((s) => patchDraft(s, dossierId, { exceptionnelles: rows, hasUnsavedExceptionnelles: false }));
        },
        addExceptionnelle: (dossierId) => {
          set((s) => {
            const d = s.drafts[dossierId] ?? getEmptyDraft();
            return patchDraft(s, dossierId, {
              exceptionnelles: [...d.exceptionnelles, emptyDatee("EXCEPTIONNELLE")],
              hasUnsavedExceptionnelles: true,
            });
          });
        },
        updateExceptionnelle: (dossierId, index, data) => {
          set((s) => {
            const d = s.drafts[dossierId] ?? getEmptyDraft();
            return patchDraft(s, dossierId, {
              exceptionnelles: updateRow(d.exceptionnelles, index, data),
              hasUnsavedExceptionnelles: true,
            });
          });
        },
        removeExceptionnelle: (dossierId, index) => {
          set((s) => {
            const d = s.drafts[dossierId] ?? getEmptyDraft();
            return patchDraft(s, dossierId, {
              exceptionnelles: d.exceptionnelles.filter((_, i) => i !== index),
              hasUnsavedExceptionnelles: true,
            });
          });
        },
        duplicateExceptionnelle: (dossierId, index) => {
          set((s) => {
            const d = s.drafts[dossierId] ?? getEmptyDraft();
            const source = d.exceptionnelles[index];
            if (!source) return s;
            const { id: _id, ...rest } = source;
            const clone = { ...rest, id: tempId(), libelle: `${rest.libelle} (copie)` };
            const rows = [...d.exceptionnelles];
            rows.splice(index + 1, 0, clone);
            return patchDraft(s, dossierId, { exceptionnelles: rows, hasUnsavedExceptionnelles: true });
          });
        },
        markExceptionnellesSaved: (dossierId, rows) => {
          set((s) => patchDraft(s, dossierId, { exceptionnelles: rows, hasUnsavedExceptionnelles: false }));
        },

        // ── CCA ──────────────────────────────────────────────────────────────

        setCCA: (dossierId, rows) => {
          set((s) => patchDraft(s, dossierId, { cca: rows, hasUnsavedCCA: false }));
        },
        addCCA: (dossierId) => {
          set((s) => {
            const d = s.drafts[dossierId] ?? getEmptyDraft();
            return patchDraft(s, dossierId, {
              cca: [...d.cca, emptyBilan("CHARGE_CONSTATEE_AVANCE")],
              hasUnsavedCCA: true,
            });
          });
        },
        updateCCA: (dossierId, index, data) => {
          set((s) => {
            const d = s.drafts[dossierId] ?? getEmptyDraft();
            return patchDraft(s, dossierId, {
              cca: updateRow(d.cca, index, data),
              hasUnsavedCCA: true,
            });
          });
        },
        removeCCA: (dossierId, index) => {
          set((s) => {
            const d = s.drafts[dossierId] ?? getEmptyDraft();
            return patchDraft(s, dossierId, {
              cca: d.cca.filter((_, i) => i !== index),
              hasUnsavedCCA: true,
            });
          });
        },
        duplicateCCA: (dossierId, index) => {
          set((s) => {
            const d = s.drafts[dossierId] ?? getEmptyDraft();
            const source = d.cca[index];
            if (!source) return s;
            const { id: _id, ...rest } = source;
            const clone = { ...rest, id: tempId(), libelle: `${rest.libelle} (copie)` };
            const rows = [...d.cca];
            rows.splice(index + 1, 0, clone);
            return patchDraft(s, dossierId, { cca: rows, hasUnsavedCCA: true });
          });
        },
        markCCASaved: (dossierId, rows) => {
          set((s) => patchDraft(s, dossierId, { cca: rows, hasUnsavedCCA: false }));
        },

        // ── CAP ──────────────────────────────────────────────────────────────

        setCAP: (dossierId, rows) => {
          set((s) => patchDraft(s, dossierId, { cap: rows, hasUnsavedCAP: false }));
        },
        addCAP: (dossierId) => {
          set((s) => {
            const d = s.drafts[dossierId] ?? getEmptyDraft();
            return patchDraft(s, dossierId, {
              cap: [...d.cap, emptyBilan("CHARGE_A_PAYER")],
              hasUnsavedCAP: true,
            });
          });
        },
        updateCAP: (dossierId, index, data) => {
          set((s) => {
            const d = s.drafts[dossierId] ?? getEmptyDraft();
            return patchDraft(s, dossierId, {
              cap: updateRow(d.cap, index, data),
              hasUnsavedCAP: true,
            });
          });
        },
        removeCAP: (dossierId, index) => {
          set((s) => {
            const d = s.drafts[dossierId] ?? getEmptyDraft();
            return patchDraft(s, dossierId, {
              cap: d.cap.filter((_, i) => i !== index),
              hasUnsavedCAP: true,
            });
          });
        },
        duplicateCAP: (dossierId, index) => {
          set((s) => {
            const d = s.drafts[dossierId] ?? getEmptyDraft();
            const source = d.cap[index];
            if (!source) return s;
            const { id: _id, ...rest } = source;
            const clone = { ...rest, id: tempId(), libelle: `${rest.libelle} (copie)` };
            const rows = [...d.cap];
            rows.splice(index + 1, 0, clone);
            return patchDraft(s, dossierId, { cap: rows, hasUnsavedCAP: true });
          });
        },
        markCAPSaved: (dossierId, rows) => {
          set((s) => patchDraft(s, dossierId, { cap: rows, hasUnsavedCAP: false }));
        },

        clearDraft: (dossierId) => {
          set((s) => {
            const { [dossierId]: _, ...rest } = s.drafts;
            return { drafts: rest };
          });
        },
      }),
      {
        name: "autres-charges-store",
        partialize: (state) => ({ drafts: state.drafts }),
      }
    ),
    { name: "AutresChargesStore" }
  )
);
