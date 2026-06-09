"use client";

import { useCallback, useTransition } from "react";
import { toast } from "sonner";
import { FlaskConical } from "lucide-react";
import { cn, numVal } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import {
  MODALITES_CIR,
  type ParametresISData,
} from "@/lib/schemas/impots-fiscaux";
import { useImpotsFiscauxStore } from "@/stores/impots-fiscaux-store";
import { fetchParametresIS, saveParametresIS } from "@/app/actions/impots-fiscaux";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { cellInput, cellSelect } from "../helpers/cell-styles";
import { SectionHeader } from "../helpers/section-header";
import { Th, Td } from "../helpers/table-helpers";

const EXERCICES: Array<{ label: string; suffix: "N" | "N1" | "N2" }> = [
  { label: "N",   suffix: "N"  },
  { label: "N+1", suffix: "N1" },
  { label: "N+2", suffix: "N2" },
];

function cirField<T extends keyof ParametresISData>(
  suffix: "N" | "N1" | "N2",
  base: string,
): T {
  return `${base}${suffix}` as T;
}

export function TableauCIR({ dossierId }: { dossierId: string }) {
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
        title="CIR — Crédit d’Impôt Recherche"
        icon={<FlaskConical className="h-4 w-4 text-muted-foreground" />}
        isDirty={draft.hasUnsavedParametresIS}
        isSaving={isPending}
        onSave={handleSave}
        hideAdd
      />

      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={params.cirEnabled}
          onChange={(e) => onChange({ cirEnabled: e.target.checked })}
          className="h-4 w-4 accent-primary"
        />
        Activer l&apos;impact CIR
      </label>

      {params.cirEnabled && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <Th className="min-w-45">Paramètre</Th>
                {EXERCICES.map((ex) => (
                  <Th key={ex.suffix} className="w-40 text-right">{ex.label}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <Td><span className="px-2 text-xs text-muted-foreground">Montant du crédit (€)</span></Td>
                {EXERCICES.map((ex) => (
                  <Td key={ex.suffix}>
                    <input
                      type="text"
                      value={formatNumber(params[cirField(ex.suffix, "cirMontant")] as number)}
                      onChange={(e) => onChange({ [cirField(ex.suffix, "cirMontant")]: numVal(e.target.value) })}
                      className={cn(cellInput, "text-right")}
                    />
                  </Td>
                ))}
              </tr>
              <tr className="border-b">
                <Td><span className="px-2 text-xs text-muted-foreground">Modalité</span></Td>
                {EXERCICES.map((ex) => (
                  <Td key={ex.suffix}>
                    <select
                      value={params[cirField(ex.suffix, "cirModalite")] as string}
                      onChange={(e) =>
                        onChange({ [cirField(ex.suffix, "cirModalite")]: e.target.value as "REPORT" | "REMBOURSEMENT" | "MIXTE" })
                      }
                      className={cellSelect}
                    >
                      {MODALITES_CIR.map((m) => (
                        <option key={m.value} value={m.value} className="bg-background text-foreground">
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </Td>
                ))}
              </tr>
              <tr>
                <Td><span className="px-2 text-xs text-muted-foreground">Délai remboursement (mois)</span></Td>
                {EXERCICES.map((ex) => (
                  <Td key={ex.suffix}>
                    <input
                      type="text"
                      value={params[cirField(ex.suffix, "cirDelai")] as number}
                      onChange={(e) => onChange({ [cirField(ex.suffix, "cirDelai")]: parseInt(e.target.value) || 0 })}
                      className={cn(cellInput, "text-right")}
                    />
                  </Td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
