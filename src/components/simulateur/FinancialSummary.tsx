"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TrendingDownIcon, TrendingUpIcon, PercentIcon, CoinsIcon } from "lucide-react";
import type { SimulationResultat } from "@/lib/paie/types";
import { formatEur, formatPct } from "@/lib/format";

// ─────────────────────────────────────────────────────────────────────────────
// FinancialSummary
// ─────────────────────────────────────────────────────────────────────────────

/** Données injectées depuis le simulateur vers le prévisionnel (bulletin unique) */
export interface InjectPreviData {
  tauxCotPat: number;
  tauxCotSal: number;
  coutEmployeurMensuel: number;
}

interface FinancialSummaryProps {
  resultat: SimulationResultat;
  /** Afficher le bouton "Utiliser dans le prévisionnel" */
  onInjectPrevi?: (data: InjectPreviData) => void;
}

export function FinancialSummary({ resultat, onInjectPrevi }: FinancialSummaryProps) {
  // tauxCotisationsPatronalesEffectif est déjà un pourcentage (0–100) calculé dans fiscal.ts
  const tauxPatPct = resultat.tauxCotisationsPatronalesEffectif;
  const tauxSal = resultat.brutSoumis > 0
    ? (resultat.totalCotisationsSalariales / resultat.brutSoumis)
    : 0;
  const tauxChargesTotal = resultat.brutSoumis > 0
    ? ((resultat.coutEmployeur - resultat.brutSoumis) / resultat.brutSoumis)
    : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* ── Cartes récapitulatives ── */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={<CoinsIcon className="size-4" />}
          label="Net à payer"
          value={formatEur(resultat.netAPayer)}
          accent="green"
        />
        <MetricCard
          icon={<TrendingUpIcon className="size-4" />}
          label="Coût employeur"
          value={formatEur(resultat.coutEmployeur)}
          accent="default"
        />
        <MetricCard
          icon={<PercentIcon className="size-4" />}
          label="Charges patronales"
          value={tauxPatPct.toFixed(2) + " %"}
          sublabel="sur brut"
          accent="default"
        />
        <MetricCard
          icon={<TrendingDownIcon className="size-4" />}
          label="Charges salariales"
          value={formatPct(tauxSal, 2)}
          sublabel="sur brut"
          accent="default"
        />
      </div>

      {/* ── RGDU ── */}
      {resultat.montantRGDU > 0 && (
        <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm dark:border-green-800 dark:bg-green-950/30">
          <div>
            <span className="font-semibold text-green-900 dark:text-green-300">
              Réduction générale (RGDU)
            </span>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            -{formatEur(resultat.montantRGDU)}
          </Badge>
        </div>
      )}

      <Separator />

      {/* ── Récap global ── */}
      <div className="rounded-md border p-3 text-sm">
        <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">
          Récapitulatif mensuel
        </p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <dt className="text-muted-foreground">Brut déclaré</dt>
          <dd className="text-right font-mono">{formatEur(resultat.brutSoumis)}</dd>

          <dt className="text-muted-foreground">Cotisations salariales</dt>
          <dd className="text-right font-mono text-destructive">-{formatEur(resultat.totalCotisationsSalariales)}</dd>

          <dt className="text-muted-foreground">Net imposable</dt>
          <dd className="text-right font-mono">{formatEur(resultat.netImposable)}</dd>

          {resultat.pas > 0 && <>
            <dt className="text-muted-foreground">PAS</dt>
            <dd className="text-right font-mono text-destructive">-{formatEur(resultat.pas)}</dd>
          </>}

          <dt className="font-semibold">Net à payer</dt>
          <dd className="text-right font-mono font-semibold text-green-700 dark:text-green-400">
            {formatEur(resultat.netAPayer)}
          </dd>

          <Separator className="col-span-2 my-0.5" />

          <dt className="text-muted-foreground">Cotisations patronales</dt>
          <dd className="text-right font-mono">{formatEur(resultat.totalCotisationsPatronales)}</dd>

          <dt className="font-semibold">Coût employeur</dt>
          <dd className="text-right font-mono font-semibold">{formatEur(resultat.coutEmployeur)}</dd>
        </dl>
      </div>

      {/* ── Valeur pour prévisionnel ── */}
      <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-primary">Taux pour le prévisionnel</span>
          <Badge variant="outline" className="text-primary border-primary font-mono text-sm">
            {tauxPatPct.toFixed(2)} %
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Taux de charges patronales effectif. À reporter dans le champ{" "}
          <em>Taux Cot. Pat.</em> du salarié dans votre prévisionnel.
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Taux brut total charges : <strong>{formatPct(tauxChargesTotal, 2)}</strong>
        </p>
        {onInjectPrevi && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onInjectPrevi({
                tauxCotPat: parseFloat(tauxPatPct.toFixed(2)),
                tauxCotSal: parseFloat((tauxSal * 100).toFixed(2)),
                coutEmployeurMensuel: resultat.coutEmployeur,
              })
            }
            className="mt-2 w-full border-primary/40 text-xs font-semibold text-primary hover:bg-primary/10"
          >
            Injecter dans le prévisionnel
          </Button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Carte métrique
// ─────────────────────────────────────────────────────────────────────────────

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  accent?: "green" | "red" | "default";
}

function MetricCard({ icon, label, value, sublabel, accent = "default" }: MetricCardProps) {
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-1 pt-3 px-3">
        <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <p
          className={
            accent === "green"
              ? "text-xl font-bold text-green-700 dark:text-green-400 font-mono"
              : accent === "red"
              ? "text-xl font-bold text-destructive font-mono"
              : "text-xl font-bold font-mono"
          }
        >
          {value}
        </p>
        {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      </CardContent>
    </Card>
  );
}


