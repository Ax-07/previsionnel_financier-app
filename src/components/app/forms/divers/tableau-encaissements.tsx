"use client";

import { useDiversStore } from "@/stores/divers-store";
import { type DiversFluxDateRow } from "@/lib/schemas/divers";
import { TableauFluxDate, type FluxSectionConfig } from "./tableau-flux-date";

export function TableauEncaissements({
  dossierId,
  initialData = [],
}: {
  dossierId: string;
  initialData?: DiversFluxDateRow[];
}) {
  const store = useDiversStore();
  const config: FluxSectionConfig = {
    type: "ENCAISSEMENT",
    title: "Encaissements exceptionnels",
    description: "Rentrées de trésorerie exceptionnelles hors exploitation courante.",
    emptyMessage: "Aucun encaissement — cliquez sur « Ajouter » pour commencer.",
    getRows: (id) => store.getDraft(id).encaissements,
    isDirty: (id) => store.getDraft(id).hasUnsavedEncaissements,
    setRows: store.setEncaissements,
    setRowsDirty: store.setEncaissementsRows,
    addRow: store.addEncaissement,
    addGroup: store.addEncaissementsGroup,
    addToGroup: store.addEncaissementsToGroup,
    updateRow: store.updateEncaissement,
    removeRow: store.removeEncaissement,
    duplicateRow: store.duplicateEncaissement,
    markSaved: store.markEncaissementsSaved,
  };
  return <TableauFluxDate dossierId={dossierId} initialData={initialData} config={config} />;
}
