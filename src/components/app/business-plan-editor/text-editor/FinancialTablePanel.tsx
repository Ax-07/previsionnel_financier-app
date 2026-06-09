"use client";

import React, { useState } from "react";
import type { Command } from "prosemirror-state";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCompteResultatData } from "@/hooks/controle/use-compte-resultat-data";
import { useSigData } from "@/hooks/controle/use-sig-data";
import { useBilanData } from "@/hooks/controle/use-bilan-data";
import { useCafData } from "@/hooks/controle/use-caf-data";
import { useRatiosData } from "@/hooks/controle/use-ratios-data";
import { useSeuilRentabiliteData } from "@/hooks/controle/use-seuil-rentabilite-data";
import { useBfrData } from "@/hooks/controle/use-bfr-data";
import { useTableauFinancementData } from "@/hooks/controle/use-tableau-financement-data";
import { usePlanFinancementData } from "@/hooks/controle/use-plan-financement-data";
import {
  crDataToTable,
  sigDataToTable,
  bilanDataToTable,
  cafDataToTable,
  ratiosDataToTable,
  seuilDataToTable,
  bfrDataToTable,
  tfDataToTable,
  pfDataToTable,
  type NormalizedTable,
} from "@/lib/editor/controle-to-prosemirror";
import { insertFinancialTable } from "./toolbar/commands";

interface FinancialTablePanelProps {
  isOpen: boolean;
  onClose: () => void;
  dossierId: string;
  executeCommand: (command: Command) => void;
}

const TABLE_DEFS = [
  { id: "cr", label: "Compte de résultat" },
  { id: "sig", label: "Soldes intermédiaires de gestion" },
  { id: "bilan", label: "Bilan prévisionnel" },
  { id: "caf", label: "Capacité d'autofinancement (CAF)" },
  { id: "ratios", label: "Ratios financiers" },
  { id: "seuil", label: "Seuil de rentabilité" },
  { id: "bfr", label: "Besoin en fonds de roulement (BFR)" },
  { id: "tf", label: "Tableau de financement" },
  { id: "pf", label: "Plan de financement" },
] as const;

type TableId = (typeof TABLE_DEFS)[number]["id"];

type TableEntry = {
  data: NormalizedTable | null;
  status: string;
  error: string | null;
};

export const FinancialTablePanel: React.FC<FinancialTablePanelProps> = ({
  isOpen,
  onClose,
  dossierId,
  executeCommand,
}) => {
  const [selectedId, setSelectedId] = useState<TableId | null>(null);

  const crState = useCompteResultatData(dossierId);
  const sigState = useSigData(dossierId);
  const bilanState = useBilanData(dossierId);
  const cafState = useCafData(dossierId);
  const ratiosState = useRatiosData(dossierId);
  const seuilState = useSeuilRentabiliteData(dossierId);
  const bfrState = useBfrData(dossierId);
  const tfState = useTableauFinancementData(dossierId);
  const pfState = usePlanFinancementData(dossierId);

  const tableMap: Record<TableId, TableEntry> = {
    cr: { data: crState.data ? crDataToTable(crState.data) : null, status: crState.status, error: crState.error },
    sig: { data: sigState.data ? sigDataToTable(sigState.data) : null, status: sigState.status, error: sigState.error },
    bilan: { data: bilanState.data ? bilanDataToTable(bilanState.data) : null, status: bilanState.status, error: bilanState.error },
    caf: { data: cafState.data ? cafDataToTable(cafState.data) : null, status: cafState.status, error: cafState.error },
    ratios: { data: ratiosState.data ? ratiosDataToTable(ratiosState.data) : null, status: ratiosState.status, error: ratiosState.error },
    seuil: { data: seuilState.data ? seuilDataToTable(seuilState.data) : null, status: seuilState.status, error: seuilState.error },
    bfr: { data: bfrState.data ? bfrDataToTable(bfrState.data) : null, status: bfrState.status, error: bfrState.error },
    tf: { data: tfState.data ? tfDataToTable(tfState.data) : null, status: tfState.status, error: tfState.error },
    pf: { data: pfState.data ? pfDataToTable(pfState.data) : null, status: pfState.status, error: pfState.error },
  };

  const handleInsert = () => {
    if (!selectedId) return;
    const entry = tableMap[selectedId];
    if (!entry.data) return;
    executeCommand(insertFinancialTable(entry.data));
    onClose();
    setSelectedId(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setSelectedId(null);
    }
  };

  const selectedEntry = selectedId ? tableMap[selectedId] : null;
  const canInsert = !!selectedEntry?.data;

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex w-80 flex-col gap-0 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-base">Insérer un tableau financier</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {TABLE_DEFS.map(({ id, label }) => {
            const entry = tableMap[id];
            const isLoading = entry.status === "idle" || entry.status === "loading";
            const hasError = !!entry.error;
            const isAvailable = !!entry.data;
            const isSelected = selectedId === id;

            return (
              <button
                key={id}
                disabled={!isAvailable}
                onClick={() => setSelectedId(id)}
                className={[
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isAvailable
                      ? "hover:bg-muted cursor-pointer"
                      : "cursor-not-allowed opacity-50",
                ].join(" ")}
              >
                <span className="truncate">{label}</span>
                <span className="ml-2 shrink-0">
                  {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                  {hasError && !isLoading && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                  {isAvailable && isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {isAvailable && !isSelected && (
                    <span className="text-xs text-muted-foreground">{entry.data!.rows.length}&nbsp;lignes</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 border-t px-4 py-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button className="flex-1" disabled={!canInsert} onClick={handleInsert}>
            Insérer
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
