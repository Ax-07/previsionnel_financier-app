import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

import type { ApportRow, EmpruntWithEcheancier } from "@/lib/schemas/financement";

// ── Types locaux ─────────────────────────────────────────────────────────────

export type LocalApport  = ApportRow          & { _dirty?: boolean };
export type LocalEmprunt = EmpruntWithEcheancier & { _dirty?: boolean };

// ── State / Actions ───────────────────────────────────────────────────────────

interface FinancementState {
  apports:  Record<string, LocalApport[]>;
  emprunts: Record<string, LocalEmprunt[]>;
}

interface FinancementActions {
  setApports:  (dossierId: string, updater: (prev: LocalApport[])  => LocalApport[])  => void;
  setEmprunts: (dossierId: string, updater: (prev: LocalEmprunt[]) => LocalEmprunt[]) => void;

  hydrateApports:  (dossierId: string, rows: LocalApport[])  => void;
  hydrateEmprunts: (dossierId: string, rows: LocalEmprunt[]) => void;

  clearDossier: (dossierId: string) => void;
}

type FinancementStore = FinancementState & FinancementActions;

const INITIAL_STATE: FinancementState = { apports: {}, emprunts: {} };

// ── Store ────────────────────────────────────────────────────────────────────

export const useFinancementStore = create<FinancementStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,

        setApports(dossierId, updater) {
          set((s) => ({
            apports: { ...s.apports, [dossierId]: updater(s.apports[dossierId] ?? []) },
          }));
        },

        setEmprunts(dossierId, updater) {
          set((s) => ({
            emprunts: { ...s.emprunts, [dossierId]: updater(s.emprunts[dossierId] ?? []) },
          }));
        },

        hydrateApports(dossierId, rows) {
          const existing = get().apports[dossierId];
          const hasDirty = existing?.some((r) => r._dirty);
          if (!existing || !hasDirty) {
            set((s) => ({ apports: { ...s.apports, [dossierId]: rows } }));
          }
        },

        hydrateEmprunts(dossierId, rows) {
          const existing = get().emprunts[dossierId];
          const hasDirty = existing?.some((r) => r._dirty);
          if (!existing || !hasDirty) {
            set((s) => ({ emprunts: { ...s.emprunts, [dossierId]: rows } }));
          }
        },

        clearDossier(dossierId) {
          set((s) => {
            const apports  = { ...s.apports };
            const emprunts = { ...s.emprunts };
            delete apports[dossierId];
            delete emprunts[dossierId];
            return { apports, emprunts };
          });
        },
      }),
      {
        name: "previsia-financement",
        partialize: (s) => ({ apports: s.apports, emprunts: s.emprunts }),
      }
    ),
    { name: "FinancementStore" }
  )
);
