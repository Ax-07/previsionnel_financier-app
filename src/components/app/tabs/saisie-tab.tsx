"use client";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { FileTextIcon } from "lucide-react";
import PorteurForm from "@/components/app/forms/porteur-form";
import EntrepriseForm from "@/components/app/forms/entreprise-form";
import { InvestissementForm } from "@/components/app/forms/investissement-form";
import { FinancementForm } from "@/components/app/forms/financement-form";
import type { PorteurFormValues } from "@/lib/schemas/porteur";
import type { EntrepriseFormValues } from "@/lib/schemas/entreprise";
import type { ImmobilisationWithPlan, CessionRow, CreditBailRow } from "@/lib/schemas/investissement";
import type { ApportRow, EmpruntWithEcheancier } from "@/lib/schemas/financement";
import type { ActiviteRow, ActiviteCommissionRow, ProductionImmobiliseeRow, SubventionExploitationRow } from "@/lib/schemas/activite";
import type { ChargeExploitationRow, ImpotTaxeRow } from "@/lib/schemas/charges";
import { ActiviteForm } from "../forms/activite/activite-form";
import { ChargesForm } from "../forms/charges/charges-form";
import { PersonnelForm } from "../forms/personnel/personnel-form";
import { ImpotsFiscauxForm } from "../forms/impots-fiscaux/impots-fiscaux-form";
import { AutresChargesForm } from "../forms/autres-charges/autres-charges-form";
import { AutresProduitsForm } from "../forms/autres-produits/autres-produits-form";
import { DiversForm } from "../forms/divers/divers-form";
import { UnitesDOeuvreForm } from "../forms/unites-oeuvre/unites-oeuvre-form";
import { TableauxLibresForm } from "../forms/tableau-libre/tableau-libre-form";
import type { TableauLibreRow } from "@/lib/schemas/tableau-libre";
import type { AutreChargeProvisionRow, AutreChargeDateeRow, AutreChargeBilanRow } from "@/lib/schemas/autres-charges";
import type { AutreProduitRepriseRow, AutreProduitDateRow, AutreProduitConstateRow } from "@/lib/schemas/autres-produits";
import type { DiversFluxDateRow, DiversOperationCapitalRow, DiversPretRow } from "@/lib/schemas/divers";
import type { UniteDOeuvreRow } from "@/lib/schemas/unites-oeuvre";
import type {
  LigneSalarieRow,
  LigneDirigeantRow,
  LigneCotisationTNSRow,
  LigneTaxeSalaireRow,
  LigneChargePersonnelRow,
} from "@/lib/schemas/personnel";
import type { AjustementFiscalRow, ParametresISData } from "@/lib/schemas/impots-fiscaux";

interface SaisieTabProps {
  dossierId: string;
  defaultValues?: Partial<PorteurFormValues>;
  entrepriseDefaultValues?: Partial<EntrepriseFormValues>;
  investissementData?: ImmobilisationWithPlan[];
  cessionsData?: CessionRow[];
  creditsBauxData?: CreditBailRow[];
  aportsData?: ApportRow[];
  empruntsData?: EmpruntWithEcheancier[];
  activitesData?: ActiviteRow[];
  activitesCommissionsData?: ActiviteCommissionRow[];
  productionsImmobiliseesData?: ProductionImmobiliseeRow[];
  subventionsExploitationData?: SubventionExploitationRow[];
  fournituresData?: ChargeExploitationRow[];
  servicesData?: ChargeExploitationRow[];
  impotsData?: ImpotTaxeRow[];
  salariesData?: LigneSalarieRow[];
  dirigeantsData?: LigneDirigeantRow[];
  cotisationsTNSData?: LigneCotisationTNSRow[];
  taxesSalairesData?: LigneTaxeSalaireRow[];
  autresChargesData?: LigneChargePersonnelRow[];
  remboursementsData?: LigneChargePersonnelRow[];
  participationsData?: LigneChargePersonnelRow[];
  reintegrationsData?: AjustementFiscalRow[];
  deductionsData?: AjustementFiscalRow[];
  parametresISData?: ParametresISData;
  provisionsData?: AutreChargeProvisionRow[];
  gestionCouranteData?: AutreChargeDateeRow[];
  financieresData?: AutreChargeDateeRow[];
  exceptionnellesData?: AutreChargeDateeRow[];
  ccaData?: AutreChargeBilanRow[];
  capData?: AutreChargeBilanRow[];
  // Autres produits
  reprisesProduitsData?: AutreProduitRepriseRow[];
  transfertsData?: AutreProduitDateRow[];
  gestionCouranteProduitsData?: AutreProduitDateRow[];
  financiersData?: AutreProduitDateRow[];
  exceptionnelsData?: AutreProduitDateRow[];
  pcaData?: AutreProduitConstateRow[];
  // Unités d'œuvre
  unitesDOeuvreData?: UniteDOeuvreRow[];
  // Divers
  remboursementsCCData?: DiversFluxDateRow[];
  dividendesData?: DiversFluxDateRow[];
  augmentationsCapitalData?: DiversOperationCapitalRow[];
  reductionsCapitalData?: DiversOperationCapitalRow[];
  deblocagesParticipationData?: DiversFluxDateRow[];
  pretsData?: DiversPretRow[];
  encaissementsData?: DiversFluxDateRow[];
  decaissementsData?: DiversFluxDateRow[];
  // Tableaux libres
  tableauxLibresData?: TableauLibreRow[];
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

function PlaceholderContent({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <FileTextIcon className="size-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold">{label}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ce module est en cours de développement.
        </p>
      </div>
    </div>
  );
}

export default function SaisieTab({
  dossierId,
  defaultValues,
  entrepriseDefaultValues,
  investissementData,
  cessionsData,
  creditsBauxData,
  aportsData,
  empruntsData,
  activitesData,
  activitesCommissionsData,
  productionsImmobiliseesData,
  subventionsExploitationData,
  fournituresData,
  servicesData,
  impotsData,
  salariesData,
  dirigeantsData,
  cotisationsTNSData,
  taxesSalairesData,
  autresChargesData,
  remboursementsData,
  participationsData,
  reintegrationsData,
  deductionsData,
  parametresISData,
  provisionsData,
  gestionCouranteData,
  financieresData,
  exceptionnellesData,
  ccaData,
  capData,
  reprisesProduitsData,
  transfertsData,
  gestionCouranteProduitsData,
  financiersData,
  exceptionnelsData,
  pcaData,
  unitesDOeuvreData,
  remboursementsCCData,
  dividendesData,
  augmentationsCapitalData,
  reductionsCapitalData,
  deblocagesParticipationData,
  pretsData,
  encaissementsData,
  decaissementsData,
  tableauxLibresData,
}: SaisieTabProps) {
  return (
    <Tabs
      defaultValue="porteur"
      className="flex h-full flex-col gap-0"
    >
      {/* Barre des sous-onglets */}
      <div className="shrink-0 overflow-x-auto overflow-y-hidden border-b bg-muted/30">
        <TabsList
          variant="line"
          className="h-12 w-max min-w-full gap-0 rounded-none bg-transparent px-4"
        >
          {saisieSubTabs.map((tab) => (
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
      <div className="min-h-0 flex-1 px-32 py-8">
        {/* Porteur de projet — formulaire complet */}
        <TabsContent
          value="porteur"
          className="h-full data-[state=inactive]:hidden"
        >
          <PorteurForm dossierId={dossierId} defaultValues={defaultValues} />
        </TabsContent>

        {/* Entreprise — formulaire complet */}
        <TabsContent
          value="entreprise"
          className="h-full data-[state=inactive]:hidden"
        >
          <EntrepriseForm
            dossierId={dossierId}
            defaultValues={entrepriseDefaultValues}
          />
        </TabsContent>

        {/* Investissement — formulaire complet */}
        <TabsContent
          value="investissement"
          className="h-full data-[state=inactive]:hidden"
        >
          <InvestissementForm
            dossierId={dossierId}
            immobilisations={investissementData}
            cessions={cessionsData}
            creditsBaux={creditsBauxData}
            dateDebutExerciceN={entrepriseDefaultValues?.dateDebutExerciceN}
          />
        </TabsContent>

        {/* Financement — formulaire complet */}
        <TabsContent
          value="financement"
          className="h-full data-[state=inactive]:hidden"
        >
          <FinancementForm
            dossierId={dossierId}
            apports={aportsData}
            emprunts={empruntsData}
            dateDebutExerciceN={entrepriseDefaultValues?.dateDebutExerciceN}
          />
        </TabsContent>

        {/* Activité — formulaire complet */}
        <TabsContent
          value="activite"
          className="h-full data-[state=inactive]:hidden"
        >
          <ActiviteForm
            dossierId={dossierId}
            activites={activitesData}
            activitesCommissionnees={activitesCommissionsData}
            productionsImmobilisees={productionsImmobiliseesData}
            subventionsExploitation={subventionsExploitationData}
            dateDebutExerciceN={entrepriseDefaultValues?.dateDebutExerciceN}
            exercices={entrepriseDefaultValues?.exercices}
          />
        </TabsContent>

        {/* Charges — formulaire complet */}
        <TabsContent
          value="charges"
          className="h-full data-[state=inactive]:hidden"
        >
          <ChargesForm
            dossierId={dossierId}
            fournitures={fournituresData}
            services={servicesData}
            impots={impotsData}
            dateDebutExerciceN={entrepriseDefaultValues?.dateDebutExerciceN}
            exercices={entrepriseDefaultValues?.exercices}
          />
        </TabsContent>

        {/* Personnel — formulaire complet */}
        <TabsContent
          value="personnel"
          className="h-full data-[state=inactive]:hidden"
        >
          <PersonnelForm
            dossierId={dossierId}
            salaries={salariesData}
            dirigeants={dirigeantsData}
            cotisationsTNS={cotisationsTNSData}
            taxesSalaires={taxesSalairesData}
            autresCharges={autresChargesData}
            remboursements={remboursementsData}
            participations={participationsData}
            dateDebutExerciceN={entrepriseDefaultValues?.dateDebutExerciceN}
            exercices={entrepriseDefaultValues?.exercices}
          />
        </TabsContent>

        {/* Impôts fiscaux — formulaire complet */}
        <TabsContent
          value="impots"
          className="h-full overflow-auto data-[state=inactive]:hidden"
        >
          <ImpotsFiscauxForm
            dossierId={dossierId}
            reintegrationsInitial={reintegrationsData}
            deductionsInitial={deductionsData}
            parametresISInitial={parametresISData}
          />
        </TabsContent>

        {/* Autres charges — formulaire complet */}
        <TabsContent
          value="autres-charges"
          className="h-full overflow-auto data-[state=inactive]:hidden"
        >
          <AutresChargesForm
            dossierId={dossierId}
            provisionsInitial={provisionsData}
            gestionCouranteInitial={gestionCouranteData}
            financieresInitial={financieresData}
            exceptionnellesInitial={exceptionnellesData}
            ccaInitial={ccaData}
            capInitial={capData}
          />
        </TabsContent>

        {/* Autres produits — formulaire complet */}
        <TabsContent
          value="autres-produits"
          className="h-full overflow-auto data-[state=inactive]:hidden"
        >
          <AutresProduitsForm
            dossierId={dossierId}
            reprisesInitial={reprisesProduitsData}
            transfertsInitial={transfertsData}
            gestionCouranteInitial={gestionCouranteProduitsData}
            financiersInitial={financiersData}
            exceptionnelsInitial={exceptionnelsData}
            pcaInitial={pcaData}
          />
        </TabsContent>

        {/* Divers — formulaire complet */}
        <TabsContent
          value="divers"
          className="h-full overflow-auto data-[state=inactive]:hidden"
        >
          <DiversForm
            dossierId={dossierId}
            remboursementsCCInitial={remboursementsCCData}
            dividendesInitial={dividendesData}
            augmentationsCapitalInitial={augmentationsCapitalData}
            reductionsCapitalInitial={reductionsCapitalData}
            deblocagesParticipationInitial={deblocagesParticipationData}
            pretsInitial={pretsData}
            encaissementsInitial={encaissementsData}
            decaissementsInitial={decaissementsData}
          />
        </TabsContent>

        {/* Unités d'œuvre — formulaire complet */}
        <TabsContent
          value="unites-oeuvre"
          className="h-full overflow-auto data-[state=inactive]:hidden"
        >
          <UnitesDOeuvreForm
            dossierId={dossierId}
            initialData={unitesDOeuvreData}
          />
        </TabsContent>

        {/* Tableaux libres — formulaire complet */}
        <TabsContent
          value="tableaux-libres"
          className="h-full overflow-hidden data-[state=inactive]:hidden"
        >
          <TableauxLibresForm
            dossierId={dossierId}
            initialData={tableauxLibresData ?? []}
          />
        </TabsContent>

        {/* Autres onglets — placeholders */}
        {saisieSubTabs
          .filter(
            (tab): tab is typeof saisieSubTabs[number] =>
              tab.value !== "porteur" &&
              tab.value !== "entreprise" &&
              tab.value !== "investissement" &&
              tab.value !== "financement" &&
              tab.value !== "activite" &&
              tab.value !== "charges" &&
              tab.value !== "personnel" &&
              tab.value !== "impots" &&
              tab.value !== "autres-charges" &&
              tab.value !== "autres-produits" &&
              tab.value !== "divers" &&
              tab.value !== "unites-oeuvre" &&
              tab.value !== "tableaux-libres"
          )
          .map((tab) => (
            <TabsContent
              key={tab.value}
              value={tab.value}
              className="h-full p-6 data-[state=inactive]:hidden"
            >
              <PlaceholderContent label={tab.label} />
            </TabsContent>
          ))}
      </div>
    </Tabs>
  );
}
