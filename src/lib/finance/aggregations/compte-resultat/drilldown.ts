import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import type { FinCalcResult } from "@/lib/finance/calculs";
import { n } from "@/lib/finance/utils";
import { distribuerAmortParExercice } from "@/lib/finance/calculs/amortissements";
import {
  seasonalMonthly,
  ponctuelMonthly,
  computeStocksAchatsSeries,
  type MonthlySeries,
} from "@/lib/finance/calculs/monthly";

// ── Type inféré automatiquement ───────────────────────────────────────────────
export type DrilldownRows = ReturnType<typeof buildDrilldownRows>;

// ── Helpers internes ──────────────────────────────────────────────────────────

function sumDotGroup(groupe: { y1: number; y2: number; y3: number }[]) {
  return {
    y1: groupe.reduce((s, d) => s + d.y1, 0),
    y2: groupe.reduce((s, d) => s + d.y2, 0),
    y3: groupe.reduce((s, d) => s + d.y3, 0),
  };
}

// ── Fonction principale ───────────────────────────────────────────────────────

/**
 * Transforme les données brutes du scénario en tableaux de lignes pour le
 * drill-down de chaque nœud du compte de résultat.
 */
export function buildDrilldownRows(data: ScenarioFinData, fc: FinCalcResult) {
  const {
    activites,
    activiteCommissions: commissions,
    fournitures,
    services,
    impotsTaxes: impots,
    salaries,
    dirigeants,
    cotisationsTNS,
    taxesSalaires,
    immobilisations,
    provisions,
    chargesGestionCourante,
    chargesExceptionnelles,
    chargesFinancieres,
    emprunts,
    reprisesProduits,
    financiersProduits,
    exceptionnelsProduits,
  } = data;

  const { anneeDebut, moisDebut, toExerciceKey } = fc;

  // ── CA par activité ────────────────────────────────────────────────────────
  const caRows = activites
    .filter((a) => a.actif !== false)
    .map((a) => ({
      id: a.id,
      libelle: a.libelle,
      actif: a.actif,
      montantN: n(a.montantN),
      montantN1: n(a.montantN1),
      montantN2: n(a.montantN2),
      tauxMarge: n(a.tauxMarge),
      typeActivite: a.typeActivite,
      stocks: n(a.stocks ?? 0),
      achatsStockPonctuel: a.achatsStockPonctuel,
    }));

  // ── Achats de matières / marchandises ──────────────────────────────────────
  // achatsRows = achats effectués par activité, alignés sur le moteur (computeStocksAchatsSeries).
  // Les ponctuels sont inclus dans la dynamique stock (ils affectent sfFinal) et ne sont PAS
  // affichés séparément pour garantir la cohérence avec fc.achatsEffectues.
  const sumOf = (s: MonthlySeries) => s.reduce((acc, v) => acc + (v ?? 0), 0);
  const achatsRows = caRows
    .filter((r) => r.typeActivite !== "PRESTATION_SERVICES")
    .map((r) => {
      const act = activites.find((a) => a.id === r.id);
      const saisonnalite = act?.saisonnaliteCA ?? null;
      const achatsStockPonctuel = act?.achatsStockPonctuel ?? null;
      const coef = Math.max(0, 1 - r.tauxMarge / 100);
      const joursStock = r.stocks;

      // Y1
      const consY1 = seasonalMonthly(r.montantN * coef, saisonnalite, "N");
      const poncY1 = ponctuelMonthly(achatsStockPonctuel, "N");
      const rY1 = computeStocksAchatsSeries(consY1, poncY1, joursStock, 0);

      // Y2 (stock initial = sfFinal Y1)
      const consY2 = seasonalMonthly(r.montantN1 * coef, saisonnalite, "N1");
      const poncY2 = ponctuelMonthly(achatsStockPonctuel, "N1");
      const rY2 = computeStocksAchatsSeries(consY2, poncY2, joursStock, rY1.sfFinal);

      // Y3 (stock initial = sfFinal Y2)
      const consY3 = seasonalMonthly(r.montantN2 * coef, saisonnalite, "N2");
      const poncY3 = ponctuelMonthly(achatsStockPonctuel, "N2");
      const rY3 = computeStocksAchatsSeries(consY3, poncY3, joursStock, rY2.sfFinal);

      return {
        libelle: `Achats – ${r.libelle}`,
        actif: r.actif,
        montantN:  sumOf(rY1.achatsEffSeries),
        montantN1: sumOf(rY2.achatsEffSeries),
        montantN2: sumOf(rY3.achatsEffSeries),
      };
    });

  // Ponctuels désormais intégrés dans achatsRows via computeStocksAchatsSeries
  const achatsPonctuelsRows: { libelle: string; montantN: number; montantN1: number; montantN2: number }[] = [];

  // ── Commissions ───────────────────────────────────────────────────────────
  const commissionRows = commissions
    .filter((c) => c.actif !== false)
    .map((c) => ({ id: c.id, libelle: c.libelle, actif: c.actif, montantN: n(c.montantN), montantN1: n(c.montantN1), montantN2: n(c.montantN2) }));

  // ── Reprises sur provisions ───────────────────────────────────────────────
  const reprisesRows = reprisesProduits
    .filter((r) => r.actif !== false)
    .map((r) => ({ libelle: r.libelle, actif: r.actif, montantN: n(r.montantN), montantN1: n(r.montantN1), montantN2: n(r.montantN2) }));

  // ── Fournitures & services ─────────────────────────────────────────────────
  const fournituresRows = fournitures
    .filter((f) => f.actif !== false)
    .map((f) => ({ libelle: f.libelle, actif: f.actif, montantN: n(f.montantN), montantN1: n(f.montantN1), montantN2: n(f.montantN2) }));

  const servicesRows = services
    .filter((s) => s.actif !== false)
    .map((s) => ({ libelle: s.libelle, actif: s.actif, montantN: n(s.montantN), montantN1: n(s.montantN1), montantN2: n(s.montantN2) }));

  // ── Impôts ────────────────────────────────────────────────────────────────
  const impotsRows = impots
    .filter((i) => i.actif !== false)
    .map((i) => ({ libelle: i.libelle, actif: i.actif, montantN: n(i.montantN ?? 0), montantN1: n(i.montantN1 ?? 0), montantN2: n(i.montantN2 ?? 0) }));

  // ── Personnel ─────────────────────────────────────────────────────────────
  const salaireRows = salaries
    .filter((s) => s.actif !== false)
    .map((s) => ({ libelle: s.libelle, actif: s.actif, montantN: n(s.montantN), montantN1: n(s.montantN1), montantN2: n(s.montantN2) }));

  const dirigeantRows = dirigeants
    .filter((d) => d.actif !== false)
    .map((d) => ({ libelle: d.libelle, actif: d.actif, montantN: n(d.montantN), montantN1: n(d.montantN1), montantN2: n(d.montantN2) }));

  const cotisationsRows = cotisationsTNS
    .filter((c) => c.actif !== false)
    .map((c) => ({ libelle: c.libelle, actif: c.actif, montantN: n(c.montantN), montantN1: n(c.montantN1), montantN2: n(c.montantN2) }));

  const taxesSalairesRows = taxesSalaires
    .filter((t) => t.actif !== false)
    .map((t) => ({ libelle: t.libelle, montantN: n(t.montantN), montantN1: n(t.montantN1), montantN2: n(t.montantN2) }));

  // ── Amortissements ────────────────────────────────────────────────────────
  const dotationsParImmoData = immobilisations
    .filter((immo) => immo.actif !== false)
    .map((immo) => {
      const dot = distribuerAmortParExercice(immo, anneeDebut, moisDebut);
      return { immo, y1: dot.y1, y2: dot.y2, y3: dot.y3 };
    });

  const dotParNature = {
    CORPOREL: dotationsParImmoData.filter((d) => d.immo.nature === "CORPOREL"),
    INCORPOREL: dotationsParImmoData.filter((d) => d.immo.nature === "INCORPOREL"),
    FINANCIER: dotationsParImmoData.filter((d) => d.immo.nature === "FINANCIER"),
  };

  const dotCorporel = sumDotGroup(dotParNature.CORPOREL);
  const dotIncorporel = sumDotGroup(dotParNature.INCORPOREL);
  const dotFinancier = sumDotGroup(dotParNature.FINANCIER);

  // ── Charges financières : Intérêts + assurances par emprunt ───────────────
  const interetsParEmprunt = emprunts
    .filter((e) => e.lignesEcheancier.length > 0)
    .map((emprunt) => {
      const vals = { y1: 0, y2: 0, y3: 0 };
      for (const ligne of emprunt.lignesEcheancier) {
        if (ligne.moisNumero === -1) continue; // -1 = frais de dossier, pas un intérêt
        const dateStr =
          ligne.dateEcheance instanceof Date
            ? ligne.dateEcheance.toISOString()
            : String(ligne.dateEcheance);
        const yk = toExerciceKey(dateStr);
        if (yk) vals[yk] += n(ligne.interesMois) + n(ligne.assuranceMois);
      }
      return { libelle: emprunt.libelle, ...vals };
    })
    .filter((e) => e.y1 !== 0 || e.y2 !== 0 || e.y3 !== 0);

  // ── Charges financières : Frais de dossier par emprunt ────────────────────
  const fraisDossierParEmprunt = emprunts
    .map((emprunt) => {
      const vals = { y1: 0, y2: 0, y3: 0 };
      for (const ligne of emprunt.lignesEcheancier) {
        if (ligne.moisNumero !== -1) continue; // -1 = identifiant frais de dossier (convention echeancier.ts)
        const dateStr =
          ligne.dateEcheance instanceof Date
            ? ligne.dateEcheance.toISOString()
            : String(ligne.dateEcheance);
        const yk = toExerciceKey(dateStr);
        if (yk) vals[yk] += n(ligne.mensualiteTotale);
      }
      return { libelle: emprunt.libelle, ...vals };
    })
    .filter((e) => e.y1 !== 0 || e.y2 !== 0 || e.y3 !== 0);

  // ── Autres charges financières (saisie manuelle) ──────────────────────────
  const autresChargesFinRows = chargesFinancieres
    .filter((c) => c.actif !== false)
    .map((c) => ({ libelle: c.libelle, actif: c.actif, montantN: n(c.montantN), montantN1: n(c.montantN1), montantN2: n(c.montantN2) }));

  // ── Autres charges d'exploitation ─────────────────────────────────────────
  const provisionsRows = provisions
    .filter((p) => p.actif !== false)
    .map((p) => ({ libelle: p.libelle, actif: p.actif, montantN: n(p.montantN), montantN1: n(p.montantN1), montantN2: n(p.montantN2) }));

  const chargesGestionRows = chargesGestionCourante
    .filter((c) => c.actif !== false)
    .map((c) => ({ libelle: c.libelle, actif: c.actif, montantN: n(c.montantN), montantN1: n(c.montantN1), montantN2: n(c.montantN2) }));

  // ── Produits financiers & exceptionnels ───────────────────────────────────
  const prodFinRows = financiersProduits
    .filter((r) => r.actif !== false)
    .map((r) => ({ libelle: r.libelle, actif: r.actif, montantN: n(r.montantN), montantN1: n(r.montantN1), montantN2: n(r.montantN2) }));

  const prodExcepRows = exceptionnelsProduits
    .filter((r) => r.actif !== false)
    .map((r) => ({ libelle: r.libelle, actif: r.actif, montantN: n(r.montantN), montantN1: n(r.montantN1), montantN2: n(r.montantN2) }));

  const chargesExcepRows = chargesExceptionnelles
    .filter((c) => c.actif !== false)
    .map((c) => ({ libelle: c.libelle, actif: c.actif, montantN: n(c.montantN), montantN1: n(c.montantN1), montantN2: n(c.montantN2) }));

  return {
    caRows,
    achatsRows,
    achatsPonctuelsRows,
    commissionRows,
    reprisesRows,
    fournituresRows,
    servicesRows,
    impotsRows,
    salaireRows,
    dirigeantRows,
    cotisationsRows,
    taxesSalairesRows,
    dotationsParImmoData,
    dotParNature,
    dotCorporel,
    dotIncorporel,
    dotFinancier,
    interetsParEmprunt,
    fraisDossierParEmprunt,
    autresChargesFinRows,
    provisionsRows,
    chargesGestionRows,
    prodFinRows,
    prodExcepRows,
    chargesExcepRows,
  };
}
