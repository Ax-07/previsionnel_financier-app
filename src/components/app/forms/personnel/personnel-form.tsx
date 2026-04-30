"use client";

/**
 * Orchestrateur de l'onglet Personnel.
 * Ce fichier ne contient que le composant racine `PersonnelForm`.
 * Chaque section est implémentée dans son propre fichier dans ce dossier.
 */

import { type LigneSalarieRow, type LigneDirigeantRow, type LigneCotisationTNSRow, type LigneTaxeSalaireRow, type LigneChargePersonnelRow } from "@/lib/schemas/personnel";
import { ParamsGlobauxSection } from "./params-globaux-section";
import { TableauSalaries } from "./tableau-salaries";
import { TableauDirigeant } from "./tableau-dirigeant";
import { TableauCotisationsTNS } from "./tableau-cotisations-tns";
import { TableauTaxesSalaires } from "./tableau-taxes-salaires";
import { TableauChargePersonnel } from "./tableau-charge-personnel";

interface PersonnelFormProps {
  dossierId: string;
  salaries?: LigneSalarieRow[];
  dirigeants?: LigneDirigeantRow[];
  cotisationsTNS?: LigneCotisationTNSRow[];
  taxesSalaires?: LigneTaxeSalaireRow[];
  autresCharges?: LigneChargePersonnelRow[];
  remboursements?: LigneChargePersonnelRow[];
  participations?: LigneChargePersonnelRow[];
  dateDebutExerciceN?: string;
  exercices?: Array<{ dateCloture: string; duree: number; annee: number }>;
}

export function PersonnelForm({
  dossierId,
  salaries,
  dirigeants,
  cotisationsTNS,
  taxesSalaires,
  autresCharges,
  remboursements,
  participations,
  dateDebutExerciceN,
  exercices,
}: PersonnelFormProps) {
  return (
    <div className="h-full space-y-10 overflow-y-auto py-8 px-32">
      <ParamsGlobauxSection dossierId={dossierId} />
      <TableauSalaries dossierId={dossierId} initialData={salaries} dateDebutExerciceN={dateDebutExerciceN} exercices={exercices} />
      <TableauDirigeant dossierId={dossierId} initialData={dirigeants} dateDebutExerciceN={dateDebutExerciceN} exercices={exercices} />
      <TableauCotisationsTNS dossierId={dossierId} initialData={cotisationsTNS} />
      <TableauTaxesSalaires dossierId={dossierId} initialData={taxesSalaires} />
      <TableauChargePersonnel dossierId={dossierId} type="AUTRE" initialData={autresCharges} />
      <TableauChargePersonnel dossierId={dossierId} type="REMBOURSEMENT" initialData={remboursements} />
      <TableauChargePersonnel dossierId={dossierId} type="PARTICIPATION" initialData={participations} />
    </div>
  );
}