"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrendingUpIcon,
} from "lucide-react";
import type { SimulationResultat } from "@/lib/paie/types";
import { formatEur } from "@/lib/format";

// ─────────────────────────────────────────────────────────────────────────────
// Types internes
// ─────────────────────────────────────────────────────────────────────────────

interface LigneAnnuelle {
  libelle: string;
  mensuel: number;
  annuel: number;
  accent?: "green" | "red" | "muted";
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

interface AnnualProjectionProps {
  resultat: SimulationResultat;
}

/**
 * Affiche la projection annuelle (× 12 mois) du bulletin courant.
 *
 * Hypothèses simplifiées (projection linéaire) :
 *   - Même bulletin chaque mois (pas de régularisation progressive).
 *   - Les primes exceptionnelles et les augmentations ne sont pas modélisées.
 *   - La 13e mensualité n'est pas incluse (non applicable par défaut).
 *
 * Ce composant est purement présentatiel : le calcul est une simple multiplication.
 */
export function AnnualProjection({ resultat }: AnnualProjectionProps) {
  const [detailsOuverts, setDetailsOuverts] = useState(false);

  const lignes: LigneAnnuelle[] = [
    {
      libelle: "Brut soumis",
      mensuel: resultat.brutSoumis,
      annuel: resultat.brutSoumis * 12,
      accent: "muted",
    },
    {
      libelle: "Net à payer",
      mensuel: resultat.netAPayer,
      annuel: resultat.netAPayer * 12,
      accent: "green",
    },
    {
      libelle: "Coût employeur",
      mensuel: resultat.coutEmployeur,
      annuel: resultat.coutEmployeur * 12,
      accent: "muted",
    },
    {
      libelle: "Cotisations salariales",
      mensuel: Math.abs(resultat.totalCotisationsSalariales),
      annuel: Math.abs(resultat.totalCotisationsSalariales) * 12,
      accent: "red",
    },
    {
      libelle: "Cotisations patronales nettes",
      mensuel: resultat.totalCotisationsPatronales,
      annuel: resultat.totalCotisationsPatronales * 12,
      accent: "red",
    },
    ...(resultat.montantRGDU > 0
      ? [
          {
            libelle: "RGDU (économie employeur)",
            mensuel: resultat.montantRGDU,
            annuel: resultat.montantRGDU * 12,
            accent: "green" as const,
          },
        ]
      : []),
    {
      libelle: "PAS (impôt à la source)",
      mensuel: resultat.pas,
      annuel: resultat.pas * 12,
      accent: "red",
    },
  ];

  const coutTotal = resultat.coutEmployeur * 12;
  const netTotal = resultat.netAPayer * 12;
  const chargesTotal = (resultat.coutEmployeur - resultat.netAPayer) * 12;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDaysIcon className="size-5 text-primary" />
            Coût annuel (× 12 mois)
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Projection linéaire
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* ── Métriques clés ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-green-50 p-3 dark:bg-green-950/30">
            <p className="text-[11px] font-medium uppercase text-green-700 dark:text-green-400">
              Net annuel salarié
            </p>
            <p className="mt-1 text-lg font-bold text-green-900 dark:text-green-200 tabular-nums">
              {formatEur(netTotal)}
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-[11px] font-medium uppercase text-muted-foreground">
              Coût total employeur
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums">
              {formatEur(coutTotal)}
            </p>
          </div>

          <div className="rounded-lg border bg-red-50 p-3 dark:bg-red-950/30">
            <p className="text-[11px] font-medium uppercase text-red-700 dark:text-red-400">
              Charges totales
            </p>
            <p className="mt-1 text-lg font-bold text-red-900 dark:text-red-200 tabular-nums">
              {formatEur(chargesTotal)}
            </p>
          </div>
        </div>

        {/* ── Ratio net / coût ── */}
        <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <TrendingUpIcon className="size-4" />
            Part nette dans le coût total
          </span>
          <span className="font-semibold">
            {coutTotal > 0
              ? ((netTotal / coutTotal) * 100).toFixed(1) + " %"
              : "—"}
          </span>
        </div>

        <Separator />

        {/* ── Détail ligne par ligne ── */}
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-between text-sm text-muted-foreground"
            onClick={() => setDetailsOuverts((v) => !v)}
            aria-expanded={detailsOuverts}
            aria-controls="annual-projection-detail"
          >
            Détail poste par poste
            {detailsOuverts
              ? <ChevronUpIcon className="size-4" />
              : <ChevronDownIcon className="size-4" />}
          </Button>

          {detailsOuverts && (
            <div id="annual-projection-detail" className="mt-3 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs font-semibold uppercase text-muted-foreground">
                    <TableHead>Poste</TableHead>
                    <TableHead className="text-right">Mensuel</TableHead>
                    <TableHead className="text-right">Annuel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((l) => (
                    <TableRow key={l.libelle}>
                      <TableCell className={accentClass(l.accent, "label")}>
                        {l.libelle}
                      </TableCell>
                      <TableCell className={accentClass(l.accent, "value")}>
                        {formatEur(l.mensuel)}
                      </TableCell>
                      <TableCell className={accentClass(l.accent, "value") + " font-semibold"}>
                        {formatEur(l.annuel)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">
          Projection basée sur le bulletin actuel × 12. Ne tient pas compte des
          régularisations, augmentations, primes annuelles exceptionnelles ou
          modifications réglementaires en cours d&apos;exercice.
        </p>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers UI
// ─────────────────────────────────────────────────────────────────────────────

function accentClass(
  accent: "green" | "red" | "muted" | undefined,
  role: "label" | "value",
): string {
  const base = role === "value" ? "py-2 text-right tabular-nums" : "py-2";
  if (accent === "green") return `${base} text-green-700 dark:text-green-400`;
  if (accent === "red") return `${base} text-red-600 dark:text-red-400`;
  return `${base} text-muted-foreground`;
}
