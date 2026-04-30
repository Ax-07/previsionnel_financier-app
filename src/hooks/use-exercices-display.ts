"use client";
import { useSaisieDataStore } from "@/stores/saisie-data-store";

/**
 * Retourne les labels de colonnes et la visibilité des exercices N+1/N+2
 * en lisant directement le store Saisie (pas de prop-drilling).
 */
export function useExercicesDisplay(dossierId: string) {
  const exercices = useSaisieDataStore(
    (s) => s.cache[dossierId]?.data.entreprise?.exercices
  );

  const nExercices = exercices?.length ?? 3;
  const y1Label = exercices?.[0]?.annee?.toString() ?? "N";
  const y2Label = exercices?.[1]?.annee?.toString() ?? "N+1";
  const y3Label = exercices?.[2]?.annee?.toString() ?? "N+2";
  const showN1 = nExercices >= 2;
  const showN2 = nExercices >= 3;

  return { nExercices, y1Label, y2Label, y3Label, showN1, showN2 };
}
