"use client";

import { useCallback, useState } from "react";
import {
  RefreshCwIcon,
  BarChart2Icon,
  TrendingUpIcon,
  CircleDollarSignIcon,
  TargetIcon,
  CalendarCheckIcon,
  WalletIcon,
  GaugeIcon,
  PiggyBankIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDashboardKpiData } from "@/hooks/controle/use-dashboard-kpi-data";
import { useScenarioDataStore } from "@/stores/scenario-data-store";
import type { YearKey } from "@/lib/finance/utils";
import { YEAR_KEYS, findGroupCard } from "./utils";
import { AnnuelChart } from "@/components/charts/annuel-chart";
import { ChargesChart } from "@/components/charts/charges-chart";
import { SeuilChart } from "@/components/charts/seuil-chart";
import { PfChart } from "@/components/charts/pf-chart";
import { HeroKpiCard } from "./hero-kpi-card";
import { KpisSecondairesPanel } from "./kpis-secondaires-panel";
import { TableauMensuelPanel } from "./tableau-mensuel-panel";
import { FinancementKpisPanel } from "./financement-kpis-panel";
import { SoliditeFinancierePanel } from "./solidite-financiere-panel";
import { RentabilitePanel } from "./rentabilite-panel";
import { RentabiliteChart } from "@/components/charts/rentabilite-chart";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { ChartPanel } from "./chart-tooltip";

interface DashboardKpiTabProps {
  dossierId: string;
}

export default function DashboardKpiTab({ dossierId }: DashboardKpiTabProps) {
  const { data, status, error } = useDashboardKpiData(dossierId);
  const [selectedYear, setSelectedYear] = useState<YearKey>("y1");
  const reload = useCallback(() => useScenarioDataStore.getState().reload(dossierId), [dossierId]);

  if (status === "loading" || status === "idle") {
    return <DashboardSkeleton />;
  }

  if (status === "error" || !data) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Badge variant="destructive">{error ?? "Erreur de chargement"}</Badge>
          <Button variant="outline" size="sm" onClick={reload} className="gap-2">
            <RefreshCwIcon className="size-4" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b bg-background px-4 py-2.5">
        <div>
          <h2 className="text-sm font-semibold">Prévisionnel financier</h2>
          <p className="text-[11px] text-muted-foreground">
            Tableau de bord — {Object.values(data.yearLabels).join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Sélecteur d'exercice" className="flex gap-0.5 rounded-md border p-0.5">
            {YEAR_KEYS.map((yk) => (
              <button
                key={yk}
                type="button"
                aria-pressed={selectedYear === yk}
                onClick={() => setSelectedYear(yk)}
                className={cn(
                  "rounded px-2.5 py-1 text-[10px] font-medium transition-colors",
                  selectedYear === yk
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {data.yearLabels[yk]}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={reload} className="gap-1.5 text-xs">
            <RefreshCwIcon className="size-3.5" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* ── Corps scrollable ──────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          {/* ── Ligne 1 — Hero KPIs ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            <HeroKpiCard
              label="Chiffre d'affaires"
              card={findGroupCard(data.groups, "ca")}
              yk={selectedYear}
              accent="bg-blue-500/5 border-blue-500/20"
              iconEl={<BarChart2Icon className="size-5 text-blue-500" />}
            />
            <HeroKpiCard
              label="Marge brute"
              card={findGroupCard(data.groups, "marge_globale")}
              yk={selectedYear}
              accent="bg-amber-500/5 border-amber-500/20"
              iconEl={<TrendingUpIcon className="size-5 text-amber-500" />}
            />
            <HeroKpiCard
              label="Résultat net"
              card={findGroupCard(data.groups, "res_net")}
              yk={selectedYear}
              accent="bg-green-500/5 border-green-500/20"
              iconEl={<CircleDollarSignIcon className="size-5 text-green-500" />}
            />
            <HeroKpiCard
              label="Seuil d'équilibre"
              card={findGroupCard(data.groups, "seuil_eco")}
              yk={selectedYear}
              accent="bg-rose-500/5 border-rose-500/20"
              iconEl={<TargetIcon className="size-5 text-rose-500" />}
            />
            <HeroKpiCard
              label="Point mort"
              card={findGroupCard(data.groups, "point_mort")}
              yk={selectedYear}
              accent="bg-cyan-500/5 border-cyan-500/20"
              iconEl={<CalendarCheckIcon className="size-5 text-cyan-500" />}
            />
            <HeroKpiCard
              label="Trésorerie fin d'exercice"
              card={findGroupCard(data.groups, "tresorerie_mensuelle")}
              yk={selectedYear}
              accent="bg-emerald-500/5 border-emerald-500/20"
              iconEl={<WalletIcon className="size-5 text-emerald-500" />}
            />
            <HeroKpiCard
              label="Autonomie de trésorerie"
              card={findGroupCard(data.groups, "runway")}
              yk={selectedYear}
              accent="bg-orange-500/5 border-orange-500/20"
              iconEl={<GaugeIcon className="size-5 text-orange-500" />}
            />
            <HeroKpiCard
              label="Capacité d'autofinancement"
              card={findGroupCard(data.groups, "caf")}
              yk={selectedYear}
              accent="bg-violet-500/5 border-violet-500/20"
              iconEl={<PiggyBankIcon className="size-5 text-violet-500" />}
            />
          </div>

          {/* ── Ligne 2 — Solidité financière ──────────────────────────── */}
          <h3>Est ce que le projet est finançable ?</h3>
          {/* ── Ligne 7 — Investissements & Financement ──────────────────── */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_3fr]">
            <FinancementKpisPanel groups={data.groups} yearLabels={data.yearLabels} y0Label={data.y0Label} />
            <ChartPanel className="h-full" title="Plan de financement">
              <PfChart data={data.charts.planFinancement} />
            </ChartPanel>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {/* KPI — 4 cartes statut avec seuils */}
            <SoliditeFinancierePanel groups={data.groups} yk={selectedYear} />
          </div>

          <h3>Est-ce que le projet est rentable et viable dans le temps ?</h3>
          {/* ── Ligne 3 — Performance économique ────────────────────────── */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="h-70">
              <RentabilitePanel groups={data.groups} yk={selectedYear} />
            </div>
            <ChartPanel className="h-70" title="Performance économique">
              <RentabiliteChart data={data.charts.annuel} />
            </ChartPanel>
          </div>

          {/* ── Ligne 4 — Robustesse du modèle ───────────────────────── */}
          <h3>Est-ce que le modèle est robuste ?</h3>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <KpisSecondairesPanel groups={data.groups} yearLabels={data.yearLabels} />
            <ChartPanel className="h-64" title="Seuil de rentabilité">
              <SeuilChart data={data.charts.seuil} />
            </ChartPanel>
          </div>

          {/* ── Ligne 5 — CA vs Charges + Répartition charges ───────────── */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <ChartPanel className="h-56" title="CA vs Charges / Résultat">
              <AnnuelChart data={data.charts.annuel} monthly={data.charts.monthly} selectedYear={selectedYear} />
            </ChartPanel>
            <ChartPanel className="h-56" title="Répartition des charges">
              <ChargesChart
                data={data.charts.chargesBreakdown}
                yearLabels={data.yearLabels}
                selectedYear={selectedYear}
              />
            </ChartPanel>
          </div>


          {/* ── Ligne 8 — Tableau mensuel ─────────────────────────────────── */}
          <TableauMensuelPanel data={data.charts} yearLabels={data.yearLabels} defaultYear={selectedYear} />
        </div>
      </div>
    </div>
  );
}
