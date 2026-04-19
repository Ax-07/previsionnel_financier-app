"use client";

import type { ReactNode } from "react";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ControlTabActionBarProps {
  title: string;
  hasData: boolean;
  isPending: boolean;
  onRefresh: () => void;
  /** Badges ou éléments supplémentaires à afficher après le badge "Lecture seule" (côté gauche) */
  children?: ReactNode;
  /**
   * Contenu à insérer à droite, juste avant le bouton Actualiser.
   * Utile pour les sélecteurs d'exercice, boutons "Tout déplier", etc.
   */
  rightContent?: ReactNode;
}

/**
 * Barre d'actions commune à tous les onglets de contrôle.
 * Affiche le titre, le badge "Lecture seule" (si des données sont présentes),
 * les badges additionnels optionnels, et le bouton Actualiser.
 */
export function ControlTabActionBar({
  title,
  hasData,
  isPending,
  onRefresh,
  children,
  rightContent,
}: ControlTabActionBarProps) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b bg-muted/0 px-4 py-2">
      <div className="flex items-center gap-3">
        <h2 className="font-semibold text-sm">{title}</h2>
        {hasData && (
          <Badge variant="secondary">
            Lecture seule
          </Badge>
        )}
        {children}
      </div>
      <div className="flex items-center gap-2">
        {rightContent}
        <Button
          size="sm"
          onClick={onRefresh}
          disabled={isPending}
          className="gap-1.5"
        >
          <RefreshCwIcon className={cn("size-3.5", isPending && "animate-spin")} />
          {isPending ? "Calcul…" : "Actualiser"}
        </Button>
      </div>
    </div>
  );
}
