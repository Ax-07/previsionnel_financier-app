"use client";

import { cn } from "@/lib/utils";
import type { YearKey } from "@/lib/finance/utils";

interface YearSelectorProps {
  yearKeys: readonly YearKey[];
  activeYear: YearKey;
  yearLabels: Partial<Record<YearKey, string>>;
  onSelect: (year: YearKey) => void;
}

/**
 * Sélecteur d'exercice en forme de pill (y1 / y2 / y3).
 * Utilisé dans les onglets budget et TVA pour basculer entre les années.
 */
export function YearSelector({
  yearKeys,
  activeYear,
  yearLabels,
  onSelect,
}: YearSelectorProps) {
  return (
    <div className="flex overflow-hidden rounded-full">
      {yearKeys.map((yk, idx) => (
        <button
          key={yk}
          type="button"
          onClick={() => onSelect(yk)}
          className={cn(
            "px-3 py-1 text-xs font-medium transition-colors border",
            activeYear === yk
              ? "bg-primary text-primary-foreground shadow-sm border-primary"
              : "text-muted-foreground hover:bg-muted hover:border-muted hover:text-primary-foreground/80",
            idx === 0 && "rounded-l-full",
            idx === yearKeys.length - 1 && "rounded-r-full",
          )}
        >
          {yearLabels[yk]}
        </button>
      ))}
    </div>
  );
}
