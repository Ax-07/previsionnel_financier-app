"use client";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import SaisieTab from "@/components/app/tabs/saisie-tab";
import ControleTab from "@/components/app/tabs/controle-tab";
import ImportsTab from "@/components/app/tabs/imports-tab";
import RapportsTab from "@/components/app/tabs/rapports-tab";
import DiaporamaTab from "@/components/app/tabs/diaporama-tab";
import type { PorteurFormValues } from "@/lib/schemas/porteur";
import type { EntrepriseFormValues } from "@/lib/schemas/entreprise";
import type { ImmobilisationWithPlan, CessionRow, CreditBailRow } from "@/lib/schemas/investissement";
import type { ApportRow, EmpruntWithEcheancier } from "@/lib/schemas/financement";
import type { ActiviteRow, ActiviteCommissionRow, ProductionImmobiliseeRow, SubventionExploitationRow } from "@/lib/schemas/activite";
import type { ChargeExploitationRow, ImpotTaxeRow } from "@/lib/schemas/charges";
import type {
  LigneSalarieRow,
  LigneDirigeantRow,
  LigneCotisationTNSRow,
  LigneTaxeSalaireRow,
  LigneChargePersonnelRow,
} from "@/lib/schemas/personnel";
import type { AjustementFiscalRow, ParametresISData } from "@/lib/schemas/impots-fiscaux";
import type { AutreChargeProvisionRow, AutreChargeDateeRow, AutreChargeBilanRow } from "@/lib/schemas/autres-charges";
import type { AutreProduitRepriseRow, AutreProduitDateRow, AutreProduitConstateRow } from "@/lib/schemas/autres-produits";
import type { DiversFluxDateRow, DiversOperationCapitalRow, DiversPretRow } from "@/lib/schemas/divers";
import type { UniteDOeuvreRow } from "@/lib/schemas/unites-oeuvre";
import type { TableauLibreRow } from "@/lib/schemas/tableau-libre";

interface DossierWorkspaceProps {
  dossierId: string;
  description: Partial<PorteurFormValues> | null;
  entreprise: Partial<EntrepriseFormValues> | null;
  investissements: ImmobilisationWithPlan[];
  cessions: CessionRow[];
  creditsBaux: CreditBailRow[];
  apports: ApportRow[];
  emprunts: EmpruntWithEcheancier[];
  activites: ActiviteRow[];
  activitesCommissions: ActiviteCommissionRow[];
  productionsImmobilisees: ProductionImmobiliseeRow[];
  subventionsExploitation: SubventionExploitationRow[];
  fournitures: ChargeExploitationRow[];
  services: ChargeExploitationRow[];
  impots: ImpotTaxeRow[];
  salaries: LigneSalarieRow[];
  dirigeants: LigneDirigeantRow[];
  cotisationsTNS: LigneCotisationTNSRow[];
  taxesSalaires: LigneTaxeSalaireRow[];
  autresCharges: LigneChargePersonnelRow[];
  remboursements: LigneChargePersonnelRow[];
  participations: LigneChargePersonnelRow[];
  reintegrations: AjustementFiscalRow[];
  deductions: AjustementFiscalRow[];
  parametresIS: ParametresISData;
  provisions: AutreChargeProvisionRow[];
  gestionCourante: AutreChargeDateeRow[];
  financieres: AutreChargeDateeRow[];
  exceptionnelles: AutreChargeDateeRow[];
  cca: AutreChargeBilanRow[];
  cap: AutreChargeBilanRow[];
  // Autres produits
  reproductionReprises: AutreProduitRepriseRow[];
  autreProduitTransferts: AutreProduitDateRow[];
  autreProduitGestionCourante: AutreProduitDateRow[];
  autreProduitFinanciers: AutreProduitDateRow[];
  autreProduitExceptionnels: AutreProduitDateRow[];
  autreProduitPCA: AutreProduitConstateRow[];
  // Divers
  diversRemboursementsCC: DiversFluxDateRow[];
  diversDividendes: DiversFluxDateRow[];
  diversAugmentationsCapital: DiversOperationCapitalRow[];
  diversReductionsCapital: DiversOperationCapitalRow[];
  diversDeblocagesParticipation: DiversFluxDateRow[];
  diversPrets: DiversPretRow[];
  diversEncaissements: DiversFluxDateRow[];
  diversDecaissements: DiversFluxDateRow[];
  // Unités d'œuvre
  unitesDOeuvre: UniteDOeuvreRow[];
  // Tableaux libres
  tableauxLibres: TableauLibreRow[];
}

const mainTabs = [
  { value: "saisie",    label: "Saisie" },
  { value: "controle",  label: "Contrôle" },
  { value: "imports",   label: "Imports" },
  { value: "rapports",  label: "Rapports" },
  { value: "diaporama", label: "Diaporama" },
] as const;

export default function DossierWorkspace({
  dossierId,
  description,
  entreprise,
  investissements,
  cessions,
  creditsBaux,
  apports,
  emprunts,
  activites,
  activitesCommissions,
  productionsImmobilisees,
  subventionsExploitation,
  fournitures,
  services,
  impots,
  salaries,
  dirigeants,
  cotisationsTNS,
  taxesSalaires,
  autresCharges,
  remboursements,
  participations,
  reintegrations,
  deductions,
  parametresIS,
  provisions,
  gestionCourante,
  financieres,
  exceptionnelles,
  cca,
  cap,
  reproductionReprises,
  autreProduitTransferts,
  autreProduitGestionCourante,
  autreProduitFinanciers,
  autreProduitExceptionnels,
  autreProduitPCA,
  diversRemboursementsCC,
  diversDividendes,
  diversAugmentationsCapital,
  diversReductionsCapital,
  diversDeblocagesParticipation,
  diversPrets,
  diversEncaissements,
  diversDecaissements,
  unitesDOeuvre,
  tableauxLibres,
}: DossierWorkspaceProps) {
  return (
    <Tabs defaultValue="saisie" className="h-full gap-0">
      {/* ── Barre d'onglets principale ─────────────────────────── */}
      <div className="shrink-0 border-b bg-background px-4">
        <TabsList
          variant="line"
          className="h-11 gap-0 rounded-none bg-transparent"
        >
          {mainTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="px-5 text-sm font-medium"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* ── Contenus ───────────────────────────────────────────── */}
      <TabsContent value="saisie" className="flex-1 overflow-hidden">
        <SaisieTab
          dossierId={dossierId}
          defaultValues={description ?? undefined}
          entrepriseDefaultValues={entreprise ?? undefined}
          investissementData={investissements}
          cessionsData={cessions}
          creditsBauxData={creditsBaux}
          aportsData={apports}
          empruntsData={emprunts}
          activitesData={activites}
          activitesCommissionsData={activitesCommissions}
          productionsImmobiliseesData={productionsImmobilisees}
          subventionsExploitationData={subventionsExploitation}
          fournituresData={fournitures}
          servicesData={services}
          impotsData={impots}
          salariesData={salaries}
          dirigeantsData={dirigeants}
          cotisationsTNSData={cotisationsTNS}
          taxesSalairesData={taxesSalaires}
          autresChargesData={autresCharges}
          remboursementsData={remboursements}
          participationsData={participations}
          reintegrationsData={reintegrations}
          deductionsData={deductions}
          parametresISData={parametresIS}
          provisionsData={provisions}
          gestionCouranteData={gestionCourante}
          financieresData={financieres}
          exceptionnellesData={exceptionnelles}
          ccaData={cca}
          capData={cap}
          reprisesProduitsData={reproductionReprises}
          transfertsData={autreProduitTransferts}
          gestionCouranteProduitsData={autreProduitGestionCourante}
          financiersData={autreProduitFinanciers}
          exceptionnelsData={autreProduitExceptionnels}
          pcaData={autreProduitPCA}
          remboursementsCCData={diversRemboursementsCC}
          dividendesData={diversDividendes}
          augmentationsCapitalData={diversAugmentationsCapital}
          reductionsCapitalData={diversReductionsCapital}
          deblocagesParticipationData={diversDeblocagesParticipation}
          pretsData={diversPrets}
          encaissementsData={diversEncaissements}
          decaissementsData={diversDecaissements}
          unitesDOeuvreData={unitesDOeuvre}
          tableauxLibresData={tableauxLibres}
        />
      </TabsContent>

      <TabsContent value="controle" className="flex-1 overflow-hidden">
        <ControleTab dossierId={dossierId} />
      </TabsContent>

      <TabsContent value="imports" className="flex-1 overflow-hidden">
        <ImportsTab />
      </TabsContent>

      <TabsContent value="rapports" className="flex-1 overflow-hidden">
        <RapportsTab dossierId={dossierId} />
      </TabsContent>

      <TabsContent value="diaporama" className="flex-1 overflow-hidden">
        <DiaporamaTab />
      </TabsContent>
    </Tabs>
  );
}
