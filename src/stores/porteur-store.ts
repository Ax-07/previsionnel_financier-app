import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PorteurFormValues } from "@/lib/schemas/porteur";

// Drafts indexés par dossierId pour supporter plusieurs dossiers ouverts
type PorteurDrafts = Record<string, Partial<PorteurFormValues>>;

interface PorteurStore {
  drafts: PorteurDrafts;
  /** Écrase ou fusionne le brouillon d'un dossier */
  setDraft: (dossierId: string, values: Partial<PorteurFormValues>) => void;
  /** Récupère le brouillon d'un dossier (undefined si absent) */
  getDraft: (dossierId: string) => Partial<PorteurFormValues> | undefined;
  /** Supprime le brouillon après sauvegarde réussie */
  clearDraft: (dossierId: string) => void;
}

export const usePorteurStore = create<PorteurStore>()(
  persist(
    (set, get) => ({
      drafts: {},

      setDraft: (dossierId, values) =>
        set((state) => ({
          drafts: {
            ...state.drafts,
            [dossierId]: { ...state.drafts[dossierId], ...values },
          },
        })),

      getDraft: (dossierId) => get().drafts[dossierId],

      clearDraft: (dossierId) =>
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [dossierId]: _removed, ...rest } = state.drafts;
          return { drafts: rest };
        }),
    }),
    {
      name: "previsia-porteur-drafts",
      // Ne persister que si la valeur est non vide (évite le localStorage pollué)
      partialize: (state) => ({
        drafts: Object.fromEntries(
          Object.entries(state.drafts).filter(
            ([, v]) => Object.keys(v).length > 0
          )
        ),
      }),
    }
  )
);
