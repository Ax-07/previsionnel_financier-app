/**
 * Hook de pré-chargement : déclenche le fetch de tous les stores de contrôle
 * dès que l'onglet Contrôle est monté, sans attendre que l'utilisateur navigue
 * vers chaque sous-onglet. Les stores ignorent les appels redondants (status
 * "loading" ou cache déjà présent), donc ce hook est idempotent.
 */
import { useEffect } from "react";
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

export function usePrefetchControleStores(dossierId: string) {
  useEffect(() => {
    if (!dossierId) return;
    // On accède directement au state (hors hook React) pour déclencher les fetches
    // en parallèle sans avoir besoin d'abonner le composant à chaque store.
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
  }, [dossierId]);
}
