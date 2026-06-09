"use client";

/**
 * Formulaire investissements — 3 tableaux éditables inline
 * - Tableau des immobilisations
 * - Tableau des cessions d'immobilisations
 * - Tableau de crédit-bail / location financière
 */

import {
  type CessionRow,
  type CreditBailRow,
  type ImmobilisationWithPlan,
} from "@/lib/schemas/investissement";
import { TableauImmobilisations } from "./tableau-immobilisations";
import { TableauCessions } from "./tableau-cessions";
import { TableauCreditBail } from "./tableau-creditbail";



// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export interface InvestissementFormProps {
  dossierId: string;
  immobilisations?: ImmobilisationWithPlan[];
  cessions?: CessionRow[];
  creditsBaux?: CreditBailRow[];
  dateDebutExerciceN?: string;
}

export function InvestissementForm({
  dossierId,
  immobilisations = [],
  cessions = [],
  creditsBaux = [],
  dateDebutExerciceN,
}: InvestissementFormProps) {
  return (
    <div className="h-full space-y-10 overflow-y-auto py-8 px-4 2xl:px-32">
      <TableauImmobilisations dossierId={dossierId} initialData={immobilisations} dateDebutExerciceN={dateDebutExerciceN} />
      <TableauCessions dossierId={dossierId} initialData={cessions} dateDebutExerciceN={dateDebutExerciceN} />
      <TableauCreditBail dossierId={dossierId} initialData={creditsBaux} dateDebutExerciceN={dateDebutExerciceN} />
    </div>
  );
}
