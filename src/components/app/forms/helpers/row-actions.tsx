"use client";

import { Copy, Trash2 } from "lucide-react";

export interface RowActionsProps {
  /** Callback appel\u00e9 lors du clic sur "Supprimer". */
  onDelete: () => void;
  /** Callback optionnel pour "Dupliquer" \u2014 bouton masqu\u00e9 si absent. */
  onDuplicate?: () => void;
  /** D\u00e9sactive les boutons pendant une transition async. */
  isPending?: boolean;
}

/**
 * Paire de boutons d\u2019action de ligne : Dupliquer (optionnel) + Supprimer.
 * \u00c0 placer dans une cellule `<Td>` centr\u00e9e dans tous les tableaux de formulaires.
 */
export function RowActions({ onDelete, onDuplicate, isPending = false }: RowActionsProps) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {onDuplicate && (
        <button
          className="p-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          onClick={onDuplicate}
          title="Dupliquer"
          disabled={isPending}
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        className="p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
        onClick={onDelete}
        title="Supprimer"
        disabled={isPending}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
