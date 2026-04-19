"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import PorteurForm from "@/components/app/forms/porteur-form";
import EntrepriseForm from "@/components/app/forms/entreprise-form";
import { InvestissementForm } from "@/components/app/forms/investissement-form";
import { FinancementForm } from "@/components/app/forms/financement-form";
import { ActiviteForm } from "../forms/activite/activite-form";
import { ChargesForm } from "../forms/charges/charges-form";
import { PersonnelForm } from "../forms/personnel/personnel-form";
import { ImpotsFiscauxForm } from "../forms/impots-fiscaux/impots-fiscaux-form";
import { AutresChargesForm } from "../forms/autres-charges/autres-charges-form";
import { AutresProduitsForm } from "../forms/autres-produits/autres-produits-form";
import { DiversForm } from "../forms/divers/divers-form";
import { UnitesDOeuvreForm } from "../forms/unites-oeuvre/unites-oeuvre-form";
import { TableauxLibresForm } from "../forms/tableau-libre/tableau-libre-form";
import { SubTablistContainer } from "./shared/tablist-container";
import { cn } from "@/lib/utils";
import { useSaisieData } from "@/hooks/use-saisie-data";

interface SaisieTabProps {
  dossierId: string;
}

const saisieSubTabs = [
  { value: "porteur", label: "Porteur de projet" },
  { value: "entreprise", label: "Entreprise" },
  { value: "investissement", label: "Investissement" },
  { value: "financement", label: "Financement" },
  { value: "activite", label: "Activité" },
  { value: "charges", label: "Charges" },
  { value: "personnel", label: "Personnel" },
  { value: "autres-produits", label: "Autres produits" },
  { value: "autres-charges", label: "Autres charges" },
  { value: "impots", label: "Impôts" },
  { value: "divers", label: "Divers" },
  { value: "unites-oeuvre", label: "Unités d'œuvre" },
  { value: "tableaux-libres", label: "Tableaux libres" },
] as const;

export default function SaisieTab({ dossierId }: SaisieTabProps) {
  const { data, status, error } = useSaisieData(dossierId);

  return (
    <Tabs defaultValue="porteur" className="flex h-full flex-col gap-0">
      {/* Barre des sous-onglets */}
      <SubTablistContainer>
        <TabsList variant="line" className="h-12 gap-0 rounded-none bg-transparent px-4">
          {saisieSubTabs.map((tab) => (
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
      </SubTablistContainer>

      {/* Contenu des sous-onglets */}
      <div className="min-h-0 flex-1 px-32 py-8">
        {status === "loading" || status === "idle" ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : status === "error" ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <p className="text-sm font-medium text-destructive">Erreur de chargement</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        ) : data ? (
          <>
            <TabsContent value="porteur" className="h-full data-[state=inactive]:hidden">
              <PorteurForm dossierId={dossierId} defaultValues={data.porteur ?? undefined} />
            </TabsContent>

            <TabsContent value="entreprise" className="h-full data-[state=inactive]:hidden">
              <EntrepriseForm dossierId={dossierId} defaultValues={data.entreprise ?? undefined} />
            </TabsContent>

            <TabsContent value="investissement" className="h-full data-[state=inactive]:hidden">
              <InvestissementForm
                dossierId={dossierId}
                immobilisations={data.immobilisations}
                cessions={data.cessions}
                creditsBaux={data.creditsBaux}
                dateDebutExerciceN={data.entreprise?.dateDebutExerciceN}
              />
            </TabsContent>

            <TabsContent value="financement" className="h-full data-[state=inactive]:hidden">
              <FinancementForm
                dossierId={dossierId}
                apports={data.apports}
                emprunts={data.emprunts}
                dateDebutExerciceN={data.entreprise?.dateDebutExerciceN}
              />
            </TabsContent>

            <TabsContent value="activite" className="h-full data-[state=inactive]:hidden">
              <ActiviteForm
                dossierId={dossierId}
                activites={data.activites}
                activitesCommissionnees={data.activitesCommissions}
                productionsImmobilisees={data.productionsImmobilisees}
                subventionsExploitation={data.subventionsExploitation}
                dateDebutExerciceN={data.entreprise?.dateDebutExerciceN}
                exercices={data.entreprise?.exercices}
              />
            </TabsContent>

            <TabsContent value="charges" className="h-full data-[state=inactive]:hidden">
              <ChargesForm
                dossierId={dossierId}
                fournitures={data.fournitures}
                services={data.services}
                impots={data.impots}
                dateDebutExerciceN={data.entreprise?.dateDebutExerciceN}
                exercices={data.entreprise?.exercices}
              />
            </TabsContent>

            <TabsContent value="personnel" className="h-full data-[state=inactive]:hidden">
              <PersonnelForm
                dossierId={dossierId}
                salaries={data.salaries}
                dirigeants={data.dirigeants}
                cotisationsTNS={data.cotisationsTNS}
                taxesSalaires={data.taxesSalaires}
                autresCharges={data.autresChargesPersonnel}
                remboursements={data.remboursements}
                participations={data.participations}
                dateDebutExerciceN={data.entreprise?.dateDebutExerciceN}
                exercices={data.entreprise?.exercices}
              />
            </TabsContent>

            <TabsContent value="impots" className="h-full overflow-auto data-[state=inactive]:hidden">
              <ImpotsFiscauxForm
                dossierId={dossierId}
                reintegrationsInitial={data.reintegrations}
                deductionsInitial={data.deductions}
                parametresISInitial={data.parametresIS}
              />
            </TabsContent>

            <TabsContent value="autres-charges" className="h-full overflow-auto data-[state=inactive]:hidden">
              <AutresChargesForm
                dossierId={dossierId}
                provisionsInitial={data.provisions}
                gestionCouranteInitial={data.gestionCourante}
                financieresInitial={data.financieres}
                exceptionnellesInitial={data.exceptionnelles}
                ccaInitial={data.cca}
                capInitial={data.cap}
              />
            </TabsContent>

            <TabsContent value="autres-produits" className="h-full overflow-auto data-[state=inactive]:hidden">
              <AutresProduitsForm
                dossierId={dossierId}
                reprisesInitial={data.reprisesProduits}
                transfertsInitial={data.transferts}
                gestionCouranteInitial={data.gestionCouranteProduits}
                financiersInitial={data.financiersProduits}
                exceptionnelsInitial={data.exceptionnelsProduits}
                pcaInitial={data.pcaProduits}
              />
            </TabsContent>

            <TabsContent value="divers" className="h-full overflow-auto data-[state=inactive]:hidden">
              <DiversForm
                dossierId={dossierId}
                remboursementsCCInitial={data.diversRemboursementsCC}
                dividendesInitial={data.diversDividendes}
                augmentationsCapitalInitial={data.diversAugmentationsCapital}
                reductionsCapitalInitial={data.diversReductionsCapital}
                deblocagesParticipationInitial={data.diversDeblocagesParticipation}
                pretsInitial={data.diversPrets}
                encaissementsInitial={data.diversEncaissements}
                decaissementsInitial={data.diversDecaissements}
              />
            </TabsContent>

            <TabsContent value="unites-oeuvre" className="h-full overflow-auto data-[state=inactive]:hidden">
              <UnitesDOeuvreForm dossierId={dossierId} initialData={data.unitesDOeuvre} />
            </TabsContent>

            <TabsContent value="tableaux-libres" className="h-full overflow-hidden data-[state=inactive]:hidden">
              <TableauxLibresForm dossierId={dossierId} initialData={data.tableauxLibres ?? []} />
            </TabsContent>
          </>
        ) : null}
      </div>
    </Tabs>
  );
}
