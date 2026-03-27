import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KpiCard } from "@/hooks/controle/use-dashboard-kpi-data";

export interface TrendBadgeProps {
  trend: number | null | undefined;
  positive: KpiCard["positive"];
}

export function TrendBadge({ trend, positive }: TrendBadgeProps) {
  if (trend === null || trend === undefined) return null;

  const isPositiveSignal = positive === "up" ? trend > 0 : trend < 0;
  const isNeutral = Math.abs(trend) < 0.1;

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        <MinusIcon className="size-2.5" />
        0 %
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
        isPositiveSignal
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-destructive/10 text-destructive",
      )}
    >
      {trend > 0 ? <TrendingUpIcon className="size-2.5" /> : <TrendingDownIcon className="size-2.5" />}
      {trend > 0 ? "+" : ""}{trend.toFixed(1)} %
    </span>
  );
}
