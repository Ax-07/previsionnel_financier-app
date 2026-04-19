"use client";

import { useEffect } from "react";
import { useSaisieDataStore } from "@/stores/saisie-data-store";
import type { SaisieFormData } from "@/app/actions/load-saisie-data";
import type { DataState } from "@/lib/types/data-state";

export type SaisieDataState = DataState<SaisieFormData>;

/**
 * Déclenche le chargement des données de saisie d'un dossier (une seule fois)
 * via le store centralisé `useSaisieDataStore`.
 */
export function useSaisieData(dossierId: string): SaisieDataState {
  const data = useSaisieDataStore((s) => s.cache[dossierId]?.data ?? null);
  const status = useSaisieDataStore((s) => s.status[dossierId] ?? "idle");
  const error = useSaisieDataStore((s) => s.errors[dossierId] ?? null);

  useEffect(() => {
    if (status === "idle") {
      useSaisieDataStore.getState().load(dossierId);
    }
  }, [dossierId, status]);

  return { data, status, error };
}
