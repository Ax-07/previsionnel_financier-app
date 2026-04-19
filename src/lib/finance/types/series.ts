/**
 * Couche 1 — Types de séries temporelles financières.
 *
 * Ce fichier est un nœud feuille du graphe de dépendances :
 * aucun import depuis calculs/, normalize/ ou pipeline/.
 * Tous les autres modules importent depuis ici (directement ou via utils.ts / monthly.ts).
 */

/** Index d'un mois dans un exercice (0 = premier mois, 11 = dernier mois). */
export type MonthIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/** Clé des 3 exercices prévisionnels (N, N+1, N+2). */
export type YearKey = "y1" | "y2" | "y3";

/** Clé d'exercice étendue incluant l'année 0 (initial / pré-création). */
export type YearKey4 = "y0" | "y1" | "y2" | "y3";

/** Agrégat annuel : une valeur numérique par exercice. */
export type YearAcc = Record<YearKey, number>;

/** Agrégat annuel étendu incluant l'année 0 (initial / pré-création). */
export type YearAcc4 = Record<YearKey4, number>;

/**
 * Série mensuelle d'un exercice — 12 valeurs numériques indexées 0..11.
 * Exposée en lecture seule à l'API publique : les mutations internes passent par `MutableSeries`.
 */
export type MonthlySeries = readonly number[];

/**
 * Alias mutable de `MonthlySeries` — réservé aux fonctions qui construisent des séries
 * (accumulation, index assignment). Ne jamais exposer dans les types publics.
 */
export type MutableSeries = number[];

/** Séries mensuelles sur les 3 exercices prévisionnels. */
export type MonthlyAcc = Record<YearKey, MonthlySeries>;
