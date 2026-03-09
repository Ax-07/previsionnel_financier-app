import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

import type {
  ImmobilisationRow,
  CessionRow,
  CreditBailRow,
} from "@/lib/schemas/investissement";

// ── Types locaux (miroir du formulaire) ──────────────────────────────────────

export type LocalImmo = ImmobilisationRow & { _dirty?: boolean };
export type LocalCession = CessionRow & { _dirty?: boolean };
export type LocalCredit = CreditBailRow & { _dirty?: boolean };

// ── State / Actions ───────────────────────────────────────────────────────────

interface InvestissementState {
  /** Lignes par dossierId */
  immos: Record<string, LocalImmo[]>;
  cessions: Record<string, LocalCession[]>;
  credits: Record<string, LocalCredit[]>;
}

interface InvestissementActions {
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
}

type InvestissementStore = InvestissementState & InvestissementActions;

const INITIAL_STATE: InvestissementState = {
  immos: {},
  cessions: {},
  credits: {},
};

// ── Store ────────────────────────────────────────────────────────────────────

export const useInvestissementStore = create<InvestissementStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,

        setImmos(dossierId, updater) {
          set((state) => ({
            immos: { ...state.immos, [dossierId]: updater(state.immos[dossierId] ?? []) },
          }));
        },

        setCessions(dossierId, updater) {
          set((state) => ({
            cessions: { ...state.cessions, [dossierId]: updater(state.cessions[dossierId] ?? []) },
          }));
        },

        setCredits(dossierId, updater) {
          set((state) => ({
            credits: { ...state.credits, [dossierId]: updater(state.credits[dossierId] ?? []) },
          }));
        },

        hydrateImmos(dossierId, rows) {
          const existing = get().immos[dossierId];
          const hasDirty = existing?.some((r: LocalImmo) => r._dirty);
          if (!existing || !hasDirty) {
            set((state) => ({ immos: { ...state.immos, [dossierId]: rows } }));
          }
        },

        hydrateCessions(dossierId, rows) {
          const existing = get().cessions[dossierId];
          const hasDirty = existing?.some((r: LocalCession) => r._dirty);
          if (!existing || !hasDirty) {
            set((state) => ({ cessions: { ...state.cessions, [dossierId]: rows } }));
          }
        },

        hydrateCredits(dossierId, rows) {
          const existing = get().credits[dossierId];
          const hasDirty = existing?.some((r: LocalCredit) => r._dirty);
          if (!existing || !hasDirty) {
            set((state) => ({ credits: { ...state.credits, [dossierId]: rows } }));
          }
        },

        clearDossier(dossierId) {
          set((state) => {
            const immos = { ...state.immos };
            const cessions = { ...state.cessions };
            const credits = { ...state.credits };
            delete immos[dossierId];
            delete cessions[dossierId];
            delete credits[dossierId];
            return { immos, cessions, credits };
          });
        },
      }),
      {
        name: "previsia-investissement",
        partialize: (state) => ({
          immos: state.immos,
          cessions: state.cessions,
          credits: state.credits,
        }),
      }
    ),
    { name: "InvestissementStore" }
  )
);
