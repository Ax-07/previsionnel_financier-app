"use client";

import type { AutreChargeProvisionRow, AutreChargeDateeRow, AutreChargeBilanRow } from "@/lib/schemas/autres-charges";
import { ProvisionsSection } from "./tableau-provision";
import { TableauChargesGestionCourante } from "./tableau-charges-gestion-courante";
import { TableauChargesFinancieres } from "./tableau-charges-financieres";
import { TableauChargesExceptionnelles } from "./tableau-charges-exceptionnelles";
import { TableauChargesConstateesAvance } from "./tableau-charges-constatees-avance";
import { TableauChargesAPayer } from "./tableau-charges-a-payer";

interface AutresChargesFormProps {
  dossierId: string;
  provisionsInitial?: AutreChargeProvisionRow[];
  gestionCouranteInitial?: AutreChargeDateeRow[];
  financieresInitial?: AutreChargeDateeRow[];
  exceptionnellesInitial?: AutreChargeDateeRow[];
  ccaInitial?: AutreChargeBilanRow[];
  capInitial?: AutreChargeBilanRow[];
}

export function AutresChargesForm({
  dossierId,
  provisionsInitial = [],
  gestionCouranteInitial = [],
  financieresInitial = [],
  exceptionnellesInitial = [],
  ccaInitial = [],
  capInitial = [],
}: AutresChargesFormProps) {
  return (
    <div className="space-y-10 py-8 px-4 2xl:px-32">
      <ProvisionsSection dossierId={dossierId} initialData={provisionsInitial} />
      <TableauChargesGestionCourante dossierId={dossierId} initialData={gestionCouranteInitial} />
      <TableauChargesFinancieres dossierId={dossierId} initialData={financieresInitial} />
      <TableauChargesExceptionnelles dossierId={dossierId} initialData={exceptionnellesInitial} />
      <TableauChargesConstateesAvance dossierId={dossierId} initialData={ccaInitial} />
      <TableauChargesAPayer dossierId={dossierId} initialData={capInitial} />
    </div>
  );
}
