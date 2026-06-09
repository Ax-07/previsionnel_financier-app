"use client";

import { Separator } from "@/components/ui/separator";
import type { AjustementFiscalRow, ParametresISData } from "@/lib/schemas/impots-fiscaux";
import { TableauReintegrations } from "./tableau-reintegrations";
import { TableauDeductions } from "./tableau-deductions";
import { TableauIS } from "./tableau-is";
import { TableauCIR } from "./tableau-cir";
import { TableauPVLT } from "./tableau-pvlt";

interface ImpotsFiscauxFormProps {
  dossierId: string;
  reintegrationsInitial?: AjustementFiscalRow[];
  deductionsInitial?: AjustementFiscalRow[];
  parametresISInitial?: ParametresISData;
}

export function ImpotsFiscauxForm({
  dossierId,
  reintegrationsInitial = [],
  deductionsInitial = [],
  parametresISInitial,
}: ImpotsFiscauxFormProps) {
  return (
    <div className="h-full space-y-10 overflow-y-auto py-8 px-4 2xl:px-32">
      <TableauReintegrations dossierId={dossierId} initialData={reintegrationsInitial} />
      <Separator />
      <TableauDeductions dossierId={dossierId} initialData={deductionsInitial} />
      <Separator />
      <TableauIS dossierId={dossierId} initialData={parametresISInitial} />
      <Separator />
      <TableauCIR dossierId={dossierId} />
      <Separator />
      <TableauPVLT dossierId={dossierId} />
    </div>
  );
}
