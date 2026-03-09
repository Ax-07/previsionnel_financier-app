/**
 * Hook utilitaire : invalide tous les caches des stores de contrôle
 * pour un dossier donné, puis relance immédiatement le fetch de chacun.
 * À appeler après chaque sauvegarde réussie dans les onglets de saisie
 * afin que les tableaux de contrôle soient recalculés en arrière-plan.
 */
import { useCallback } from "react";
import { useSyntheseStore } from "@/stores/synthese-store";
import { useCompteResultatStore } from "@/stores/compte-resultat-store";
import { useSigStore } from "@/stores/sig-store";
import { useBudgetStore } from "@/stores/budget-store";
import { useCafStore } from "@/stores/caf-store";
import { useSeuilRentabiliteStore } from "@/stores/seuil-rentabilite-store";
import { useBfrStore } from "@/stores/bfr-store";
import { useTableauFinancementStore } from "@/stores/tableau-financement-store";
import { usePlanFinancementStore } from "@/stores/plan-financement-store";
import { useBilanStore } from "@/stores/bilan-store";
import { useRatiosStore } from "@/stores/ratios-store";
import { useTresorerieStore } from "@/stores/tresorerie-store";
import { useVATStore } from "@/stores/tva-store";

export function useInvalidateControleStores() {
  const invalidateSynthese = useSyntheseStore((s) => s.invalidate);
  const invalidateCompteResultat = useCompteResultatStore((s) => s.invalidate);
  const invalidateSig = useSigStore((s) => s.invalidate);
  const invalidateBudget = useBudgetStore((s) => s.invalidate);
  const invalidateCaf = useCafStore((s) => s.invalidate);
  const invalidateSeuilRentabilite = useSeuilRentabiliteStore((s) => s.invalidate);
  const invalidateBfr = useBfrStore((s) => s.invalidate);
  const invalidateTableauFinancement = useTableauFinancementStore((s) => s.invalidate);
  const invalidatePlanFinancement = usePlanFinancementStore((s) => s.invalidate);
  const invalidateBilan = useBilanStore((s) => s.invalidate);
  const invalidateRatios = useRatiosStore((s) => s.invalidate);
  const invalidateTresorerie = useTresorerieStore((s) => s.invalidate);
  const invalidateTva = useVATStore((s) => s.invalidate);

  return useCallback(
    (dossierId: string) => {
      // 1. Vider les caches
      invalidateSynthese(dossierId);
      invalidateCompteResultat(dossierId);
      invalidateSig(dossierId);
      invalidateBudget(dossierId);
      invalidateCaf(dossierId);
      invalidateSeuilRentabilite(dossierId);
      invalidateBfr(dossierId);
      invalidateTableauFinancement(dossierId);
      invalidatePlanFinancement(dossierId);
      invalidateBilan(dossierId);
      invalidateRatios(dossierId);
      invalidateTresorerie(dossierId);
      invalidateTva(dossierId);
      // 2. Relancer tous les fetches en parallèle (hors hook React)
      useSyntheseStore.getState().fetch(dossierId);
      useCompteResultatStore.getState().fetch(dossierId);
      useSigStore.getState().fetch(dossierId);
      useBudgetStore.getState().fetch(dossierId);
      useCafStore.getState().fetch(dossierId);
      useSeuilRentabiliteStore.getState().fetch(dossierId);
      useBfrStore.getState().fetch(dossierId);
      useTableauFinancementStore.getState().fetch(dossierId);
      usePlanFinancementStore.getState().fetch(dossierId);
      useBilanStore.getState().fetch(dossierId);
      useRatiosStore.getState().fetch(dossierId);
      useTresorerieStore.getState().fetch(dossierId);
      useVATStore.getState().fetch(dossierId);
    },
    [
      invalidateSynthese,
      invalidateCompteResultat,
      invalidateSig,
      invalidateBudget,
      invalidateCaf,
      invalidateSeuilRentabilite,
      invalidateBfr,
      invalidateTableauFinancement,
      invalidatePlanFinancement,
      invalidateBilan,
      invalidateRatios,
      invalidateTresorerie,
      invalidateTva, // eslint-disable-line react-hooks/exhaustive-deps
    ],
  );
}
