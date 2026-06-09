"use client";

import { useCallback, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Scale } from "lucide-react";
import { type AjustementFiscalRow } from "@/lib/schemas/impots-fiscaux";
import { useImpotsFiscauxStore } from "@/stores/impots-fiscaux-store";
import { fetchReintegrations, saveReintegrations } from "@/app/actions/impots-fiscaux";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { TableauAjustements } from "./tableau-ajustements";

export function TableauReintegrations({
  dossierId,
  initialData = [],
}: {
  dossierId: string;
  initialData?: AjustementFiscalRow[];
}) {
  const store = useImpotsFiscauxStore();
  const draft = store.getDraft(dossierId);
  const rows = draft.reintegrations;
  const [isPending, startTransition] = useTransition();
  const invalidateControleStores = useInvalidateControleStores();

  useEffect(() => {
    if (rows.length === 0 && initialData.length > 0) {
      store.setReintegrations(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveReintegrations(dossierId, rows);
      if (result.success) {
        const fresh = await fetchReintegrations(dossierId);
        store.setReintegrations(dossierId, fresh);
        store.markReintegrationsSaved(dossierId);
        invalidateControleStores(dossierId);
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, rows, store, invalidateControleStores]);

  return (
    <TableauAjustements
      dossierId={dossierId}
      title="Réintégrations fiscales"
      icon={<Scale className="h-4 w-4 text-muted-foreground" />}
      rows={rows}
      isDirty={draft.hasUnsavedReintegrations}
      isSaving={isPending}
      onAdd={() => store.addReintegration(dossierId)}
      onUpdate={(i, data) => store.updateReintegration(dossierId, i, data)}
      onRemove={(i) => store.removeReintegration(dossierId, i)}
      onDuplicate={(i) => store.duplicateReintegration(dossierId, i)}
      onSave={handleSave}
      setRows={(updater) => store.setReintegrations(dossierId, updater(rows))}
    />
  );
}
