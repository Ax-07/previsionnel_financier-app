"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ScenarioDataStatus } from "@/stores/scenario-data-store";

interface ControlTabContentProps {
  status: ScenarioDataStatus;
  error: string | null;
  /** Message affiché pendant le chargement initial (avant que la data soit disponible) */
  loadingMessage: string;
  /** True si la data a été chargée (data !== null), même si le tableau est vide */
  dataLoaded: boolean;
  /** True si la data est chargée ET le tableau contient au moins une ligne */
  hasRows: boolean;
  /** Tableau ou contenu principal à afficher quand hasRows === true */
  children: ReactNode;
  /** Contenu additionnel inséré avant le tableau (ex: alertes métier) */
  prependContent?: ReactNode;
  /** Classes CSS additionnelles sur le conteneur */
  className?: string;
}

/**
 * Conteneur de contenu commun à tous les onglets de contrôle.
 * Gère les états : erreur, chargement initial, vide, et données disponibles.
 */
export function ControlTabContent({
  status,
  error,
  loadingMessage,
  dataLoaded,
  hasRows,
  children,
  prependContent,
  className,
}: ControlTabContentProps) {
  const isPending = status === "loading";

  return (
    <div
      className={cn(
        "min-h-0 w-full max-w-7xl rounded-lg border border-border overflow-auto mx-auto",
        className,
      )}
    >
      {/* Erreur */}
      {error && (
        <div className="m-4 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Chargement initial */}
      {isPending && !dataLoaded && (
        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
          {loadingMessage}
        </div>
      )}

      {/* Contenu additionnel (alertes, etc.) — affiché dès que la data est chargée */}
      {dataLoaded && prependContent}

      {/* Tableau / contenu principal */}
      {hasRows && children}

      {/* État vide — data chargée mais aucune ligne */}
      {dataLoaded && !hasRows && (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <p className="text-sm">Aucune donnée disponible.</p>
          <p className="text-xs">
            Renseignez les onglets de saisie puis actualisez.
          </p>
        </div>
      )}
    </div>
  );
}
