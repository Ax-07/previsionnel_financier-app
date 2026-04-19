import type { ChildRow } from "../helpers/shared-helpers";

/**
 * Type spécialisé pour les lignes CR avec champ `actif?` (filtre d'affichage).
 * Étend `ChildRow` — compatible avec `buildChildNodes<CRChildRow, CRNode>` de shared-helpers.
 */
export type CRChildRow = ChildRow & {
  id?: string;
  actif?: boolean | null;
};
