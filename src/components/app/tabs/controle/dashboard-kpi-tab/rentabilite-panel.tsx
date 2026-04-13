"use client";

import { InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KpiGroup } from "@/hooks/controle/use-dashboard-kpi-data";
import type { YearKey } from "@/lib/finance/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { findGroupCard, formatAmount } from "./utils";

// ── Statuts ────────────────────────────────────────────────────────────────────

type Status = "bon" | "moyen" | "danger" | "neutre";

const STATUS_STYLES: Record<Status, string> = {
  bon:    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
  moyen:  "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30",
  danger: "bg-destructive/10 text-destructive border border-destructive/30",
  neutre: "bg-muted/50 text-muted-foreground border border-transparent",
};

const STATUS_LABELS: Record<Status, string> = {
  bon:    "Positif",
  moyen:  "Faible",
  danger: "Négatif",
  neutre: "—",
};

const EBE_STATUS_LABELS: Record<Status, string> = {
  bon:    "Bon",
  moyen:  "Moyen",
  danger: "Risque",
  neutre: "—",
};

const SEUIL_STATUS_LABELS: Record<Status, string> = {
  bon:    "Atteint",
  moyen:  "Limite",
  danger: "Non atteint",
  neutre: "—",
};

const TRESO_STATUS_LABELS: Record<Status, string> = {
  bon:    "Sûre",
  moyen:  "Attention",
  danger: "Risque",
  neutre: "—",
};

function getResNetStatus(amount: number, pctOfCa: number | null | undefined): Status {
  if (!Number.isFinite(amount)) return "neutre";
  if (amount < 0) return "danger";
  if ((pctOfCa ?? 0) < 5) return "moyen";
  return "bon";
}

function getEbeStatus(pctOfCa: number | null | undefined): Status {
  const pct = pctOfCa ?? 0;
  if (!Number.isFinite(pct)) return "neutre";
  if (pct >= 15) return "bon";
  if (pct >= 5) return "moyen";
  return "danger";
}

function getSeuilStatus(ca: number, seuil: number): Status {
  if (!Number.isFinite(ca) || !Number.isFinite(seuil) || seuil <= 0) return "neutre";
  const ratio = ca / seuil;
  if (ratio >= 1) return "bon";
  if (ratio >= 0.9) return "moyen";
  return "danger";
}

function getTresoStatus(amount: number, runway: number): Status {
  if (!Number.isFinite(amount)) return "neutre";
  if (amount < 0) return "danger";
  if (runway < 2) return "danger";
  if (runway < 6) return "moyen";
  return "bon";
}

// ── Composant principal ────────────────────────────────────────────────────────

interface RentabilitePanelProps {
  groups: KpiGroup[];
  yk: YearKey;
}

export function RentabilitePanel({ groups, yk }: RentabilitePanelProps) {
  const resNetCard   = findGroupCard(groups, "res_net");
  const ebeCard      = findGroupCard(groups, "ebe");
  const seuilCard    = findGroupCard(groups, "seuil_eco");
  const caCard       = findGroupCard(groups, "ca");
  const tresoCard    = findGroupCard(groups, "tresorerie_mensuelle");
  const runwayCard   = findGroupCard(groups, "runway");

  const resNetVal = resNetCard?.values[yk];
  const ebeVal    = ebeCard?.values[yk];
  const seuilVal  = seuilCard?.values[yk];
  const caVal     = caCard?.values[yk];
  const tresoVal  = tresoCard?.values[yk];
  const runwayVal = runwayCard?.values[yk];

  const resNetStatus = getResNetStatus(resNetVal?.amount ?? 0, resNetVal?.pctOfCa);
  const ebeStatus    = getEbeStatus(ebeVal?.pctOfCa);
  const seuilStatus  = getSeuilStatus(caVal?.amount ?? 0, seuilVal?.amount ?? 0);
  const tresoStatus  = getTresoStatus(tresoVal?.amount ?? 0, runwayVal?.amount ?? 0);

  const frCurrency = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtEur = (v: number | null | undefined) =>
    v == null || !Number.isFinite(v) ? "—" : `${frCurrency.format(Math.round(v))} €`;
  const fmtPct = (v: number | null | undefined) =>
    v == null || !Number.isFinite(v) ? "" : ` (${v.toFixed(1)} % du CA)`;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-2 gap-3 h-full">

        {/* ── Résultat net ─────────────────────────────────────────────── */}
        <div className="flex flex-col justify-between rounded-lg border bg-card p-3 shadow-sm">
          <div className="mb-2 flex items-start justify-between gap-1">
            <div>
              <div className="flex items-center gap-1">
                <p className="text-[11px] font-semibold text-foreground">Résultat net</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="size-4 shrink-0 cursor-help text-blue-400 hover:text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-57.5 space-y-1.5 p-3">
                    <p className="text-[11px] font-semibold">Résultat net</p>
                    <p className="text-[10px] text-muted-foreground">Résultat après charges, amortissements et impôts.</p>
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />&gt; 5 % CA — rentabilité solide</div>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-amber-500" />0–5 % CA — résultat faible</div>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-destructive" />&lt; 0 — perte</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-[10px] text-muted-foreground">Est-ce que le projet gagne de l&apos;argent ?</p>
            </div>
            <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold", STATUS_STYLES[resNetStatus])}>
              {STATUS_LABELS[resNetStatus]}
            </span>
          </div>
          <p className="text-xl font-bold tabular-nums">
            {resNetVal ? formatAmount(resNetVal.amount, resNetCard!.format) : "—"}
          </p>
          {resNetVal?.pctOfCa != null && (
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              {resNetVal.pctOfCa.toFixed(1)} % du CA
            </p>
          )}
        </div>

        {/* ── EBE / EBITDA ─────────────────────────────────────────────── */}
        <div className="flex flex-col justify-between rounded-lg border bg-card p-3 shadow-sm">
          <div className="mb-2 flex items-start justify-between gap-1">
            <div>
              <div className="flex items-center gap-1">
                <p className="text-[11px] font-semibold text-foreground">EBE / EBITDA</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="size-4 shrink-0 cursor-help text-blue-400 hover:text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-57.5 space-y-1.5 p-3">
                    <p className="text-[11px] font-semibold">Excédent Brut d&apos;Exploitation</p>
                    <p className="text-[10px] text-muted-foreground">CA − charges d&apos;exploitation hors amortissements et financier. Mesure la rentabilité opérationnelle brute.</p>
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />&gt; 15 % CA — activité rentable</div>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-amber-500" />5–15 % CA — marge correcte mais limitée</div>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-destructive" />&lt; 5 % CA — activité peu rentable</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-[10px] text-muted-foreground">Rentabilité structurelle de l&apos;activité</p>
            </div>
            <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold", STATUS_STYLES[ebeStatus])}>
              {EBE_STATUS_LABELS[ebeStatus]}
            </span>
          </div>
          <p className="text-xl font-bold tabular-nums">
            {ebeVal ? formatAmount(ebeVal.amount, ebeCard!.format) : "—"}
          </p>
          {ebeVal?.pctOfCa != null && (
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              {ebeVal.pctOfCa.toFixed(1)} % du CA
            </p>
          )}
        </div>

        {/* ── Seuil de rentabilité ──────────────────────────────────────── */}
        <div className="flex flex-col justify-between rounded-lg border bg-card p-3 shadow-sm">
          <div className="mb-2 flex items-start justify-between gap-1">
            <div>
              <div className="flex items-center gap-1">
                <p className="text-[11px] font-semibold text-foreground">Seuil de rentabilité</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="size-4 shrink-0 cursor-help text-blue-400 hover:text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-57.5 space-y-1.5 p-3">
                    <p className="text-[11px] font-semibold">Seuil d&apos;équilibre</p>
                    <p className="text-[10px] text-muted-foreground">CA minimal à réaliser pour couvrir toutes les charges. En-dessous : l&apos;activité est déficitaire.</p>
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />CA &ge; seuil — équilibre atteint</div>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-amber-500" />CA entre 90 et 100 % du seuil — zone limite</div>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-destructive" />CA &lt; 90 % du seuil — déficitaire</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-[10px] text-muted-foreground">CA minimum à atteindre</p>
            </div>
            <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold", STATUS_STYLES[seuilStatus])}>
              {SEUIL_STATUS_LABELS[seuilStatus]}
            </span>
          </div>
          <p className="text-xl font-bold tabular-nums">
            {seuilVal ? formatAmount(seuilVal.amount, seuilCard!.format) : "—"}
          </p>
          {seuilStatus === "bon" && caVal && seuilVal && seuilVal.amount > 0 && (
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Marge de sécurité {fmtEur(caVal.amount - seuilVal.amount)}
            </p>
          )}
          {seuilStatus !== "bon" && caVal && seuilVal && seuilVal.amount > 0 && (
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              CA actuel {fmtEur(caVal.amount)}{fmtPct(seuilVal.pctOfCa)}
            </p>
          )}
        </div>

        {/* ── Trésorerie ───────────────────────────────────────────────── */}
        <div className="flex flex-col justify-between rounded-lg border bg-card p-3 shadow-sm">
          <div className="mb-2 flex items-start justify-between gap-1">
            <div>
              <div className="flex items-center gap-1">
                <p className="text-[11px] font-semibold text-foreground">Trésorerie disponible</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="size-4 shrink-0 cursor-help text-blue-400 hover:text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-57.5 space-y-1.5 p-3">
                    <p className="text-[11px] font-semibold">Trésorerie fin d&apos;exercice</p>
                    <p className="text-[10px] text-muted-foreground">Solde de trésorerie au dernier mois de l&apos;exercice. L&apos;autonomie indique combien de mois l&apos;entreprise peut fonctionner sans nouveaux encaissements.</p>
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />&ge; 6 mois d&apos;autonomie — situation sûre</div>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-amber-500" />2–6 mois — vigilance</div>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 shrink-0 rounded-full bg-destructive" />&lt; 2 mois ou tréso négative — risque</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-[10px] text-muted-foreground">Est-ce que je vais manquer de cash ?</p>
            </div>
            <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold", STATUS_STYLES[tresoStatus])}>
              {TRESO_STATUS_LABELS[tresoStatus]}
            </span>
          </div>
          <p className="text-xl font-bold tabular-nums">
            {tresoVal ? formatAmount(tresoVal.amount, tresoCard!.format) : "—"}
          </p>
          {runwayVal && runwayVal.amount > 0 && (
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Autonomie {formatAmount(runwayVal.amount, runwayCard!.format)}
            </p>
          )}
        </div>

      </div>
    </TooltipProvider>
  );
}
