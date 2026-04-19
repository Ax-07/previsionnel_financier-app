/**
 * Types partagés pour l'état de chargement asynchrone des données.
 * Utilisé par les stores Zustand et les hooks de contrôle.
 * @module lib/types/data-state
 */

/** Statut de chargement asynchrone (stores, hooks). */
export type DataStatus = "idle" | "loading" | "success" | "error";

/** État générique d'un hook retournant des données calculées. */
export interface DataState<T> {
  data: T | null;
  status: DataStatus;
  error: string | null;
}
