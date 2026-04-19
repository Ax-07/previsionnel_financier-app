/**
 * Hook utilitaire : recharge les données brutes du dossier depuis la DB,
 * ce qui déclenche automatiquement le recalcul client de tous les onglets.
 *
 * À appeler après chaque sauvegarde réussie dans les onglets de saisie.
 */
import { useCallback } from "react";
import { useScenarioDataStore } from "@/stores/scenario-data-store";

export function useReloadScenarioData() {
  return useCallback((dossierId: string) => {
    useScenarioDataStore.getState().reload(dossierId);
  }, []);
}
