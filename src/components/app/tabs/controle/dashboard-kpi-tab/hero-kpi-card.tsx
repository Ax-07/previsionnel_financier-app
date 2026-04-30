import { cn } from "@/lib/utils";
import type { KpiCard } from "@/hooks/controle/use-dashboard-kpi-data";
import type { YearKey } from "@/lib/finance/utils";
import { formatKpiValue } from "./utils";
import { TrendBadge } from "./trend-badge";

export function HeroKpiCard({
  label,
  card,
  yk,
  accent,
  iconEl,
}: {
  label: string;
  card: KpiCard | null;
  yk: YearKey;
  accent: string;
  iconEl: React.ReactNode;
}) {
  const val = card?.values[yk];
  const positive = card?.positive ?? "up";
  const isGood =
    val && val.amount !== 0
      ? positive === "up"
        ? val.amount > 0
        : val.amount < 0
      : null;

  return (
    <div className={cn("rounded-lg border bg-card p-4 shadow-sm", accent)}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <div className={cn("flex size-6 items-center justify-center rounded-md", accent)}>
          {iconEl}
        </div>
      </div>
      <p
        className={cn(
          "mb-2 text-xl font-bold leading-none tabular-nums tracking-tight",
          isGood === null
            ? "text-muted-foreground"
            : isGood
              ? "text-foreground"
              : "text-destructive",
        )}
      >
        {val ? formatKpiValue(val.amount, card!.format) : "—"}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {val?.trend !== null && val?.trend !== undefined ? (
          <TrendBadge trend={val.trend} positive={positive} />
        ) : (
          <span className="text-[9px] text-muted-foreground">Base N</span>
        )}
        {val?.pctOfCa != null && (
          <span className="text-[9px] text-muted-foreground">{val.pctOfCa.toFixed(1)} % du CA</span>
        )}
      </div>
    </div>
  );
}
