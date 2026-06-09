"use client";

import { useCallback, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { BadgeDollarSign } from "lucide-react";
import { cn, numVal } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import {
  MODALITES_ACOMPTES,
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

function isField<T extends keyof ParametresISData>(
  suffix: "N" | "N1" | "N2",
  base: string,
): T {
  return `${base}${suffix}` as T;
}

export function TableauIS({
  dossierId,
  initialData,
}: {
  dossierId: string;
  initialData?: ParametresISData;
}) {
  const store = useImpotsFiscauxStore();
  const draft = store.getDraft(dossierId);
  const params = draft.parametresIS;
  const [isPending, startTransition] = useTransition();
  const invalidateControleStores = useInvalidateControleStores();

  useEffect(() => {
    if (!draft.hasUnsavedParametresIS && initialData) {
      store.setParametresIS(dossierId, initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

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
        title="Impôt société (IS)"
        icon={<BadgeDollarSign className="h-4 w-4 text-muted-foreground" />}
        isDirty={draft.hasUnsavedParametresIS}
        isSaving={isPending}
        onSave={handleSave}
        hideAdd
      />

      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={params.isEnabled}
          onChange={(e) => onChange({ isEnabled: e.target.checked })}
          className="h-4 w-4 accent-primary"
        />
        Calcul de l&apos;impôt actif
      </label>

      {params.isEnabled && (
        <>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <Th className="min-w-55">Paramètre</Th>
                  {EXERCICES.map((ex) => (
                    <Th key={ex.suffix} className="w-40 text-right">{ex.label}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <Td><span className="px-2 text-xs text-muted-foreground">Taux réduit (%)</span></Td>
                  {EXERCICES.map((ex) => (
                    <Td key={ex.suffix}>
                      <input
                        type="text"
                        value={formatNumber(params[isField(ex.suffix, "tauxReduit")] as number)}
                        onChange={(e) => onChange({ [isField(ex.suffix, "tauxReduit")]: numVal(e.target.value) })}
                        className={cn(cellInput, "text-right")}
                      />
                    </Td>
                  ))}
                </tr>

                <tr className="border-b">
                  <Td><span className="px-2 text-xs text-muted-foreground">Plafond taux réduit</span></Td>
                  {EXERCICES.map((ex) => (
                    <Td key={ex.suffix}>
                      <input
                        type="text"
                        value={formatNumber(params[isField(ex.suffix, "plafondReduit")] as number)}
                        onChange={(e) => onChange({ [isField(ex.suffix, "plafondReduit")]: numVal(e.target.value) })}
                        className={cn(cellInput, "text-right")}
                      />
                    </Td>
                  ))}
                </tr>

                <tr className="border-b">
                  <Td><span className="px-2 text-xs text-muted-foreground">Taux normal (%)</span></Td>
                  {EXERCICES.map((ex) => (
                    <Td key={ex.suffix}>
                      <input
                        type="text"
                        value={formatNumber(params[isField(ex.suffix, "tauxNormal")] as number)}
                        onChange={(e) => onChange({ [isField(ex.suffix, "tauxNormal")]: numVal(e.target.value) })}
                        className={cn(cellInput, "text-right")}
                      />
                    </Td>
                  ))}
                </tr>

                <tr className="border-b">
                  <Td><span className="px-2 text-xs text-muted-foreground">Contribution volontaire</span></Td>
                  {EXERCICES.map((ex) => (
                    <Td key={ex.suffix}>
                      <input
                        type="text"
                        value={formatNumber(params[isField(ex.suffix, "contributionVol")] as number)}
                        onChange={(e) => onChange({ [isField(ex.suffix, "contributionVol")]: numVal(e.target.value) })}
                        className={cn(cellInput, "text-right")}
                      />
                    </Td>
                  ))}
                </tr>

                <tr className="border-b">
                  <Td><span className="px-2 text-xs text-muted-foreground">Crédit d&apos;impôt</span></Td>
                  {EXERCICES.map((ex) => (
                    <Td key={ex.suffix}>
                      <input
                        type="text"
                        value={formatNumber(params[isField(ex.suffix, "creditImpot")] as number)}
                        onChange={(e) => onChange({ [isField(ex.suffix, "creditImpot")]: numVal(e.target.value) })}
                        className={cn(cellInput, "text-right")}
                      />
                    </Td>
                  ))}
                </tr>

                <tr className="border-b">
                  <Td><span className="px-2 text-xs text-muted-foreground">Modalité acomptes</span></Td>
                  {EXERCICES.map((ex) => (
                    <Td key={ex.suffix}>
                      <select
                        value={params[isField(ex.suffix, "modaliteAcomptes")] as string}
                        onChange={(e) =>
                          onChange({ [isField(ex.suffix, "modaliteAcomptes")]: e.target.value as "CALCUL" | "MANUEL" | "AUCUN" })
                        }
                        className={cellSelect}
                      >
                        {MODALITES_ACOMPTES.map((m) => (
                          <option key={m.value} value={m.value} className="bg-background text-foreground">
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </Td>
                  ))}
                </tr>

                {(params.modaliteAcomptesN === "MANUEL" || params.modaliteAcomptesN1 === "MANUEL" || params.modaliteAcomptesN2 === "MANUEL") && (
                  <tr className="border-b bg-muted/10">
                    <Td><span className="px-2 text-xs text-muted-foreground italic">Montant acomptes (manuel)</span></Td>
                    {EXERCICES.map((ex) => {
                      const modaliteKey = isField<keyof ParametresISData>(ex.suffix, "modaliteAcomptes");
                      const manuelKey = isField<keyof ParametresISData>(ex.suffix, "montantAcomptesManuel");
                      const isManuel = params[modaliteKey] === "MANUEL";
                      return (
                        <Td key={ex.suffix}>
                          {isManuel ? (
                            <input
                              type="text"
                              value={formatNumber((params[manuelKey] as number | undefined) ?? 0)}
                              onChange={(e) => onChange({ [manuelKey]: numVal(e.target.value) })}
                              className={cn(cellInput, "text-right")}
                            />
                          ) : (
                            <span className="block px-2 text-xs text-muted-foreground text-right">—</span>
                          )}
                        </Td>
                      );
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-md border p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Règlement</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Plancher de dispense (€)</span>
                <input
                  type="text"
                  value={formatNumber(params.plancherDispense)}
                  onChange={(e) => onChange({ plancherDispense: numVal(e.target.value) })}
                  className="h-8 rounded border px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Délai du solde après clôture (jours)</span>
                <input
                  type="text"
                  value={params.delaiSoldeJours}
                  onChange={(e) => onChange({ delaiSoldeJours: parseInt(e.target.value) || 0 })}
                  className="h-8 rounded border px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Délai remboursement crédit (mois)</span>
                <input
                  type="text"
                  value={params.delaiRemboursementMois}
                  onChange={(e) => onChange({ delaiRemboursementMois: parseInt(e.target.value) || 0 })}
                  className="h-8 rounded border px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
