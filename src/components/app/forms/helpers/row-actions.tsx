"use client";

import { Copy, Trash2 } from "lucide-react";
import { GroupSelectorButton } from "@/components/ui/grouped-dnd-table";

export interface RowActionsProps {
  /** Callback appelé lors du clic sur "Supprimer". */
  onDelete: () => void;
  /** Callback optionnel pour "Dupliquer" — bouton masqué si absent. */
  onDuplicate?: () => void;
  /** Désactive les boutons pendant une transition async. */
  isPending?: boolean;
  /** Groupe courant de la ligne — affiche le bouton de sélection de groupe si fourni. */
  groupe?: string | null;
}

/**
 * Paire de boutons d\u2019action de ligne : Dupliquer (optionnel) + Supprimer.
 * \u00c0 placer dans une cellule `<Td>` centr\u00e9e dans tous les tableaux de formulaires.
 */
export function RowActions({ onDelete, onDuplicate, isPending = false, groupe }: RowActionsProps) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {groupe !== undefined && <GroupSelectorButton currentGroupe={groupe} />}
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
