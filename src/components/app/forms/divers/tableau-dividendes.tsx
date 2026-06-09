"use client";

import { useDiversStore } from "@/stores/divers-store";
import { type DiversFluxDateRow } from "@/lib/schemas/divers";
import { TableauFluxDate, type FluxSectionConfig } from "./tableau-flux-date";

export function TableauDividendes({
  dossierId,
  initialData = [],
}: {
  dossierId: string;
  initialData?: DiversFluxDateRow[];
}) {
  const store = useDiversStore();
  const config: FluxSectionConfig = {
    type: "DIVIDENDE",
    title: "Dividendes distribués",
    description: "Distribution de dividendes aux associés ou actionnaires.",
    emptyMessage: "Aucun dividende — cliquez sur « Ajouter » pour commencer.",
    getRows: (id) => store.getDraft(id).dividendes,
    isDirty: (id) => store.getDraft(id).hasUnsavedDividendes,
    setRows: store.setDividendes,
    setRowsDirty: store.setDividendesRows,
    addRow: store.addDividende,
    addGroup: store.addDividendesGroup,
    addToGroup: store.addDividendesToGroup,
    updateRow: store.updateDividende,
    removeRow: store.removeDividende,
    duplicateRow: store.duplicateDividende,
    markSaved: store.markDividendesSaved,
  };
  return <TableauFluxDate dossierId={dossierId} initialData={initialData} config={config} />;
}
