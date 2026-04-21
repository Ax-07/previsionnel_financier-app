"use client";

import { Badge } from "@/components/ui/badge";
import type { HypotheseType } from "@/lib/schemas/hypothese";
import { cn } from "@/lib/utils";

const HYPOTHESE_CONFIG: Record<
  HypotheseType,
  { label: string; className: string }
> = {
  COMMUNE: {
    label: "Commune",
    className: "bg-muted text-muted-foreground border-transparent",
  },
  PESSIMISTE: {
    label: "Pessimiste",
    className:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  },
  REALISTE: {
    label: "Réaliste",
    className:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  },
  OPTIMISTE: {
    label: "Optimiste",
    className:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  },
};

interface HypotheseBadgeProps {
  hypothese: HypotheseType;
  className?: string;
}

/**
 * Badge coloré affichant le type d'hypothèse d'une ligne de saisie.
 */
export function HypotheseBadge({ hypothese, className }: HypotheseBadgeProps) {
  const config = HYPOTHESE_CONFIG[hypothese];
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] px-1.5 py-0 font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
