/**
 * Hook de pré-chargement : déclenche le chargement des données brutes du dossier
 * depuis la DB via le store central. Toutes les données calculées sont dérivées
 * côté client via useFinCalc et les hooks de contrôle.
 */
import { useEffect } from "react";
import { useScenarioDataStore } from "@/stores/scenario-data-store";

export function usePrefetchControleStores(dossierId: string) {
  useEffect(() => {
    if (!dossierId) return;
    useScenarioDataStore.getState().load(dossierId);
  }, [dossierId]);
}
