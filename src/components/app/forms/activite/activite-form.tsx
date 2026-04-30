"use client";

import {
  type ActiviteRow,
  type ActiviteCommissionRow,
  type ProductionImmobiliseeRow,
  type SubventionExploitationRow,
} from "@/lib/schemas/activite";

import { TableauActivites } from "./tableau-activites";
import { TableauActivitesCommissions } from "./tableau-activites-commissions";
import { TableauProductionsImmobilisees } from "./tableau-productions-immobilisees";
import { TableauSubventions } from "./tableau-subventions";

export interface ActiviteFormProps {
  dossierId: string;
  activites?: ActiviteRow[];
  activitesCommissionnees?: ActiviteCommissionRow[];
  productionsImmobilisees?: ProductionImmobiliseeRow[];
  subventionsExploitation?: SubventionExploitationRow[];
  dateDebutExerciceN?: string;
  exercices?: Array<{ dateCloture: string; duree: number; annee: number }>;
}

/**
 * Container de l'onglet Activités.
 * Délègue la logique de saisie, DnD et sauvegarde à chaque sous-composant.
 */
export function ActiviteForm({
  dossierId,
  activites = [],
  activitesCommissionnees = [],
  productionsImmobilisees = [],
  subventionsExploitation = [],
  dateDebutExerciceN,
  exercices,
}: ActiviteFormProps) {
  return (
    <div className="h-full space-y-10 overflow-y-auto py-8 px-32">
      <TableauActivites
        dossierId={dossierId}
        initialData={activites}
        dateDebutExerciceN={dateDebutExerciceN}
        exercices={exercices}
      />
      <TableauActivitesCommissions
        dossierId={dossierId}
        initialData={activitesCommissionnees}
      />
      <TableauProductionsImmobilisees
        dossierId={dossierId}
        initialData={productionsImmobilisees}
        dateDebutExerciceN={dateDebutExerciceN}
      />
      <TableauSubventions
        dossierId={dossierId}
        initialData={subventionsExploitation}
      />
    </div>
  );
}

