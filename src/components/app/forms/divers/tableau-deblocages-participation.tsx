"use client";

import { useDiversStore } from "@/stores/divers-store";
import { type DiversFluxDateRow } from "@/lib/schemas/divers";
import { TableauFluxDate, type FluxSectionConfig } from "./tableau-flux-date";

export function TableauDeblocagesParticipation({
  dossierId,
  initialData = [],
}: {
  dossierId: string;
  initialData?: DiversFluxDateRow[];
}) {
  const store = useDiversStore();
  const config: FluxSectionConfig = {
    type: "DEBLOCAGE_PARTICIPATION",
    title: "Déblocages de la participation des salariés",
    description: "Versements aux salariés de leur participation aux bénéfices.",
    emptyMessage: "Aucun déblocage — cliquez sur « Ajouter » pour commencer.",
    getRows: (id) => store.getDraft(id).deblocagesParticipation,
    isDirty: (id) => store.getDraft(id).hasUnsavedDeblocagesParticipation,
    setRows: store.setDeblocagesParticipation,
    setRowsDirty: store.setDeblocagesParticipationRows,
    addRow: store.addDeblocageParticipation,
    addGroup: store.addDeblocagesParticipationGroup,
    addToGroup: store.addDeblocagesParticipationToGroup,
    updateRow: store.updateDeblocageParticipation,
    removeRow: store.removeDeblocageParticipation,
    duplicateRow: store.duplicateDeblocageParticipation,
    markSaved: store.markDeblocagesParticipationSaved,
  };
  return <TableauFluxDate dossierId={dossierId} initialData={initialData} config={config} />;
}
