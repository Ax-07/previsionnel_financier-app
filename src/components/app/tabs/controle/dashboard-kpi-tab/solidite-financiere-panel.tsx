"use client";

import { InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KpiGroup } from "@/hooks/controle/use-dashboard-kpi-data";
import type { YearKey } from "@/lib/finance/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { findGroupCard, formatKpiValue } from "./utils";
import { formatNumber } from "@/lib/format";

// ── Statuts ────────────────────────────────────────────────────────────────────

type Status = "bon" | "moyen" | "danger" | "neutre";

const STATUS_STYLES: Record<Status, string> = {
  bon: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
  moyen: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30",
  danger: "bg-destructive/10 text-destructive border border-destructive/30",
  neutre: "bg-muted/50 text-muted-foreground border border-transparent",
};

const STATUS_LABELS: Record<Status, string> = {
  bon: "Bon",
  moyen: "Moyen",
  danger: "Risque",
  neutre: "—",
};

function getCouvertureCafStatus(amount: number): Status {
  if (!Number.isFinite(amount)) return "neutre";
  if (amount >= 1.3) return "bon";
  if (amount >= 1.0) return "moyen";
  return "danger";
}

function getTauxEndettementStatus(amount: number): Status {
  if (!Number.isFinite(amount)) return "neutre";
  if (amount < 80) return "bon";
  if (amount <= 150) return "moyen";
  return "danger";
}

function getApportsStatus(amount: number, total: number): Status {
  if (!Number.isFinite(amount) || !Number.isFinite(total) || total <= 0) return "neutre";
  const pct = (amount / total) * 100;
  if (pct > 20) return "bon";
  if (pct >= 10) return "moyen";
  return "danger";
}

function getCouvertureBesoinsStatus(ratio: number): Status {
  if (!Number.isFinite(ratio) || ratio <= 0) return "neutre";
  if (ratio >= 100) return "bon";
  if (ratio >= 95) return "moyen";
  return "danger";
}

const COUVERTURE_STATUS_LABELS: Record<Status, string> = {
  bon: "Couvert",
  moyen: "Limite",
  danger: "Déficit",
  neutre: "—",
};

// ── Composant principal ────────────────────────────────────────────────────────

interface SoliditeFinancierePanelProps {
  groups: KpiGroup[];
  yk: YearKey;
}

export function SoliditeFinancierePanel({ groups, yk }: SoliditeFinancierePanelProps) {
  const cafCard = findGroupCard(groups, "couverture_caf");
  const endettementCard = findGroupCard(groups, "taux_endettement");
  const apportsCard = findGroupCard(groups, "apports_capital");
  const empruntCard = findGroupCard(groups, "nouveaux_emprunts");
  const cafMontantCard = findGroupCard(groups, "caf");
  const remboursementCard = findGroupCard(groups, "remboursement_capital");
  const dettesCard = findGroupCard(groups, "capital_restant_du");
  const capitauxPropresCard = findGroupCard(groups, "capitaux_propres");
  const totalBesoinsCard = findGroupCard(groups, "total_besoins_initial");
  const totalRessourcesCard = findGroupCard(groups, "total_ressources_initial");

  const cafVal = cafCard?.values[yk];
  const endettementVal = endettementCard?.values[yk];
  const apportsVal = apportsCard?.values[yk];
  const empruntVal = empruntCard?.values[yk];
  const cafMontantVal = cafMontantCard?.values[yk];
  const remboursementVal = remboursementCard?.values[yk];
  const dettesVal = dettesCard?.values[yk];
  const capitauxPropresVal = capitauxPropresCard?.values[yk];
  const totalBesoinsVal = totalBesoinsCard?.values[yk];
  const totalRessourcesVal = totalRessourcesCard?.values[yk];

  const totalFinancement = (apportsVal?.amount ?? 0) + (empruntVal?.amount ?? 0);
  const apportsPct = totalFinancement > 0 ? ((apportsVal?.amount ?? 0) / totalFinancement) * 100 : 0;
  const besoinTotal = totalBesoinsVal?.amount ?? 0;
  const ressourcesTotal = totalRessourcesVal?.amount ?? 0;
  const couvertureBesoins = besoinTotal > 0 ? (ressourcesTotal / besoinTotal) * 100 : 0;
  const soldePf = ressourcesTotal - besoinTotal;

  const fmtEur = (v: number | null | undefined) => v == null || !Number.isFinite(v) ? "—" : `${formatNumber(Math.round(v), 0)} €`;
  const cafStatus = getCouvertureCafStatus(cafVal?.amount ?? 0);
  const endettementStatus = getTauxEndettementStatus(endettementVal?.amount ?? 0);
  const apportsStatus = getApportsStatus(apportsVal?.amount ?? 0, totalFinancement);
  const couvertureBesoinsStatus = getCouvertureBesoinsStatus(couvertureBesoins);

  return (
    <TooltipProvider delayDuration={200}>
    <div className="grid grid-cols-2 gap-3 h-full">
      {/* Couverture CAF */}
      <div className="flex flex-col justify-between rounded-lg border bg-card p-3 shadow-sm">
        <div className="mb-2 flex items-start justify-between gap-1">
          <div>
            <div className="flex items-center gap-1">
              <p className="text-[11px] font-semibold text-foreground">Couverture CAF</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="size-4 shrink-0 cursor-help text-blue-400 hover:text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-57.5 space-y-1.5 p-3">
                  <p className="text-[11px] font-semibold">Couverture CAF</p>
                  <p className="text-[10px] text-muted-foreground">CAF &divide; remboursements annuels du capital</p>
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />&gt; 1.3&times; — couverture confortable</div>
                    <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-amber-500" />1.0–1.3&times; — couverture juste, peu de marge</div>
                    <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-destructive" />&lt; 1.0&times; — CAF insuffisante pour rembourser</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-[10px] text-muted-foreground">Capacité à rembourser la dette</p>
          </div>
          <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold", STATUS_STYLES[cafStatus])}>
            {STATUS_LABELS[cafStatus]}
          </span>
        </div>
        <p className="text-xl font-bold tabular-nums">
          {cafVal ? formatKpiValue(cafVal.amount, cafCard!.format) : "—"}
        </p>
        {((cafMontantVal?.amount ?? 0) !== 0 || (remboursementVal?.amount ?? 0) !== 0) && (
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            CAF {fmtEur(cafMontantVal?.amount ?? 0)}
            {remboursementVal && remboursementVal.amount > 0 && (
              <> · Remboursements {fmtEur(remboursementVal.amount)}</>
            )}
          </p>
        )}
      </div>

      {/* Taux d'endettement */}
      <div className="flex flex-col justify-between rounded-lg border bg-card p-3 shadow-sm">
        <div className="mb-2 flex items-start justify-between gap-1">
          <div>
            <div className="flex items-center gap-1">
              <p className="text-[11px] font-semibold text-foreground">Taux d&apos;endettement</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="size-4 shrink-0 cursor-help text-blue-400 hover:text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-57.5 space-y-1.5 p-3">
                  <p className="text-[11px] font-semibold">Taux d&apos;endettement</p>
                  <p className="text-[10px] text-muted-foreground">Emprunts &divide; Capitaux propres &times; 100</p>
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />&lt; 80 % — bonne autonomie financière</div>
                    <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-amber-500" />80–150 % — endettement significatif</div>
                    <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-destructive" />&gt; 150 % — dépendance excessive aux créanciers</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-[10px] text-muted-foreground">Poids de la dette</p>
          </div>
          <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold", STATUS_STYLES[endettementStatus])}>
            {STATUS_LABELS[endettementStatus]}
          </span>
        </div>
        <p className="text-xl font-bold tabular-nums">
          {endettementVal ? formatKpiValue(endettementVal.amount, endettementCard!.format) : "—"}
        </p>
        {((dettesVal?.amount ?? 0) !== 0 || (capitauxPropresVal?.amount ?? 0) !== 0) && (
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Dettes {fmtEur(dettesVal?.amount ?? 0)}
            {capitauxPropresVal && capitauxPropresVal.amount !== 0 && (
              <> · Capitaux propres {fmtEur(capitauxPropresVal.amount)}</>
            )}
          </p>
        )}
      </div>

      {/* Apports personnels */}
      <div className="flex flex-col justify-between rounded-lg border bg-card p-3 shadow-sm">
        <div className="mb-2 flex items-start justify-between gap-1">
          <div>
            <div className="flex items-center gap-1">
              <p className="text-[11px] font-semibold text-foreground">Apports personnel</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="size-4 shrink-0 cursor-help text-blue-400 hover:text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-57.5 space-y-1.5 p-3">
                  <p className="text-[11px] font-semibold">Apports personnel</p>
                  <p className="text-[10px] text-muted-foreground">Capital + comptes courants / total financement</p>
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />&gt; 20 % — fort engagement du porteur</div>
                    <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-amber-500" />10–20 % — engagement modéré</div>
                    <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-destructive" />&lt; 10 % — risque perçu élevé par les prêteurs</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-[10px] text-muted-foreground">Engagement du porteur de projet</p>
          </div>
          <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold", STATUS_STYLES[apportsStatus])}>
            {STATUS_LABELS[apportsStatus]}
          </span>
        </div>
        <p className="text-xl font-bold tabular-nums">
          {apportsVal ? formatKpiValue(apportsVal.amount, apportsCard!.format) : "—"}
        </p>
        {apportsPct > 0 && (
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            {apportsPct.toFixed(0)} % du financement total
            {totalFinancement > 0 && <> · Total {fmtEur(totalFinancement)}</>}
          </p>
        )}
      </div>

      {/* Couverture des besoins */}
      <div className="flex flex-col justify-between rounded-lg border bg-card p-3 shadow-sm">
        <div className="mb-2 flex items-start justify-between gap-1">
          <div>
            <div className="flex items-center gap-1">
              <p className="text-[11px] font-semibold text-foreground">Couverture des besoins au démarrage</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="size-4 shrink-0 cursor-help text-blue-400 hover:text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-57.5 space-y-1.5 p-3">
                  <p className="text-[11px] font-semibold">Couverture des besoins au démarrage</p>
                  <p className="text-[10px] text-muted-foreground">Total ressources &divide; Total besoins &times; 100</p>
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />≥ 100 % — projet entièrement financé</div>
                    <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-amber-500" />95–100 % — léger déficit de financement</div>
                    <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-destructive" />&lt; 95 % — gap de financement significatif</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-[10px] text-muted-foreground">Équilibre du montage</p>
          </div>
          {couvertureBesoins > 0 && (
            <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold", STATUS_STYLES[couvertureBesoinsStatus])}>
              {COUVERTURE_STATUS_LABELS[couvertureBesoinsStatus]}
            </span>
          )}
        </div>
        <p className="text-xl font-bold tabular-nums">
          {couvertureBesoins > 0 ? `${couvertureBesoins.toFixed(1)} %` : "—"}
        </p>
        {(ressourcesTotal > 0 || besoinTotal > 0) && (
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Ressources {fmtEur(ressourcesTotal)} · Besoins {fmtEur(besoinTotal)} · Solde {soldePf >= 0 ? "+" : ""}{fmtEur(soldePf)}
          </p>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}

