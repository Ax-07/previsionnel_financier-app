/**
 * Helpers primitifs partagés pour tous les tableaux de formulaires :
 * - `intVal` : parsing entier sûr
 * - `tempId` : identifiant temporaire local (non persisté)
 * - `Th` : en-tête de colonne standard
 * - `Td` : cellule de données standard
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// ── Fonctions utilitaires ─────────────────────────────────────────────────────

/** Parse une chaîne en entier ; retourne 0 si invalide ou NaN. */
export function intVal(v: string): number {
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : n;
}

/** Génère un identifiant temporaire local pour les nouvelles lignes avant persistance. */
export function tempId(): string {
  return `__new__${crypto.randomUUID()}`;
}

// ── Composants primitifs de table ─────────────────────────────────────────────

export function Th({children, className}: {children?: ReactNode; className?: string;}) {
  return (
    <th className={cn("px-2 py-1.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap", className)}>
      {children}
    </th>
  );
}

export function Td({children, className}: {children: ReactNode; className?: string;}) {
  return <td className={cn("px-0 py-0 align-middle", className)}>{children}</td>;
}

// ── Variantes avec bordure droite (tableaux style grid) ───────────────────────

/** En-tête avec bordure droite entre colonnes (tableaux investissement, financement…). */
export function ThBordered({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th className={cn("border-r border-border last:border-r-0 px-1.5 py-1.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap", className)}>
      {children}
    </th>
  );
}

/** Cellule avec bordure droite entre colonnes (tableaux investissement, financement…). */
export function TdBordered({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn("border-r border-border last:border-r-0 p-0 align-middle", className)}>
      {children}
    </td>
  );
}

// ── Checkbox "actif" standard ─────────────────────────────────────────────────

/**
 * Checkbox standardisée pour la colonne "Actif" des tableaux de formulaires.
 * Gère automatiquement le title "Désactiver" / "Activer".
 */
export function ActiveCheckbox({
  checked,
  onChange,
  isPending = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  isPending?: boolean;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-3.5 w-3.5 cursor-pointer accent-primary disabled:opacity-30"
      title={checked ? "D\u00e9sactiver" : "Activer"}
      disabled={isPending}
    />
  );
}
