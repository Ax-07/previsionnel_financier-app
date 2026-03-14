"use client";

import CompteResultatTab from "@/components/app/tabs/controle/compte-resultat-tab";
import SeuilRentabiliteTab from "@/components/app/tabs/controle/seuil-rentabilite-tab";
import BfrTab from "@/components/app/tabs/controle/bfr-tab";
import PlanFinancementTab from "@/components/app/tabs/controle/plan-financement-tab";
import { TresorerieTab } from "@/components/app/tabs/controle/tresorerie-tab";

interface SectionFinancialProps {
  dossierId: string;
}

export default function SectionFinancial({ dossierId }: SectionFinancialProps) {
  return (
    <div className="flex flex-col gap-12">
      <section id="rapport-cr">
        <h2 className="mb-4 text-lg font-semibold">Compte de résultat prévisionnel</h2>
        <div className="overflow-hidden rounded-md border">
          <CompteResultatTab dossierId={dossierId} />
        </div>
      </section>

      <section id="rapport-plan">
        <h2 className="mb-4 text-lg font-semibold">Plan de financement</h2>
        <div className="overflow-hidden rounded-md border">
          <PlanFinancementTab dossierId={dossierId} />
        </div>
      </section>

      <section id="rapport-treso">
        <h2 className="mb-4 text-lg font-semibold">Plan de trésorerie</h2>
        <div className="overflow-hidden rounded-md border">
          <TresorerieTab dossierId={dossierId} />
        </div>
      </section>

      <section id="rapport-seuil">
        <h2 className="mb-4 text-lg font-semibold">Seuil de rentabilité</h2>
        <div className="overflow-hidden rounded-md border">
          <SeuilRentabiliteTab dossierId={dossierId} />
        </div>
      </section>

      <section id="rapport-bfr">
        <h2 className="mb-4 text-lg font-semibold">
          Besoin en fonds de roulement (BFR)
        </h2>
        <div className="overflow-hidden rounded-md border">
          <BfrTab dossierId={dossierId} />
        </div>
      </section>
    </div>
  );
}
