"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import DashboardKpiTab from "./controle/dashboard-kpi-tab";
import { HypotheseComparisonView } from "@/components/app/hypothese/hypothese-comparison-view";
import { SubTablistContainer } from "./shared/tablist-container";
import { HypotheseSelector } from "@/components/app/hypothese/hypothese-selector";
import { cn } from "@/lib/utils";

// ── Mapping valeur → composant ────────────────────────────────────────────────

const TAB_COMPONENTS: Record<string, React.FC<{ dossierId: string }>> = {
  dashboard: DashboardKpiTab,
  synthese: SyntheseTab,
  "compte-resultat": CompteResultatTab,
  sig: SigTab,
  budget: BudgetTab,
  caf: CafTab,
  "seuil-rentabilite": SeuilRentabiliteTab,
  bfr: BfrTab,
  "tableau-financement": TableauFinancementTab,
  "plan-financement": PlanFinancementTab,
  bilan: BilanTab,
  ratios: RatiosTab,
  tresorerie: TresorerieTab,
  tva: TVATab,
  comparaison: HypotheseComparisonView,
};

// ── Onglets qui ne sont PAS fullHeight (placeholders en développement) ────────

const NOT_FULL_HEIGHT = new Set(["ratios-sectoriels", "previsionnel-etendu"]);

const controleSubTabs = [
  { value: "dashboard", label: "Dashboard KPI" },
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
  { value: "comparaison", label: "Comparaison" },
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
        <p className="mt-1 text-sm text-muted-foreground">Ce tableau de contrôle est en cours de développement.</p>
      </div>
    </div>
  );
}

interface ControleTabProps {
  dossierId: string;
}

export default function ControleTab({ dossierId }: ControleTabProps) {
  return (
    <Tabs defaultValue="dashboard" className="flex h-full flex-col gap-0">
      <SubTablistContainer>
        <div className="flex items-center justify-between gap-4 px-4">
          <TabsList variant="line" className="h-10 gap-0 rounded-none bg-transparent">
            {controleSubTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "shrink-0 px-3 text-xs font-medium",
                  `group-data-[variant=line]/tabs-list:bg-transparent
                   group-data-[variant=line]/tabs-list:hover:bg-accent-foreground/10
                   group-data-[variant=line]/tabs-list:data-[state=active]:bg-accent-foreground/30 
                   dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent 
                   dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-accent-foreground/30
                   rounded-b-none`,
                )}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {/* <HypotheseSelector dossierId={dossierId} /> */}
        </div>
      </SubTablistContainer>

      <div className="min-h-0 flex-1">
        {controleSubTabs.map((tab) => {
          const Component = TAB_COMPONENTS[tab.value];
          const isFullHeight = !NOT_FULL_HEIGHT.has(tab.value);
          return (
            <TabsContent
              key={tab.value}
              value={tab.value}
              forceMount
              className={
                isFullHeight ? "h-full data-[state=inactive]:hidden" : "h-full p-6 data-[state=inactive]:hidden"
              }
            >
              {Component ? (
                <Component dossierId={dossierId} />
              ) : (
                <PlaceholderContent label={tab.label} />
              )}
            </TabsContent>
          );
        })}
      </div>
    </Tabs>
  );
}
