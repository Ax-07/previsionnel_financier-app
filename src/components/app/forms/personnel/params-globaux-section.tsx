"use client";

import { useEffect } from "react";
import { Settings2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { MOIS_PAIEMENT_OPTIONS } from "@/lib/schemas/personnel";
import { usePersonnelStore } from "@/stores/personnel-store";
import { useScenarioDataStore } from "@/stores/scenario-data-store";
import { fetchMoisPaiementSalaires, saveMoisPaiementSalaires } from "@/app/actions/personnel";

/**
 * Décalage du versement des salaires par rapport au mois travaillé.
 * Seul paramètre global des salariés persistant en base.
 */
export function ParamsGlobauxSection({ dossierId }: { dossierId: string }) {
  const store = usePersonnelStore();
  const moisPaiement = store.getDraft(dossierId).paramsGlobaux.moisPaiement;

  // Initialisation depuis la DB au montage
  useEffect(() => {
    fetchMoisPaiementSalaires(dossierId)
      .then((v) => store.updateParamsGlobaux(dossierId, { moisPaiement: v }))
      .catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  function handleChange(value: number) {
    store.updateParamsGlobaux(dossierId, { moisPaiement: value });
    saveMoisPaiementSalaires(dossierId, value)
      .then((res) => { if (res.success) useScenarioDataStore.getState().reload(dossierId); })
      .catch(() => null);
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        <div>
          <h3 className="text-base font-semibold leading-snug">Option de paiement</h3>
          <p className="text-xs text-muted-foreground">Décalage du versement des salaires par rapport au mois travaillé</p>
        </div>
      </div>

      <select
        id="moisPaiement"
        aria-label="Paiement des salaires"
        className="h-8 w-48 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        value={moisPaiement}
        onChange={(e) => handleChange(Number(e.target.value))}
      >
        {MOIS_PAIEMENT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <Separator />
    </section>
  );
}
