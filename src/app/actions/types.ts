/**
 * Types partagés entre toutes les server actions.
 * @module actions/types
 */

/** Résultat standard d'une server action de mutation (create / update / delete). */
export type ActionResult =
  | { success: true; message: string; id?: string }
  | { success: false; error: string };
