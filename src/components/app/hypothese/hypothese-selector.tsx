"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHypotheseStore } from "@/stores/hypothese-store";
import { HYPOTHESE_TYPE_OPTIONS, type HypotheseType } from "@/lib/schemas/hypothese";

/** Options pour le sélecteur de contrôle (exclut COMMUNE). */
const HYPOTHESE_CONTROLE_OPTIONS = HYPOTHESE_TYPE_OPTIONS.filter((o) => o.value !== "COMMUNE");

interface HypotheseSelectorProps {
  dossierId: string;
}

/**
 * Sélecteur d'hypothèse active pour les onglets de contrôle.
 * Change l'hypothèse dans le store Zustand, ce qui déclenche un
 * recalcul instantané via `useFinCalc`.
 */
export function HypotheseSelector({ dossierId }: HypotheseSelectorProps) {
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const setActive = useHypotheseStore((s) => s.setActive);

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="hypothese-selector"
        className="text-xs font-medium text-primary-foreground whitespace-nowrap"
      >
        Hypothèse
      </label>
      <Select
        value={hypotheseActive}
        onValueChange={(value) => setActive(dossierId, value as HypotheseType)}
      >
        <SelectTrigger id="hypothese-selector" className="w-[140px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start" position="popper">
          {HYPOTHESE_CONTROLE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
