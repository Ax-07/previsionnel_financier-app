"use client";

import type {
  AutreProduitRepriseRow,
  AutreProduitDateRow,
  AutreProduitConstateRow,
} from "@/lib/schemas/autres-produits";

import { TableauReprisesProvisions } from "./tableaux-reprises-sur-provisions";
import { TableauTransfertsCharges } from "./tableaux-transferts-de-charges";
import { TableauGestionCouranteProduits } from "./tableau-autres-produits-de-gestions-courante";
import { TableauProduitsFinanciers } from "./tableau-produits-financiers";
import { TableauProduitsExceptionnels } from "./tableau-produits-exceptionnels";
import { TableauProduitsConstatesAvance } from "./tableau-produits-constates-avance";

interface AutresProduitsFormProps {
  dossierId: string;
  reprisesInitial?: AutreProduitRepriseRow[];
  transfertsInitial?: AutreProduitDateRow[];
  gestionCouranteInitial?: AutreProduitDateRow[];
  financiersInitial?: AutreProduitDateRow[];
  exceptionnelsInitial?: AutreProduitDateRow[];
  pcaInitial?: AutreProduitConstateRow[];
}

export function AutresProduitsForm({
  dossierId,
  reprisesInitial = [],
  transfertsInitial = [],
  gestionCouranteInitial = [],
  financiersInitial = [],
  exceptionnelsInitial = [],
  pcaInitial = [],
}: AutresProduitsFormProps) {
  return (
    <div className="space-y-10 py-8 px-4 2xl:px-32">
      <TableauTransfertsCharges dossierId={dossierId} initialData={transfertsInitial} />
      <TableauReprisesProvisions dossierId={dossierId} initialData={reprisesInitial} />
      <TableauGestionCouranteProduits dossierId={dossierId} initialData={gestionCouranteInitial} />
      <TableauProduitsFinanciers dossierId={dossierId} initialData={financiersInitial} />
      <TableauProduitsExceptionnels dossierId={dossierId} initialData={exceptionnelsInitial} />
      <TableauProduitsConstatesAvance dossierId={dossierId} initialData={pcaInitial} />
    </div>
  );
}
