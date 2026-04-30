"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SaisieTab from "@/components/app/tabs/saisie-tab";
import ControleTab from "@/components/app/tabs/controle-tab";
import ImportsTab from "@/components/app/tabs/imports-tab";
import DiaporamaTab from "@/components/app/tabs/diaporama-tab";
import { TablistContainer } from "./tabs/shared/tablist-container";
import { cn } from "@/lib/utils";

interface DossierWorkspaceProps {
  dossierId: string;
}

const mainTabs = [
  { value: "saisie", label: "Saisie" },
  { value: "controle", label: "Contrôle" },
  { value: "imports", label: "Imports" },
  { value: "diaporama", label: "Diaporama" },
] as const;

export default function DossierWorkspace({
  dossierId,
}: DossierWorkspaceProps) {
  return (
    <Tabs defaultValue="saisie" className="min-h-0 h-full gap-0">
      {/* ── Barre d'onglets principale ─────────────────────────── */}
      <TablistContainer>
        <TabsList variant="line" className="h-11 gap-0 rounded-none bg-transparent">
          {mainTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn("px-5 text-sm font-medium",
                                `group-data-[variant=line]/tabs-list:bg-transparent
                 group-data-[variant=line]/tabs-list:hover:bg-accent-foreground/10
                 group-data-[variant=line]/tabs-list:data-[state=active]:bg-accent-foreground/30 
                 dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent 
                 dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-accent-foreground/30 
                 rounded-b-none`
              )}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </TablistContainer>

      {/* ── Contenus ───────────────────────────────────────────── */}
      <TabsContent value="saisie" className="flex-1 min-h-0 overflow-hidden">
        <SaisieTab dossierId={dossierId} />
      </TabsContent>

      <TabsContent value="controle" className="flex-1 min-h-0 overflow-hidden">
        <ControleTab dossierId={dossierId} />
      </TabsContent>

      <TabsContent value="imports" className="flex-1 min-h-0 overflow-hidden">
        <ImportsTab />
      </TabsContent>

      <TabsContent value="diaporama" className="flex-1 min-h-0 overflow-hidden">
        <DiaporamaTab />
      </TabsContent>
    </Tabs>
  );
}
