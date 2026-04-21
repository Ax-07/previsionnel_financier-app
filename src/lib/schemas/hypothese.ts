import { z } from "zod";

/**
 * Enum des types d'hypothèse disponibles pour les lignes de saisie.
 *
 * - `COMMUNE`    — Ligne incluse dans toutes les hypothèses (défaut)
 * - `PESSIMISTE` — Ligne spécifique à l'hypothèse pessimiste
 * - `REALISTE`   — Ligne spécifique à l'hypothèse réaliste
 * - `OPTIMISTE`  — Ligne spécifique à l'hypothèse optimiste
 */
export const hypotheseTypeSchema = z.enum([
  "COMMUNE",
  "PESSIMISTE",
  "REALISTE",
  "OPTIMISTE",
]);

export type HypotheseType = z.infer<typeof hypotheseTypeSchema>;

/** Hypothèse active par défaut quand aucune n'est sélectionnée. */
export const HYPOTHESE_ACTIVE_DEFAULT: HypotheseType = "REALISTE";

/** Hypothèse assignée par défaut aux nouvelles lignes de saisie. */
export const HYPOTHESE_LIGNE_DEFAULT: HypotheseType = "COMMUNE";

/** Options du sélecteur d'hypothèse par ligne (formulaires de saisie). */
export const HYPOTHESE_TYPE_OPTIONS: { value: HypotheseType; label: string }[] = [
  { value: "COMMUNE",    label: "Commune" },
  { value: "PESSIMISTE", label: "Pessimiste" },
  { value: "REALISTE",   label: "Réaliste" },
  { value: "OPTIMISTE",  label: "Optimiste" },
];

/**
 * Filtre une collection de lignes selon l'hypothèse active.
 * Inclut les lignes COMMUNE + les lignes correspondant à l'hypothèse active.
 *
 * @param items - Tableau de lignes portant un champ `hypothese` optionnel
 * @param hypotheseActive - Hypothèse sélectionnée par l'utilisateur
 */
export function filterByHypothese<T extends { hypothese?: string }>(
  items: T[],
  hypotheseActive: HypotheseType,
): T[] {
  return items.filter((item) => {
    const h = item.hypothese ?? "COMMUNE";
    return h === "COMMUNE" || h === hypotheseActive;
  });
}
