"use client";

import { useEffect, useMemo } from "react";
import { useScenarioDataStore } from "@/stores/scenario-data-store";
import { useHypotheseStore } from "@/stores/hypothese-store";
import type { DataStatus } from "@/lib/types/data-state";
import { buildFinCalc } from "@/lib/finance/calculs";
import type { FinCalcResult } from "@/lib/finance/calculs";
import type { ScenarioFinData } from "@/app/actions/load-scenario-data";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FinCalcState {
  data: ScenarioFinData | null;
  fc: FinCalcResult | null;
  status: DataStatus;
  error: string | null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Déclenche le chargement des données brutes (une seule fois),
 * puis calcule FinCalcResult en mémoire via useMemo.
 * Aucun appel réseau dans ce hook — uniquement des calculs purs.
 */
export function useFinCalc(dossierId: string): FinCalcState {
  const data = useScenarioDataStore((s) => s.cache[dossierId]?.data ?? null);
  const status = useScenarioDataStore((s) => s.status[dossierId] ?? "idle");
  const error = useScenarioDataStore((s) => s.errors[dossierId] ?? null);
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));

  useEffect(() => {
    if (status === "idle") {
      useScenarioDataStore.getState().load(dossierId);
    }
  }, [dossierId, status]);

  const fc = useMemo<FinCalcResult | null>(() => {
    if (!data) return null;
    return buildFinCalc(data, data.dateDemarrage, hypotheseActive);
  }, [data, hypotheseActive]);

  return { data, fc, status, error };
}
