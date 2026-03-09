"use client";

import { useCallback, useEffect } from "react";
import { RefreshCwIcon, AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  type BilanData,
  type BilanRow,
} from "@/app/actions/controle/bilan";
import type { YearKey as BilanYearKey } from "@/lib/finance/utils";
import { useBilanStore } from "@/stores/bilan-store";

// ── Helpers ───────────────────────────────────────────────────────────────────

const YEAR_KEYS: BilanYearKey[] = ["y1", "y2", "y3"];

function formatAmount(amount: number): string {
  if (amount === 0) return "—";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

// ── En-tête ───────────────────────────────────────────────────────────────────

function BilanHeader({ yearLabels }: { yearLabels: BilanData["yearLabels"] }) {
  return (
    <div className="sticky top-0 z-10 grid h-10 items-center border-b bg-background font-semibold text-sm grid-cols-[1fr_repeat(3,minmax(0,140px))]">
      <div className="px-4">Désignation</div>
      {YEAR_KEYS.map((yk) => (
        <div key={yk} className="pr-4 text-right">
          {yearLabels[yk]}
        </div>
      ))}
    </div>
  );
}

// ── Ligne de section ──────────────────────────────────────────────────────────

function BilanSectionRow({ label }: { label: string }) {
  return (
    <div className="grid grid-cols-[1fr_repeat(3,minmax(0,140px))] border-b bg-muted/50">
      <div className="col-span-4 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

// ── Ligne de données ──────────────────────────────────────────────────────────

function BilanRowItem({ row }: { row: BilanRow }) {
  const isHighlight = row.style === "highlight";
  const isSubtotal = row.style === "subtotal";
  const isIndent = row.style === "indent";

  if (
    row.hideIfZero &&
    YEAR_KEYS.every((yk) => row.values[yk].amount === 0)
  ) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid items-center border-b transition-colors",
        "grid-cols-[1fr_repeat(3,minmax(0,140px))]",
        "min-h-10",
        isHighlight && "bg-primary/10 font-bold text-primary",
        isSubtotal && "bg-muted/30 font-semibold",
        isIndent && "bg-muted/10",
        !isHighlight && !isSubtotal && "hover:bg-muted/20",
      )}
    >
      {/* Libellé */}
      <div
        className={cn(
          "flex items-center px-4 py-2.5",
          isIndent && "pl-8 text-muted-foreground",
        )}
      >
        <span className="text-sm leading-tight">{row.label}</span>
      </div>

      {/* Valeurs */}
      {YEAR_KEYS.map((yk) => {
        const val = row.values[yk];
        const isNeg = val.amount < 0;
        return (
          <div
            key={`${row.key}_${yk}`}
            className={cn(
              "pr-4 py-2.5 text-right text-sm tabular-nums",
              isNeg && !isHighlight && "text-destructive",
              isIndent && "text-muted-foreground",
            )}
          >
            {formatAmount(val.amount)}
          </div>
        );
      })}
    </div>
  );
}

// ── Alerte d'équilibre ────────────────────────────────────────────────────────

function EquilibreAlert({
  equilibre,
  yearLabels,
}: {
  equilibre: BilanData["equilibre"];
  yearLabels: BilanData["yearLabels"];
}) {
  const desequilibres = YEAR_KEYS.filter((yk) => !equilibre[yk]);
  if (desequilibres.length === 0) return null;

  return (
    <div className="m-4 flex items-start gap-3 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
      <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
      <div>
        <span className="font-semibold">Déséquilibre détecté</span> — Le total
        actif ≠ total passif pour{" "}
        {desequilibres.map((yk) => yearLabels[yk]).join(", ")}.{" "}
        Vérifiez les données de saisie.
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface BilanTabProps {
  dossierId: string;
}

export default function BilanTab({ dossierId }: BilanTabProps) {
  const { fetch, invalidate, getData, getStatus, getError } = useBilanStore();

  const data = getData(dossierId);
  const status = getStatus(dossierId);
  const error = getError(dossierId);
  const isPending = status === "loading";

  useEffect(() => {
    fetch(dossierId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleRefresh = useCallback(() => {
    invalidate(dossierId);
    fetch(dossierId, true);
  }, [dossierId, fetch, invalidate]);

  return (
    <div className="flex h-full flex-col">
      {/* ── Barre d'actions ──────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b bg-muted/20 px-4 py-2">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-sm">Bilan prévisionnel</h2>
          {data && (
            <Badge variant="secondary" className="text-xs">
              Lecture seule
            </Badge>
          )}
          {data &&
            YEAR_KEYS.every((yk) => data.equilibre[yk]) && (
              <Badge
                variant="outline"
                className="gap-1 text-xs text-emerald-600 border-emerald-600/50"
              >
                Actif = Passif
              </Badge>
            )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
          className="gap-1.5"
        >
          <RefreshCwIcon
            className={cn("size-3.5", isPending && "animate-spin")}
          />
          {isPending ? "Calcul…" : "Actualiser"}
        </Button>
      </div>

      {/* ── Contenu ──────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-auto">
        {/* Erreur */}
        {error && (
          <div className="m-4 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Chargement */}
        {isPending && !data && (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Calcul du bilan prévisionnel…
          </div>
        )}

        {/* Alerte déséquilibre */}
        {data && (
          <EquilibreAlert
            equilibre={data.equilibre}
            yearLabels={data.yearLabels}
          />
        )}

        {/* Tableau */}
        {data && data.rows.length > 0 && (
          <div className="min-w-150">
            <BilanHeader yearLabels={data.yearLabels} />
            {data.rows.map((row) =>
              row.style === "section" ? (
                <BilanSectionRow key={row.key} label={row.label} />
              ) : (
                <BilanRowItem key={row.key} row={row} />
              ),
            )}
          </div>
        )}

        {/* État vide */}
        {data && data.rows.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <p className="text-sm">Aucune donnée disponible.</p>
            <p className="text-xs">
              Renseignez les onglets de saisie puis actualisez.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
