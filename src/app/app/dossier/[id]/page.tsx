import { fetchPorteur } from "@/app/actions/porteur";
import { fetchEntrepriseParams } from "@/app/actions/entreprise";
import {
  fetchImmobilisations,
  fetchCessions,
  fetchCreditsBaux,
} from "@/app/actions/investissement";
import {
  fetchApports,
  fetchEmprunts,
} from "@/app/actions/financement";
import {
  fetchActivites,
  fetchActivitesCommission,
  fetchProductionsImmobilisees,
  fetchSubventionsExploitation,
} from "@/app/actions/activite";
import {
  fetchFournitures,
  fetchServices,
  fetchImpots,
} from "@/app/actions/charges";
import {
  fetchLignesSalaries,
  fetchLignesDirigeants,
  fetchLignesCotisationsTNS,
  fetchLignesTaxesSalaires,
  fetchLignesChargesPersonnel,
} from "@/app/actions/personnel";
import {
  fetchReintegrations,
  fetchDeductions,
  fetchParametresIS,
} from "@/app/actions/impots-fiscaux";
import {
  fetchProvisions,
  fetchChargesDatees,
  fetchChargesBilan,
} from "@/app/actions/autres-charges";
import {
  fetchReprises,
  fetchProduitsDate,
  fetchConstates,
} from "@/app/actions/autres-produits";
import {
  fetchFluxDates,
  fetchOperationsCapital,
  fetchPrets,
} from "@/app/actions/divers";
import { fetchUnitesDOeuvre } from "@/app/actions/unites-oeuvre";
import { fetchTableauxLibres } from "@/app/actions/tableau-libre";
import DossierWorkspace from "@/components/app/dossier-workspace";

export default async function DossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch parallèle des données initiales
  const [
    porteur,
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
    reprisesProduits,
    transferts,
    gestionCouranteProduits,
    financiersProduits,
    exceptionnelsProduits,
    pcaProduits,
    diversRemboursementsCC,
    diversDividendes,
    diversDeblocagesParticipation,
    diversEncaissements,
    diversDecaissements,
    diversAugmentationsCapital,
    diversReductionsCapital,
    diversPrets,
    unitesDOeuvre,
    tableauxLibres,
  ] = await Promise.all([
      fetchPorteur(id),
      fetchEntrepriseParams(id),
      fetchImmobilisations(id),
      fetchCessions(id),
      fetchCreditsBaux(id),
      fetchApports(id),
      fetchEmprunts(id),
      fetchActivites(id),
      fetchActivitesCommission(id),
      fetchProductionsImmobilisees(id),
      fetchSubventionsExploitation(id),
      fetchFournitures(id),
      fetchServices(id),
      fetchImpots(id),
      fetchLignesSalaries(id),
      fetchLignesDirigeants(id),
      fetchLignesCotisationsTNS(id),
      fetchLignesTaxesSalaires(id),
      fetchLignesChargesPersonnel(id, "AUTRE"),
      fetchLignesChargesPersonnel(id, "REMBOURSEMENT"),
      fetchLignesChargesPersonnel(id, "PARTICIPATION"),
      fetchReintegrations(id),
      fetchDeductions(id),
      fetchParametresIS(id),
      fetchProvisions(id),
      fetchChargesDatees(id, "GESTION_COURANTE"),
      fetchChargesDatees(id, "FINANCIERE"),
      fetchChargesDatees(id, "EXCEPTIONNELLE"),
      fetchChargesBilan(id, "CHARGE_CONSTATEE_AVANCE"),
      fetchChargesBilan(id, "CHARGE_A_PAYER"),
      fetchReprises(id),
      fetchProduitsDate(id, "TRANSFERT"),
      fetchProduitsDate(id, "GESTION_COURANTE"),
      fetchProduitsDate(id, "FINANCIER"),
      fetchProduitsDate(id, "EXCEPTIONNEL"),
      fetchConstates(id),
      fetchFluxDates(id, "REMBOURSEMENT_CC"),
      fetchFluxDates(id, "DIVIDENDE"),
      fetchFluxDates(id, "DEBLOCAGE_PARTICIPATION"),
      fetchFluxDates(id, "ENCAISSEMENT"),
      fetchFluxDates(id, "DECAISSEMENT"),
      fetchOperationsCapital(id, "AUGMENTATION_INCORPORATION"),
      fetchOperationsCapital(id, "REDUCTION"),
      fetchPrets(id),
      fetchUnitesDOeuvre(id),
      fetchTableauxLibres(id),
    ]);

  return (
    <DossierWorkspace
      dossierId={id}
      description={porteur}
      entreprise={entreprise}
      investissements={investissements}
      cessions={cessions}
      creditsBaux={creditsBaux}
      apports={apports}
      emprunts={emprunts}
      activites={activites}
      activitesCommissions={activitesCommissions}
      productionsImmobilisees={productionsImmobilisees}
      subventionsExploitation={subventionsExploitation}
      fournitures={fournitures}
      services={services}
      impots={impots}
      salaries={salaries}
      dirigeants={dirigeants}
      cotisationsTNS={cotisationsTNS}
      taxesSalaires={taxesSalaires}
      autresCharges={autresCharges}
      remboursements={remboursements}
      participations={participations}
      reintegrations={reintegrations}
      deductions={deductions}
      parametresIS={parametresIS}
      provisions={provisions}
      gestionCourante={gestionCourante}
      financieres={financieres}
      exceptionnelles={exceptionnelles}
      cca={cca}
      cap={cap}
      reproductionReprises={reprisesProduits}
      autreProduitTransferts={transferts}
      autreProduitGestionCourante={gestionCouranteProduits}
      autreProduitFinanciers={financiersProduits}
      autreProduitExceptionnels={exceptionnelsProduits}
      autreProduitPCA={pcaProduits}
      diversRemboursementsCC={diversRemboursementsCC}
      diversDividendes={diversDividendes}
      diversAugmentationsCapital={diversAugmentationsCapital}
      diversReductionsCapital={diversReductionsCapital}
      diversDeblocagesParticipation={diversDeblocagesParticipation}
      diversPrets={diversPrets}
      diversEncaissements={diversEncaissements}
      diversDecaissements={diversDecaissements}
      unitesDOeuvre={unitesDOeuvre}
      tableauxLibres={tableauxLibres}
    />
  );
}

