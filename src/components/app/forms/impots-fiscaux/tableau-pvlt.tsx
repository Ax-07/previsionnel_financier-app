"use client";

import { useCallback, useTransition } from "react";
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";
import { numVal } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { type ParametresISData } from "@/lib/schemas/impots-fiscaux";
import { useImpotsFiscauxStore } from "@/stores/impots-fiscaux-store";
import { fetchParametresIS, saveParametresIS } from "@/app/actions/impots-fiscaux";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { SectionHeader } from "../helpers/section-header";

export function TableauPVLT({ dossierId }: { dossierId: string }) {
  const store = useImpotsFiscauxStore();
  const draft = store.getDraft(dossierId);
  const params = draft.parametresIS;
  const [isPending, startTransition] = useTransition();
  const invalidateControleStores = useInvalidateControleStores();

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveParametresIS(dossierId, params);
      if (result.success) {
        const fresh = await fetchParametresIS(dossierId);
        store.setParametresIS(dossierId, fresh);
        store.markParametresISSaved(dossierId);
        invalidateControleStores(dossierId);
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, params, store, invalidateControleStores]);

  const onChange = useCallback(
    (data: Partial<ParametresISData>) => store.updateParametresIS(dossierId, data),
    [dossierId, store],
  );

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader
        title="Impôt sur les plus-values à long terme (PVLT)"
        description=""
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        isDirty={draft.hasUnsavedParametresIS}
        isSaving={isPending}
        onSave={handleSave}
        hideAdd
      />

      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={params.pvltEnabled}
          onChange={(e) => onChange({ pvltEnabled: e.target.checked })}
          className="h-4 w-4 accent-primary"
        />
        Calcul de l&apos;impôt PVLT actif
      </label>

      {params.pvltEnabled && (
        <div className="flex items-center gap-3">
          <label className="flex flex-col gap-1 w-48">
            <span className="text-xs text-muted-foreground">Taux d&apos;impôt sur P.V. (%)</span>
            <input
              type="text"
              value={formatNumber(params.pvltTaux)}
              onChange={(e) => onChange({ pvltTaux: numVal(e.target.value) })}
              className="h-8 rounded border px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
        </div>
      )}
    </div>
  );
}
