"use client";

import { useDiversStore } from "@/stores/divers-store";
import { type DiversFluxDateRow } from "@/lib/schemas/divers";
import { TableauFluxDate, type FluxSectionConfig } from "./tableau-flux-date";

export function TableauDecaissements({
  dossierId,
  initialData = [],
}: {
  dossierId: string;
  initialData?: DiversFluxDateRow[];
}) {
  const store = useDiversStore();
  const config: FluxSectionConfig = {
    type: "DECAISSEMENT",
    title: "Décaissements exceptionnels",
    description: "Sorties de trésorerie exceptionnelles hors exploitation courante.",
    emptyMessage: "Aucun décaissement — cliquez sur « Ajouter » pour commencer.",
    getRows: (id) => store.getDraft(id).decaissements,
    isDirty: (id) => store.getDraft(id).hasUnsavedDecaissements,
    setRows: store.setDecaissements,
    setRowsDirty: store.setDecaissementsRows,
    addRow: store.addDecaissement,
    addGroup: store.addDecaissementsGroup,
    addToGroup: store.addDecaissementsToGroup,
    updateRow: store.updateDecaissement,
    removeRow: store.removeDecaissement,
    duplicateRow: store.duplicateDecaissement,
    markSaved: store.markDecaissementsSaved,
  };
  return <TableauFluxDate dossierId={dossierId} initialData={initialData} config={config} />;
}
