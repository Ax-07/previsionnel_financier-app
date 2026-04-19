import { cn, formatAmount } from "@/lib/utils";

export const KpiCard: React.FC<React.ComponentProps<"div"> & {
  label: string;
  value: number;
  variant?: "default" | "positive" | "negative" | "neutral";
  /** Unité à afficher à la place de "€". Ex : "%", "j", "ans" */
  unit?: string;
  /** Nombre de décimales pour les valeurs avec `unit`. Défaut : 0 */
  decimals?: number;
}> = ({
  label,
  value,
  variant = "default",
  unit,
  decimals = 0,
}) => {
  const color =
    variant === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : variant === "negative"
        ? "text-destructive"
        : variant === "neutral"
          ? "text-blue-600 dark:text-blue-400"
          : "text-foreground";

  const display =
    unit !== undefined
      ? value === 0
        ? "—"
        : value.toLocaleString("fr-FR", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
      : formatAmount(value);

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-1 min-w-40 shadow-md">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className={cn("text-xl font-bold tabular-nums", color)}>
        {display}
        <span className="text-xs font-normal text-muted-foreground ml-1">
          {unit ?? "€"}
        </span>
      </span>
    </div>
  );
}