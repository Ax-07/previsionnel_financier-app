"use client";

import type { ApportRow, EmpruntWithEcheancier } from "@/lib/schemas/financement";
import { TableauApports } from "./tableau-apports";
import { TableauEmprunts } from "./tableau-emprunts";

export interface FinancementFormProps {
  dossierId: string;
  apports?:  ApportRow[];
  emprunts?: EmpruntWithEcheancier[];
  dateDebutExerciceN?: string;
}

export function FinancementForm({
  dossierId,
  apports  = [],
  emprunts = [],
  dateDebutExerciceN,
}: FinancementFormProps) {
  return (
    <div className="h-full space-y-10 overflow-y-auto py-8 px-4 2xl:px-32">
      <TableauApports  dossierId={dossierId} initialData={apports}  dateDebutExerciceN={dateDebutExerciceN} />
      <TableauEmprunts dossierId={dossierId} initialData={emprunts} dateDebutExerciceN={dateDebutExerciceN} />
    </div>
  );
}
