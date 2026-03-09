import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EntrepriseFormValues } from "@/lib/schemas/entreprise";

// Drafts indexés par dossierId pour supporter plusieurs dossiers ouverts
type EntrepriseDrafts = Record<string, Partial<EntrepriseFormValues>>;

interface EntrepriseStore {
  drafts: EntrepriseDrafts;
  /** Écrase ou fusionne le brouillon d'un dossier */
  setDraft: (dossierId: string, values: Partial<EntrepriseFormValues>) => void;
  /** Récupère le brouillon d'un dossier (undefined si absent) */
  getDraft: (dossierId: string) => Partial<EntrepriseFormValues> | undefined;
  /** Supprime le brouillon après sauvegarde réussie */
  clearDraft: (dossierId: string) => void;
}

export const useEntrepriseStore = create<EntrepriseStore>()(
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
      name: "previsia-entreprise-drafts",
      // Ne persister que si la valeur est non vide
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
