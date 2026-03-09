"use client";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { BarChart2Icon } from "lucide-react";
import SyntheseTab from "@/components/app/tabs/controle/synthese-tab";
import CompteResultatTab from "@/components/app/tabs/controle/compte-resultat-tab";
import SigTab from "@/components/app/tabs/controle/sig-tab";
import BudgetTab from "@/components/app/tabs/controle/budget-tab";
import CafTab from "@/components/app/tabs/controle/caf-tab";
import SeuilRentabiliteTab from "@/components/app/tabs/controle/seuil-rentabilite-tab";
import BfrTab from "@/components/app/tabs/controle/bfr-tab";
import TableauFinancementTab from "@/components/app/tabs/controle/tableau-financement-tab";
import PlanFinancementTab from "@/components/app/tabs/controle/plan-financement-tab";
import BilanTab from "@/components/app/tabs/controle/bilan-tab";
import TVATab from "@/components/app/tabs/controle/tva-tab";
import RatiosTab from "@/components/app/tabs/controle/ratios-tab";
import { TresorerieTab } from "./controle/tresorerie-tab";
import { usePrefetchControleStores } from "@/hooks/use-prefetch-controle-stores";

const controleSubTabs = [
  { value: "synthese", label: "Synthèse" },
  { value: "compte-resultat", label: "Compte de résultat" },
  { value: "sig", label: "SIG" },
  { value: "budget", label: "Budget" },
  { value: "caf", label: "CAF" },
  { value: "seuil-rentabilite", label: "Seuil de rentabilité" },
  { value: "bfr", label: "BFR" },
  { value: "tableau-financement", label: "Tableau de financement" },
  { value: "plan-financement", label: "Plan de financement" },
  { value: "bilan", label: "Bilan" },
  { value: "ratios", label: "Ratios" },
  { value: "tresorerie", label: "Trésorerie" },
  { value: "tva", label: "TVA" },
  { value: "ratios-sectoriels", label: "Ratios sectoriels" },
  { value: "previsionnel-etendu", label: "Prévisionnel étendu" },
] as const;

function PlaceholderContent({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <BarChart2Icon className="size-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold">{label}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ce tableau de contrôle est en cours de développement.
        </p>
      </div>
    </div>
  );
}

interface ControleTabProps {
  dossierId: string;
}

export default function ControleTab({ dossierId }: ControleTabProps) {
  // Pré-charge tous les stores de contrôle dès l'entrée dans l'onglet Contrôle
  usePrefetchControleStores(dossierId);

  return (
    <Tabs
      defaultValue="synthese"
      className="flex h-full flex-col gap-0"
    >
      {/* Barre des sous-onglets */}
      <div className="shrink-0 overflow-x-auto overflow-y-hidden border-b bg-muted/30">
        <TabsList
          variant="line"
          className="h-10 w-max min-w-full gap-0 rounded-none bg-transparent px-4"
        >
          {controleSubTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="shrink-0 px-3 text-xs font-medium"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Contenu des sous-onglets */}
      <div className="min-h-0 flex-1">
        {controleSubTabs.map((tab) => {
          const isFullHeight =
            tab.value === "compte-resultat" ||
            tab.value === "sig" ||
            tab.value === "budget" ||
            tab.value === "caf" ||
            tab.value === "seuil-rentabilite" ||
            tab.value === "bfr" ||
            tab.value === "tableau-financement" ||
            tab.value === "plan-financement" ||
            tab.value === "bilan" ||
            tab.value === "tva" ||
            tab.value === "ratios" ||
            tab.value === "tresorerie" ||
            tab.value === "synthese";
          return (
            <TabsContent
              key={tab.value}
              value={tab.value}
              className={isFullHeight ? "h-full data-[state=inactive]:hidden" : "h-full p-6 data-[state=inactive]:hidden"}
            >
              {tab.value === "synthese" ? (
                <SyntheseTab dossierId={dossierId} />
              ) : tab.value === "compte-resultat" ? (
                <CompteResultatTab dossierId={dossierId} />
              ) : tab.value === "sig" ? (
                <SigTab dossierId={dossierId} />
              ) : tab.value === "budget" ? (
                <BudgetTab dossierId={dossierId} />
              ) : tab.value === "caf" ? (
                <CafTab dossierId={dossierId} />
              ) : tab.value === "seuil-rentabilite" ? (
                <SeuilRentabiliteTab dossierId={dossierId} />
              ) : tab.value === "bfr" ? (
                <BfrTab dossierId={dossierId} />
              ) : tab.value === "tableau-financement" ? (
                <TableauFinancementTab dossierId={dossierId} />
              ) : tab.value === "plan-financement" ? (
                <PlanFinancementTab dossierId={dossierId} />
              ) : tab.value === "bilan" ? (
                <BilanTab dossierId={dossierId} />
              ) : tab.value === "tva" ? (
                <TVATab dossierId={dossierId} />
              ) : tab.value === "ratios" ? (
                <RatiosTab dossierId={dossierId} />
              ) : tab.value === "tresorerie" ? (
                <TresorerieTab dossierId={dossierId} />
              ) : (
                <PlaceholderContent label={(tab as { label: string }).label} />
              )}
            </TabsContent>
          );
        })}
      </div>
    </Tabs>
  );
}

