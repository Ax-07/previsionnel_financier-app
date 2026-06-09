"use client";

import { useDiversStore } from "@/stores/divers-store";
import { type DiversFluxDateRow } from "@/lib/schemas/divers";
import { TableauFluxDate, type FluxSectionConfig } from "./tableau-flux-date";

export function TableauRemboursementsCC({
  dossierId,
  initialData = [],
}: {
  dossierId: string;
  initialData?: DiversFluxDateRow[];
}) {
  const store = useDiversStore();
  const config: FluxSectionConfig = {
    type: "REMBOURSEMENT_CC",
    title: "Remboursements en comptes courants",
    description: "Remboursements de comptes courants d’associés — ↓ Trésorerie, ↓ Dettes.",
    emptyMessage: "Aucun remboursement — cliquez sur « Ajouter » pour commencer.",
    getRows: (id) => store.getDraft(id).remboursementsCC,
    isDirty: (id) => store.getDraft(id).hasUnsavedRemboursementsCC,
    setRows: store.setRemboursementsCC,
    setRowsDirty: store.setRemboursementsCCRows,
    addRow: store.addRemboursementCC,
    addGroup: store.addRemboursementsCCGroup,
    addToGroup: store.addRemboursementsCCToGroup,
    updateRow: store.updateRemboursementCC,
    removeRow: store.removeRemboursementCC,
    duplicateRow: store.duplicateRemboursementCC,
    markSaved: store.markRemboursementsCCSaved,
  };
  return <TableauFluxDate dossierId={dossierId} initialData={initialData} config={config} />;
}
