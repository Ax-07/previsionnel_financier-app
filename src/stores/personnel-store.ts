import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  LigneSalarieRow,
  LigneDirigeantRow,
  LigneCotisationTNSRow,
  LigneTaxeSalaireRow,
  LigneChargePersonnelRow,
  ParamsGlobauxSalaries,
  ParamsGlobauxTNS,
} from "@/lib/schemas/personnel";
import { createDefaultParamsGlobaux, createDefaultParamsGlobauxTNS, COTISATIONS_TNS_DEFAUT } from "@/lib/schemas/personnel";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PersonnelDraft {
  salaries: LigneSalarieRow[];
  dirigeants: LigneDirigeantRow[];
  cotisationsTNS: LigneCotisationTNSRow[];
  taxesSalaires: LigneTaxeSalaireRow[];
  autresCharges: LigneChargePersonnelRow[];    // type = AUTRE
  remboursements: LigneChargePersonnelRow[];   // type = REMBOURSEMENT
  participations: LigneChargePersonnelRow[];   // type = PARTICIPATION
  paramsGlobaux: ParamsGlobauxSalaries;
  paramsGlobauxTNS: ParamsGlobauxTNS;
  hasUnsavedSalaries: boolean;
  hasUnsavedDirigeants: boolean;
  hasUnsavedCotisationsTNS: boolean;
  hasUnsavedTaxesSalaires: boolean;
  hasUnsavedAutresCharges: boolean;
  hasUnsavedRemboursements: boolean;
  hasUnsavedParticipations: boolean;
  /** IDs des salariés dont le taux patronal a été calculé via le simulateur */
  simulateurInjectedIds: string[];
}

export interface PersonnelState {
  drafts: Record<string, PersonnelDraft>;

  getDraft: (dossierId: string) => PersonnelDraft;
  hasUnsavedChanges: (dossierId: string) => boolean;

  // Paramètres globaux salariés
  updateParamsGlobaux: (dossierId: string, data: Partial<ParamsGlobauxSalaries>) => void;

  // Paramètres globaux TNS
  updateParamsGlobauxTNS: (dossierId: string, data: Partial<ParamsGlobauxTNS>) => void;

  // Salariés
  setSalaries: (dossierId: string, rows: LigneSalarieRow[]) => void;
  setSalariesRows: (dossierId: string, rows: LigneSalarieRow[]) => void;
  addSalarie: (dossierId: string) => void;
  updateSalarie: (dossierId: string, index: number, data: Partial<LigneSalarieRow>) => void;
  removeSalarie: (dossierId: string, index: number) => void;
  duplicateSalarie: (dossierId: string, index: number) => void;
  markSalariesSaved: (dossierId: string) => void;

  // Dirigeants
  setDirigeants: (dossierId: string, rows: LigneDirigeantRow[]) => void;
  setDirigeantsRows: (dossierId: string, rows: LigneDirigeantRow[]) => void;
  addDirigeant: (dossierId: string) => void;
  updateDirigeant: (dossierId: string, index: number, data: Partial<LigneDirigeantRow>) => void;
  removeDirigeant: (dossierId: string, index: number) => void;
  duplicateDirigeant: (dossierId: string, index: number) => void;
  markDirigeantsSaved: (dossierId: string) => void;

  // Cotisations TNS
  setCotisationsTNS: (dossierId: string, rows: LigneCotisationTNSRow[]) => void;
  setCotisationsTNSRows: (dossierId: string, rows: LigneCotisationTNSRow[]) => void;
  addCotisationTNS: (dossierId: string) => void;
  updateCotisationTNS: (dossierId: string, index: number, data: Partial<LigneCotisationTNSRow>) => void;
  removeCotisationTNS: (dossierId: string, index: number) => void;
  markCotisationsTNSSaved: (dossierId: string) => void;
  
  // Taxes sur salaires
  setTaxesSalaires: (dossierId: string, rows: LigneTaxeSalaireRow[]) => void;
  setTaxesSalairesRows: (dossierId: string, rows: LigneTaxeSalaireRow[]) => void;
  addTaxeSalaire: (dossierId: string) => void;
  updateTaxeSalaire: (dossierId: string, index: number, data: Partial<LigneTaxeSalaireRow>) => void;
  removeTaxeSalaire: (dossierId: string, index: number) => void;
  duplicateTaxeSalaire: (dossierId: string, index: number) => void;
  markTaxesSalairesSaved: (dossierId: string) => void;

  // Autres charges
  setAutresCharges: (dossierId: string, rows: LigneChargePersonnelRow[]) => void;
  setAutresChargesRows: (dossierId: string, rows: LigneChargePersonnelRow[]) => void;
  addAutreCharge: (dossierId: string) => void;
  updateAutreCharge: (dossierId: string, index: number, data: Partial<LigneChargePersonnelRow>) => void;
  removeAutreCharge: (dossierId: string, index: number) => void;
  duplicateAutreCharge: (dossierId: string, index: number) => void;
  markAutresChargesSaved: (dossierId: string) => void;

  // Remboursements
  setRemboursements: (dossierId: string, rows: LigneChargePersonnelRow[]) => void;
  setRemboursementsRows: (dossierId: string, rows: LigneChargePersonnelRow[]) => void;
  addRemboursement: (dossierId: string) => void;
  updateRemboursement: (dossierId: string, index: number, data: Partial<LigneChargePersonnelRow>) => void;
  removeRemboursement: (dossierId: string, index: number) => void;
  duplicateRemboursement: (dossierId: string, index: number) => void;
  markRemboursementsSaved: (dossierId: string) => void;

  // Participations
  setParticipations: (dossierId: string, rows: LigneChargePersonnelRow[]) => void;
  setParticipationsRows: (dossierId: string, rows: LigneChargePersonnelRow[]) => void;
  addParticipation: (dossierId: string) => void;
  updateParticipation: (dossierId: string, index: number, data: Partial<LigneChargePersonnelRow>) => void;
  removeParticipation: (dossierId: string, index: number) => void;
  duplicateParticipation: (dossierId: string, index: number) => void;
  markParticipationsSaved: (dossierId: string) => void;

  clearDraft: (dossierId: string) => void;
  markSimulateurInjected: (dossierId: string, salarieId: string) => void;
}

// ── Factories ─────────────────────────────────────────────────────────────────

function createEmptySalarie(): LigneSalarieRow {
  return {
    libelle: "", actif: true, hypothese: "COMMUNE",
    montantN: 0, evolutionN1: 0, montantN1: 0, evolutionN2: 0, montantN2: 0,
    tauxCotSal: 22, tauxCotPat: 42, tauxFixe: 100,
    hasCommission: false, hasPrime: false, cotisationConges: false,
  };
}

function createEmptyDirigeant(): LigneDirigeantRow {
  return { libelle: "Rémunération gérant", actif: true, hypothese: "COMMUNE", montantN: 0, evolutionN1: 0, montantN1: 0, evolutionN2: 0, montantN2: 0, exonerationTNS: "", conjointCollaborateur: false, tauxFixe: 100 };
}

function createEmptyCotisationTNS(): LigneCotisationTNSRow {
  return { libelle: "", actif: true, hypothese: "COMMUNE", calcAuto: false, montantN: 0, montantN1: 0, montantN2: 0 };
}

function createEmptyTaxeSalaire(): LigneTaxeSalaireRow {
  return { libelle: "", actif: true, hypothese: "COMMUNE", calcAuto: false, taux: 0, dateN: "", montantN: 0, dateN1: "", montantN1: 0, dateN2: "", montantN2: 0 };
}

function createEmptyChargePersonnel(type: "AUTRE" | "REMBOURSEMENT" | "PARTICIPATION"): LigneChargePersonnelRow {
  return { libelle: "", actif: true, hypothese: "COMMUNE", type, calcAuto: false, dateN: "", montantN: 0, dateN1: "", montantN1: 0, dateN2: "", montantN2: 0 };
}

function getEmptyDraft(): PersonnelDraft {
  return {
    salaries: [], dirigeants: [], cotisationsTNS: [...COTISATIONS_TNS_DEFAUT], taxesSalaires: [],
    autresCharges: [], remboursements: [], participations: [],
    paramsGlobaux: createDefaultParamsGlobaux(),
    paramsGlobauxTNS: createDefaultParamsGlobauxTNS(),
    hasUnsavedSalaries: false, hasUnsavedDirigeants: false,
    hasUnsavedCotisationsTNS: false, hasUnsavedTaxesSalaires: false,
    hasUnsavedAutresCharges: false, hasUnsavedRemboursements: false,
    hasUnsavedParticipations: false,
    simulateurInjectedIds: [],
  };
}

// ── Updater interne ───────────────────────────────────────────────────────────

/**
 * Référence stable utilisée par getDraft quand aucun draft n'existe.
 * Évite de créer un nouvel objet à chaque appel (causerait des boucles de re-render).
 */
const EMPTY_PERSONNEL_DRAFT: PersonnelDraft = getEmptyDraft();

/**
 * Cache de mémoïzation pour getDraft : même référence `stored` → même objet fusionné retourné.
 * Préserve la sécurité de migration (champs ajoutés post-déploiement reçoivent leur valeur
 * par défaut via getEmptyDraft) sans provoquer d'instabilité de référence React.
 */
const draftMergeCache = new WeakMap<PersonnelDraft, PersonnelDraft>();

function patchDraft(
  drafts: Record<string, PersonnelDraft>,
  dossierId: string,
  patch: Partial<PersonnelDraft>,
): Record<string, PersonnelDraft> {
  return { ...drafts, [dossierId]: { ...(drafts[dossierId] ?? getEmptyDraft()), ...patch } };
}

// ── Helper générique pour list actions ────────────────────────────────────────

type ListKey = "salaries" | "dirigeants" | "cotisationsTNS" | "taxesSalaires" | "autresCharges" | "remboursements" | "participations";
type DirtyKey = "hasUnsavedSalaries" | "hasUnsavedDirigeants" | "hasUnsavedCotisationsTNS" | "hasUnsavedTaxesSalaires" | "hasUnsavedAutresCharges" | "hasUnsavedRemboursements" | "hasUnsavedParticipations";

// ── Store ─────────────────────────────────────────────────────────────────────

export const usePersonnelStore = create<PersonnelState>()(
  persist(
    (set, get) => {
      function makeListActions<T>(listKey: ListKey, dirtyKey: DirtyKey) {
        return {
          set: (dossierId: string, rows: T[]) =>
            set((s) => ({
              drafts: patchDraft(s.drafts, dossierId, {
                [listKey]: rows,
                [dirtyKey]: false,
              } as Partial<PersonnelDraft>),
            })),

          setRows: (dossierId: string, rows: T[]) =>
            set((s) => ({
              drafts: patchDraft(s.drafts, dossierId, {
                [listKey]: rows,
                [dirtyKey]: true,
              } as Partial<PersonnelDraft>),
            })),

          add: (dossierId: string, empty: T) => {
            const rows = get().getDraft(dossierId)[listKey] as T[];
            set((s) => ({
              drafts: patchDraft(s.drafts, dossierId, {
                [listKey]: [...rows, empty],
                [dirtyKey]: true,
              } as Partial<PersonnelDraft>),
            }));
          },

          update: (dossierId: string, index: number, data: Partial<T>) => {
            const rows = get().getDraft(dossierId)[listKey] as T[];
            const updated = rows.map((r, i) => (i === index ? { ...r, ...data } : r));

            set((s) => ({
              drafts: patchDraft(s.drafts, dossierId, {
                [listKey]: updated,
                [dirtyKey]: true,
              } as Partial<PersonnelDraft>),
            }));
          },

          remove: (dossierId: string, index: number) => {
            const rows = get().getDraft(dossierId)[listKey] as T[];

            set((s) => ({
              drafts: patchDraft(s.drafts, dossierId, {
                [listKey]: rows.filter((_, i) => i !== index),
                [dirtyKey]: true,
              } as Partial<PersonnelDraft>),
            }));
          },

          duplicate: (dossierId: string, index: number) => {
            const rows = get().getDraft(dossierId)[listKey] as T[];
            const source = rows[index];
            if (!source) return;

            const { id: _id, ...rest } = source as T & { id?: string; libelle?: string };

            const newRows = [...rows];
            newRows.splice(index + 1, 0, {
              ...rest,
              libelle: `${rest.libelle ?? ""} (copie)`,
            } as T);

            set((s) => ({
              drafts: patchDraft(s.drafts, dossierId, {
                [listKey]: newRows,
                [dirtyKey]: true,
              } as Partial<PersonnelDraft>),
            }));
          },

          markSaved: (dossierId: string) =>
            set((s) => ({
              drafts: patchDraft(s.drafts, dossierId, {
                [dirtyKey]: false,
              } as Partial<PersonnelDraft>),
            })),
        };
      }

      const sal = makeListActions<LigneSalarieRow>("salaries", "hasUnsavedSalaries");
      const dir = makeListActions<LigneDirigeantRow>("dirigeants", "hasUnsavedDirigeants");
      const tns = makeListActions<LigneCotisationTNSRow>("cotisationsTNS", "hasUnsavedCotisationsTNS");
      const tax = makeListActions<LigneTaxeSalaireRow>("taxesSalaires", "hasUnsavedTaxesSalaires");
      const aut = makeListActions<LigneChargePersonnelRow>("autresCharges", "hasUnsavedAutresCharges");
      const rem = makeListActions<LigneChargePersonnelRow>("remboursements", "hasUnsavedRemboursements");
      const par = makeListActions<LigneChargePersonnelRow>("participations", "hasUnsavedParticipations");

      return {
        drafts: {},

        getDraft: (dossierId) => {
          const stored = get().drafts[dossierId];
          if (!stored) return EMPTY_PERSONNEL_DRAFT;
          const cached = draftMergeCache.get(stored);
          if (cached) return cached;
          const merged = { ...getEmptyDraft(), ...stored };
          draftMergeCache.set(stored, merged);
          return merged;
        },

        hasUnsavedChanges: (dossierId) => {
          const d = get().drafts[dossierId];
          if (!d) return false;

          return (
            d.hasUnsavedSalaries ||
            d.hasUnsavedDirigeants ||
            d.hasUnsavedCotisationsTNS ||
            d.hasUnsavedTaxesSalaires ||
            d.hasUnsavedAutresCharges ||
            d.hasUnsavedRemboursements ||
            d.hasUnsavedParticipations
          );
        },

        updateParamsGlobaux: (dossierId, data) => {
          const current = get().getDraft(dossierId).paramsGlobaux;

          set((s) => ({
            drafts: patchDraft(s.drafts, dossierId, {
              paramsGlobaux: { ...current, ...data },
            }),
          }));
        },

        updateParamsGlobauxTNS: (dossierId, data) => {
          const current = get().getDraft(dossierId).paramsGlobauxTNS;
          const modeChanged =
            "modeCalculTNS" in data && data.modeCalculTNS !== current.modeCalculTNS;

          set((s) => ({
            drafts: patchDraft(s.drafts, dossierId, {
              paramsGlobauxTNS: { ...current, ...data },
              ...(modeChanged ? { hasUnsavedCotisationsTNS: true } : {}),
            }),
          }));
        },

        // Salariés
        setSalaries: sal.set,
        setSalariesRows: sal.setRows,
        addSalarie: (id) => sal.add(id, createEmptySalarie()),
        updateSalarie: (dossierId, index, data) => {
          sal.update(dossierId, index, data);

          if ("tauxCotPat" in data) {
            set((s) => {
              const draft = s.drafts[dossierId];
              if (!draft) return s;

              const row = draft.salaries[index];
              if (!row?.id) return s;

              const filtered = draft.simulateurInjectedIds.filter((id) => id !== row.id);

              return {
                drafts: patchDraft(s.drafts, dossierId, {
                  simulateurInjectedIds: filtered,
                }),
              };
            });
          }
        },
        removeSalarie: sal.remove,
        duplicateSalarie: sal.duplicate,
        markSalariesSaved: sal.markSaved,

        // Dirigeants
        setDirigeants: dir.set,
        setDirigeantsRows: dir.setRows,
        addDirigeant: (id) => dir.add(id, createEmptyDirigeant()),
        updateDirigeant: dir.update,
        removeDirigeant: dir.remove,
        duplicateDirigeant: dir.duplicate,
        markDirigeantsSaved: dir.markSaved,

        // Cotisations TNS
        setCotisationsTNS: tns.set,
        setCotisationsTNSRows: tns.setRows,
        addCotisationTNS: (id) => tns.add(id, createEmptyCotisationTNS()),
        updateCotisationTNS: tns.update,
        removeCotisationTNS: tns.remove,
        markCotisationsTNSSaved: tns.markSaved,

        // Taxes sur salaires
        setTaxesSalaires: tax.set,
        setTaxesSalairesRows: tax.setRows,
        addTaxeSalaire: (id) => tax.add(id, createEmptyTaxeSalaire()),
        updateTaxeSalaire: tax.update,
        removeTaxeSalaire: tax.remove,
        duplicateTaxeSalaire: tax.duplicate,
        markTaxesSalairesSaved: tax.markSaved,

        // Autres charges
        setAutresCharges: aut.set,
        setAutresChargesRows: aut.setRows,
        addAutreCharge: (id) => aut.add(id, createEmptyChargePersonnel("AUTRE")),
        updateAutreCharge: aut.update,
        removeAutreCharge: aut.remove,
        duplicateAutreCharge: aut.duplicate,
        markAutresChargesSaved: aut.markSaved,

        // Remboursements
        setRemboursements: rem.set,
        setRemboursementsRows: rem.setRows,
        addRemboursement: (id) => rem.add(id, createEmptyChargePersonnel("REMBOURSEMENT")),
        updateRemboursement: rem.update,
        removeRemboursement: rem.remove,
        duplicateRemboursement: rem.duplicate,
        markRemboursementsSaved: rem.markSaved,

        // Participations
        setParticipations: par.set,
        setParticipationsRows: par.setRows,
        addParticipation: (id) => par.add(id, createEmptyChargePersonnel("PARTICIPATION")),
        updateParticipation: par.update,
        removeParticipation: par.remove,
        duplicateParticipation: par.duplicate,
        markParticipationsSaved: par.markSaved,

        clearDraft: (dossierId) => {
          set((s) => {
            const drafts = { ...s.drafts };
            delete drafts[dossierId];
            return { drafts };
          });
        },

        markSimulateurInjected: (dossierId, salarieId) =>
          set((s) => {
            const draft = s.drafts[dossierId] ?? getEmptyDraft();
            const ids = draft.simulateurInjectedIds ?? [];

            if (ids.includes(salarieId)) return s;

            return {
              drafts: patchDraft(s.drafts, dossierId, {
                simulateurInjectedIds: [...ids, salarieId],
              }),
            };
          }),
      };
    },
    {
      name: "previsia-personnel",
      partialize: (s) => ({ drafts: s.drafts }),
    },
  ),
);

