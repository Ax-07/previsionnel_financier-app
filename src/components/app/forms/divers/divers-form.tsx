"use client";

import type {
  DiversFluxDateRow,
  DiversOperationCapitalRow,
  DiversPretRow,
} from "@/lib/schemas/divers";
import { TableauRemboursementsCC } from "./tableau-remboursements-cc";
import { TableauDividendes } from "./tableau-dividendes";
import { TableauAugmentationCapital } from "./tableau-augmentation-capital";
import { TableauReductionCapital } from "./tableau-reduction-capital";
import { TableauDeblocagesParticipation } from "./tableau-deblocages-participation";
import { TableauPrets } from "./tableau-prets";
import { TableauEncaissements } from "./tableau-encaissements";
import { TableauDecaissements } from "./tableau-decaissements";

export interface DiversFormProps {
  dossierId: string;
  remboursementsCCInitial?: DiversFluxDateRow[];
  dividendesInitial?: DiversFluxDateRow[];
  augmentationsCapitalInitial?: DiversOperationCapitalRow[];
  reductionsCapitalInitial?: DiversOperationCapitalRow[];
  deblocagesParticipationInitial?: DiversFluxDateRow[];
  pretsInitial?: DiversPretRow[];
  encaissementsInitial?: DiversFluxDateRow[];
  decaissementsInitial?: DiversFluxDateRow[];
}

export function DiversForm({
  dossierId,
  remboursementsCCInitial = [],
  dividendesInitial = [],
  augmentationsCapitalInitial = [],
  reductionsCapitalInitial = [],
  deblocagesParticipationInitial = [],
  pretsInitial = [],
  encaissementsInitial = [],
  decaissementsInitial = [],
}: DiversFormProps) {
  return (
    <div className="space-y-10 py-8 px-4 2xl:px-32">
      <div>
        <h2 className="text-2xl font-bold leading-tight">Divers</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Opérations financières et patrimoniales hors activité courante : comptes courants, dividendes,
          capital, prêts inter-entreprises, flux de trésorerie exceptionnels.
        </p>
      </div>

      <TableauRemboursementsCC dossierId={dossierId} initialData={remboursementsCCInitial} />
      <TableauDividendes dossierId={dossierId} initialData={dividendesInitial} />
      <TableauAugmentationCapital dossierId={dossierId} initialData={augmentationsCapitalInitial} />
      <TableauReductionCapital dossierId={dossierId} initialData={reductionsCapitalInitial} />
      <TableauDeblocagesParticipation dossierId={dossierId} initialData={deblocagesParticipationInitial} />
      <TableauPrets dossierId={dossierId} initialData={pretsInitial} />
      <TableauEncaissements dossierId={dossierId} initialData={encaissementsInitial} />
      <TableauDecaissements dossierId={dossierId} initialData={decaissementsInitial} />
    </div>
  );
}
