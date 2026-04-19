"use client";

import { memo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LigneCotisation } from "@/lib/paie/types";
import { formatEur } from "@/lib/format";
import { LIBELLES_FAMILLE } from "./famille-labels";

// ─────────────────────────────────────────────────────────────────────────────
// Composant CotisationLine
// ─────────────────────────────────────────────────────────────────────────────

interface CotisationLineProps {
  ligne: LigneCotisation;
  /** Affiche un fond légèrement coloré (pour les lignes paires / RGDU) */
  highlight?: boolean;
}

export const CotisationLine = memo(function CotisationLine({ ligne, highlight }: CotisationLineProps) {
  const montantSalarial = ligne.montantSalarie ?? 0;
  const montantPatronal = ligne.montantEmployeur ?? 0;

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 px-3 py-1.5 text-sm",
        highlight && "rounded bg-primary/5"
      )}
    >
      {/* Libellé + info bulle */}
      <div className="flex items-center gap-1 truncate">
        <span className="truncate">{ligne.libelle}</span>
        {ligne.regleCode && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`Détails : ${ligne.libelle}`}
                className="shrink-0 text-muted-foreground hover:text-foreground focus:outline-none"
              >
                <InfoIcon className="size-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 text-xs" side="right">
              <p className="font-semibold mb-1">{ligne.libelle}</p>
              {ligne.famille && (
                <p className="text-muted-foreground mb-2">
                  {LIBELLES_FAMILLE[ligne.famille] ?? ligne.famille}
                </p>
              )}
              <dl className="grid grid-cols-2 gap-x-2 gap-y-1">
                {ligne.assiette !== undefined && (
                  <>
                    <dt className="text-muted-foreground">Assiette</dt>
                    <dd className="text-right font-mono">
                      {formatEur(ligne.assiette)}
                    </dd>
                  </>
                )}
                {ligne.tauxSalarie !== undefined && (
                  <>
                    <dt className="text-muted-foreground">Taux salarial</dt>
                    <dd className="text-right font-mono">
                      {(ligne.tauxSalarie * 100).toFixed(2)} %
                    </dd>
                  </>
                )}
                {ligne.tauxEmployeur !== undefined && (
                  <>
                    <dt className="text-muted-foreground">Taux patronal</dt>
                    <dd className="text-right font-mono">
                      {(ligne.tauxEmployeur * 100).toFixed(2)} %
                    </dd>
                  </>
                )}
              </dl>
              {ligne.regleCode && (
                <p className="mt-2 text-muted-foreground italic border-t pt-1">
                  Réf. : {ligne.regleCode}
                </p>
              )}
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Badge famille (compact) */}
      <div className="hidden md:flex">
        {ligne.famille && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {LIBELLES_FAMILLE[ligne.famille] ?? ligne.famille}
          </Badge>
        )}
      </div>

      {/* Salarial */}
      <span
        className={cn(
          "w-20 text-right font-mono tabular-nums",
          montantSalarial < 0
            ? "text-green-700 dark:text-green-400"
            : montantSalarial > 0
              ? "text-destructive"
              : "text-muted-foreground"
        )}
      >
        {montantSalarial !== 0 ? formatEur(Math.abs(montantSalarial)) : "—"}
      </span>

      {/* Patronal */}
      <span
        className={cn(
          "w-20 text-right font-mono tabular-nums",
          montantPatronal < 0
            ? "text-green-700 dark:text-green-400"
            : "text-muted-foreground"
        )}
      >
        {montantPatronal !== 0 ? formatEur(Math.abs(montantPatronal)) : "—"}
      </span>
    </div>
  );
});
CotisationLine.displayName = "CotisationLine";

// ─────────────────────────────────────────────────────────────────────────────
// En-tête des colonnes
// ─────────────────────────────────────────────────────────────────────────────

export function CotisationTableHeader() {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 border-b px-3 pb-1.5 text-xs font-medium text-muted-foreground">
      <span>Cotisation</span>
      <span className="hidden md:block">Famille</span>
      <span className="w-20 text-right">Salarial</span>
      <span className="w-20 text-right">Patronal</span>
    </div>
  );
}


