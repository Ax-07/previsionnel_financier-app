"use client";

import { useCallback, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Scale } from "lucide-react";
import { type AjustementFiscalRow } from "@/lib/schemas/impots-fiscaux";
import { useImpotsFiscauxStore } from "@/stores/impots-fiscaux-store";
import { fetchDeductions, saveDeductions } from "@/app/actions/impots-fiscaux";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { TableauAjustements } from "./tableau-ajustements";

export function TableauDeductions({
  dossierId,
  initialData = [],
}: {
  dossierId: string;
  initialData?: AjustementFiscalRow[];
}) {
  const store = useImpotsFiscauxStore();
  const draft = store.getDraft(dossierId);
  const rows = draft.deductions;
  const [isPending, startTransition] = useTransition();
  const invalidateControleStores = useInvalidateControleStores();

  useEffect(() => {
    if (rows.length === 0 && initialData.length > 0) {
      store.setDeductions(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveDeductions(dossierId, rows);
      if (result.success) {
        const fresh = await fetchDeductions(dossierId);
        store.setDeductions(dossierId, fresh);
        store.markDeductionsSaved(dossierId);
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
      title="Déductions fiscales"
      icon={<Scale className="h-4 w-4 text-muted-foreground rotate-180" />}
      rows={rows}
      isDirty={draft.hasUnsavedDeductions}
      isSaving={isPending}
      onAdd={() => store.addDeduction(dossierId)}
      onUpdate={(i, data) => store.updateDeduction(dossierId, i, data)}
      onRemove={(i) => store.removeDeduction(dossierId, i)}
      onDuplicate={(i) => store.duplicateDeduction(dossierId, i)}
      onSave={handleSave}
      setRows={(updater) => store.setDeductions(dossierId, updater(rows))}
    />
  );
}
