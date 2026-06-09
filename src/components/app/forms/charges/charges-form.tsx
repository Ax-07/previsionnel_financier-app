"use client";

import type { ChargeExploitationRow, ImpotTaxeRow } from "@/lib/schemas/charges";
import { TableauFournitures } from "./tableau-fournitures";
import { TableauServicesExterieurs } from "./tableau-services-exterieurs";
import { TableauImpotsTaxes } from "./tableau-impots-taxes";

export interface ChargesFormProps {
  dossierId: string;
  fournitures?: ChargeExploitationRow[];
  services?: ChargeExploitationRow[];
  impots?: ImpotTaxeRow[];
  dateDebutExerciceN?: string;
  exercices?: Array<{ dateCloture: string; duree: number; annee: number }>;
}

export function ChargesForm({
  dossierId,
  fournitures = [],
  services = [],
  impots = [],
  dateDebutExerciceN,
  exercices,
}: ChargesFormProps) {
  return (
    <div className="h-full space-y-10 overflow-y-auto py-8 px-4 2xl:px-32">
      <TableauFournitures
        dossierId={dossierId}
        initialData={fournitures}
        dateDebutExerciceN={dateDebutExerciceN}
        exercices={exercices}
      />

      <TableauServicesExterieurs
        dossierId={dossierId}
        initialData={services}
        dateDebutExerciceN={dateDebutExerciceN}
        exercices={exercices}
      />

      <TableauImpotsTaxes dossierId={dossierId} initialData={impots} />
    </div>
  );
}
