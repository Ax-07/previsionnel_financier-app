import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { n } from "@/lib/finance/utils";
import type { YearKey4 } from "@/lib/finance/utils";
import type { FinCalcResult } from "./index";
import {
  seasonalMonthly,
  chargeExplMonthly,
  ponctuelMonthly,
  uniformMonthly,
  zeroSeries,
  sumSeries,
  computeStocksAchatsSeries,
  type MonthlySeries,
} from "@/lib/finance/calculs/monthly";
import { computeTVAMonthly } from "@/lib/finance/tva-engine";
import { salarieMonthlyBrut } from "@/lib/finance/tresorerie-engine";
import {
  simulerTresorerieUrssafSur3Ans,
  trouverBrutPourNet,
  detecterACRE,
  remuTNSBase,
} from "@/lib/calcul/taux-tns";
import type { RegimeSocial } from "@/lib/schemas/personnel";

type YearAcc4 = Record<YearKey4, number>;

/** Données d'une ligne achats matières, exposées pour le drill-down. */
export interface BfrAchatRow {
  libelle: string;
  /** Coefficient d'achat pré-calculé : Math.max(0, 1 − tauxMarge / 100) */
  coef: number;
  tvaAchats: number;
  joursStock: number;
  joursFournisseur: number;
  montantN: number;
  montantN1: number;
  montantN2: number;
  /** Stock initial ponctuel (somme des achats ponctuels N de l'activité) */
  stockPonctuelY0: number;
  /** Somme des achats ponctuels HT de l'exercice N (= y1) */
  ponctuelSommeY1: number;
  /** Somme des achats ponctuels HT de l'exercice N1 (= y2) */
  ponctuelSommeY2: number;
  /** Somme des achats ponctuels HT de l'exercice N2 (= y3) */
  ponctuelSommeY3: number;
  /**
   * Stock en fin d'exercice = dernier mois saisonnalisé × joursStock/30
   * Conforme §12.2 : encours au dernier mois réel, jamais montant_annuel × jours/360
   */
  m11StockY1: number;
  m11StockY2: number;
  m11StockY3: number;
  /**
   * Dette fournisseur en fin d'exercice = dernier mois saisonnalisé × joursFournisseur/30
   * Conforme §12.3 : cohérent avec le total dettes fournisseurs du moteur
   */
  m11FournY1: number;
  m11FournY2: number;
  m11FournY3: number;
}

/** Données d'une ligne charge externe, exposées pour le drill-down. */
export interface BfrChargeExtRow {
  libelle: string;
  montantN: number;
  montantN1: number;
  montantN2: number;
  delaiReglement: number;
  tauxTVA: number;
  /**
   * Dette charge externe en fin d'exercice = dernier mois série réelle × délai/30
   * Conforme §12.2 : cohérent avec le total dettesChargesExternes du moteur
   */
  m11ChargeY1: number;
  m11ChargeY2: number;
  m11ChargeY3: number;
}

export interface BfrCalcResult {
  // ── Besoins ──────────────────────────────────────────────────────────────
  stocksMatieres: YearAcc4;
  creditTVA: YearAcc4;
  creancesClients: YearAcc4;
  totalBesoins: YearAcc4;
  // ── Ressources ───────────────────────────────────────────────────────────
  dettesFournisseurs: YearAcc4;
  dettesChargesExternes: YearAcc4;
  dettesImpots: YearAcc4;
  dettesPersonnel: YearAcc4;
  tvaAPayer: YearAcc4;
  dettesIS: YearAcc4;
  totalRessources: YearAcc4;
  // ── BFR ──────────────────────────────────────────────────────────────────
  bfr: YearAcc4;
  variationBFR: YearAcc4;
  // ── Détail drill-down ────────────────────────────────────────────────────
  achatsRows: BfrAchatRow[];
  chargesExtRows: BfrChargeExtRow[];
}

/**
 * Source unique de vérité pour le calcul du BFR.
 *
 * Utilisée par l'action `fetchBfr` (tableau de contrôle BFR) ET par
 * `fetchPlanFinancement` (variation du BFR dans le plan de financement).
 * Toute modification de la logique BFR doit se faire ici.
 *
 * @param data  Données du scénario (fetchScenarioData)
 * @param fc    Résultat de buildFinCalc (impôts, charges personnel, IS)
 */
export function calcBfr(data: ScenarioFinData, fc: FinCalcResult): BfrCalcResult {
  const { isIS, activites, fournitures, services, immobilisations, scenario } = data;
  const actifsActifs = activites.filter((a) => a.actif !== false);
  const achatsActifsMois = actifsActifs.filter((a) => a.typeActivite !== "PRESTATION_SERVICES");
  const allChargesActif = [
    ...fournitures.filter((f) => f.actif !== false),
    ...services.filter((s) => s.actif !== false),
  ];

  // Périodicité TVA (cohérente avec l'onglet TVA et la trésorerie)
  const periodicite: "mensuel" | "trimestriel" =
    (scenario.parametres?.periodiciteDeclarationTVA ?? "mensuel") === "trimestriel"
      ? "trimestriel"
      : "mensuel";

  // Régime TVA — détermine si la TVA est récupérable sur les achats/charges.
  // Cohérent avec decaissements.ts (isFranchise dans TemporelCtx).
  const isFranchise = scenario.parametres?.regimeTVA === "FRANCHISE";

  // ── Achats matières (activités commerce / production) ───────────────────
  const achatsRows: BfrAchatRow[] = actifsActifs
    .filter((a) => a.typeActivite !== "PRESTATION_SERVICES")
    .map((a) => {
      const ponctuelRec = a.achatsStockPonctuel as Record<string, number[]> | undefined;
      const ponctuelN  = ponctuelRec?.N  ?? [];
      const ponctuelN1 = ponctuelRec?.N1 ?? [];
      const ponctuelN2 = ponctuelRec?.N2 ?? [];
      const sumArr = (arr: number[]) => arr.reduce((acc: number, v: number) => acc + v, 0);
      const coef = Math.max(0, 1 - n(a.tauxMarge) / 100);
      const joursStock = n(a.stocks ?? 0);
      const joursFournisseur = n(a.reglementFournisseurs ?? 30);
      const delaiFournMois = joursFournisseur / 30;
      // Séries mensuelles saisonnalisées (achats consommés HT)
      const sm1 = seasonalMonthly(n(a.montantN) * coef, a.saisonnaliteAchats, "N");
      const sm2 = seasonalMonthly(n(a.montantN1) * coef, a.saisonnaliteAchats, "N1");
      const sm3 = seasonalMonthly(n(a.montantN2) * coef, a.saisonnaliteAchats, "N2");
      // Achats ponctuels par mois
      const p1 = ponctuelMonthly(a.achatsStockPonctuel, "N");
      const p2 = ponctuelMonthly(a.achatsStockPonctuel, "N1");
      const p3 = ponctuelMonthly(a.achatsStockPonctuel, "N2");
      // Séries mensuelles cumulatives RCA (cohérentes avec monthly.ts)
      const rY1 = computeStocksAchatsSeries(sm1, p1, joursStock, 0);
      const rY2 = computeStocksAchatsSeries(sm2, p2, joursStock, rY1.sfFinal);
      const rY3 = computeStocksAchatsSeries(sm3, p3, joursStock, rY2.sfFinal);
      // coefTTC : identique à decaissements.ts (coefTVA = isFranchise ? 1 : 1 + tauxTVA)
      const coefTTC = isFranchise ? 1 : 1 + n(a.tvaAchats ?? 20) / 100;
      return {
        libelle: a.libelle,
        coef,
        tvaAchats: n(a.tvaAchats ?? 20),
        joursStock,
        joursFournisseur,
        montantN: n(a.montantN),
        montantN1: n(a.montantN1),
        montantN2: n(a.montantN2),
        stockPonctuelY0: ponctuelN[0] ?? 0,
        ponctuelSommeY1: sumArr(ponctuelN),
        ponctuelSommeY2: sumArr(ponctuelN1),
        ponctuelSommeY3: sumArr(ponctuelN2),
        // Stock fin d'exercice = dernier mois de la série cumulative RCA (= sfSeries[11])
        m11StockY1: rY1.sfFinal,
        m11StockY2: rY2.sfFinal,
        m11StockY3: rY3.sfFinal,
        // Dettes fournisseurs TTC : achatsEffectués_mois11 × coefTTC × délai
        // achatsEff[11] = conso[11] + sf[11] - si[11]  (= rYx.achatsEffSeries[11])
        m11FournY1: (rY1.achatsEffSeries[11] ?? 0) * coefTTC * delaiFournMois,
        m11FournY2: (rY2.achatsEffSeries[11] ?? 0) * coefTTC * delaiFournMois,
        m11FournY3: (rY3.achatsEffSeries[11] ?? 0) * coefTTC * delaiFournMois,
      };
    });

  // ── Stocks de matières en fin d'exercice ────────────────────────────────
  // Règle §4.6 + §12.2 : stockFin[y] = achatsConsommés_annuel[y] × joursStock / 360
  // Source : fc.stockFinal pré-calculé dans monthly.ts via la formule cumulative.
  // ✅ fc.stockFinal = dernier mois de la série cumulative RCA (sfSeries[11]) par exercice
  //    → niveau exact en clôture, cohérent avec monthly.ts et le bilan.
  //
  // Règle BFR initial : ponctuelN[0] est le stock initial ponctuel (mois de démarrage).
  const stockInitialPonctuel = actifsActifs
    .filter((a) => a.typeActivite !== "PRESTATION_SERVICES")
    .reduce((s, a) => {
      const ponctuelRec = a.achatsStockPonctuel as Record<string, number[]> | undefined;
      return s + (ponctuelRec?.N?.[0] ?? 0);
    }, 0);
  const stocksMatieres: YearAcc4 = {
    y0: stockInitialPonctuel,
    y1: fc.stockFinal.y1,
    y2: fc.stockFinal.y2,
    y3: fc.stockFinal.y3,
  };

  // ── Dettes fournisseurs (achats matières) ────────────────────────────────
  // Règle §12.3 : achatsEffectués_mois11 TTC × délai.
  // achatsEff[11] = conso[11] + sf[11] − si[11] (formule RCA cumulative, via computeStocksAchatsSeries)
  let dfY1 = 0, dfY2 = 0, dfY3 = 0;
  for (const a of achatsActifsMois) {
    const coef = Math.max(0, 1 - n(a.tauxMarge) / 100);
    const delaiMois = n(a.reglementFournisseurs ?? 30) / 30;
    const coefTTC = isFranchise ? 1 : 1 + n(a.tvaAchats ?? 20) / 100;
    const jours = n(a.stocks ?? 0);
    const m1 = seasonalMonthly(n(a.montantN) * coef, a.saisonnaliteAchats, "N");
    const m2 = seasonalMonthly(n(a.montantN1) * coef, a.saisonnaliteAchats, "N1");
    const m3 = seasonalMonthly(n(a.montantN2) * coef, a.saisonnaliteAchats, "N2");
    const p1 = ponctuelMonthly(a.achatsStockPonctuel, "N");
    const p2 = ponctuelMonthly(a.achatsStockPonctuel, "N1");
    const p3 = ponctuelMonthly(a.achatsStockPonctuel, "N2");
    // Série cumulative RCA — pour avoir achatsEff[11] exact
    const rY1 = computeStocksAchatsSeries(m1, p1, jours, 0);
    const rY2 = computeStocksAchatsSeries(m2, p2, jours, rY1.sfFinal);
    const rY3 = computeStocksAchatsSeries(m3, p3, jours, rY2.sfFinal);
    // Dette fournisseur = achatsEffectués_mois11 TTC × délai
    dfY1 += (rY1.achatsEffSeries[11] ?? 0) * coefTTC * delaiMois;
    dfY2 += (rY2.achatsEffSeries[11] ?? 0) * coefTTC * delaiMois;
    dfY3 += (rY3.achatsEffSeries[11] ?? 0) * coefTTC * delaiMois;
  }
  const dettesFournisseurs: YearAcc4 = { y0: 0, y1: dfY1, y2: dfY2, y3: dfY3 };

  // ── Charges externes (fournitures + services) ────────────────────────────
  const chargesExtRows: BfrChargeExtRow[] = [
    ...fournitures.filter((f) => f.actif !== false),
    ...services.filter((s) => s.actif !== false),
  ].map((c) => {
    const delaiMois = n(c.delaiReglement ?? 30) / 30;
    const coefTTC = isFranchise ? 1 : 1 + n(c.tauxTVA ?? 20) / 100;
    const cs1 = chargeExplMonthly(n(c.montantN), c, "N");
    const cs2 = chargeExplMonthly(n(c.montantN1), c, "N1");
    const cs3 = chargeExplMonthly(n(c.montantN2), c, "N2");
    return {
      libelle: c.libelle,
      montantN: n(c.montantN),
      montantN1: n(c.montantN1),
      montantN2: n(c.montantN2),
      delaiReglement: n(c.delaiReglement ?? 30),
      tauxTVA: n(c.tauxTVA ?? 20),
      // Dettes charges ext TTC : M12(HT) × coefTTC × délai — conforme §12.2
      // TTC cohérent avec buildChargeExt (decaissements.ts : coefTVA = isFranchise ? 1 : 1+taux)
      m11ChargeY1: (cs1[11] ?? 0) * coefTTC * delaiMois,
      m11ChargeY2: (cs2[11] ?? 0) * coefTTC * delaiMois,
      m11ChargeY3: (cs3[11] ?? 0) * coefTTC * delaiMois,
    };
  });

  // ── Charges externes : dettes TTC — M12(HT) × coefTTC × délai ─────────────
  // TTC pour cohérence avec buildChargeExt (decaissements.ts) qui décaisse TTC.
  // La composante TVA est en transit : déductible dès réception de la facture (creditTVA),
  // mais seulement payée au fournisseur après le délai → ressource BFR en TTC.
  let dceY1 = 0, dceY2 = 0, dceY3 = 0;
  for (const c of allChargesActif) {
    const delaiMois = n(c.delaiReglement ?? 30) / 30;
    const coefTTC = isFranchise ? 1 : 1 + n(c.tauxTVA ?? 20) / 100;
    const s1 = chargeExplMonthly(n(c.montantN), c, "N");
    const s2 = chargeExplMonthly(n(c.montantN1), c, "N1");
    const s3 = chargeExplMonthly(n(c.montantN2), c, "N2");
    dceY1 += (s1[11] ?? 0) * coefTTC * delaiMois;
    dceY2 += (s2[11] ?? 0) * coefTTC * delaiMois;
    dceY3 += (s3[11] ?? 0) * coefTTC * delaiMois;
  }
  const dettesChargesExternes: YearAcc4 = { y0: 0, y1: dceY1, y2: dceY2, y3: dceY3 };

  // ── TVA récupérable sur immobilisations (par exercice d'acquisition) ─────
  // Les acquisitions ≤ dateDemarrage partent en y0 (Initial).
  const tvaImmoDeductible: YearAcc4 = { y0: 0, y1: 0, y2: 0, y3: 0 };
  for (const immo of immobilisations) {
    if (immo.actif === false) continue;
    if (immo.typeTva !== "RECUPERABLE") continue;
    const tvaImmo = n(immo.montantHT) * (n(immo.tauxTVA) / 100);
    if (tvaImmo <= 0) continue;
    const dateAcq =
      immo.dateAcquisition instanceof Date
        ? immo.dateAcquisition
        : new Date(String(immo.dateAcquisition));
    const yk =
      (dateAcq <= data.dateDemarrage ? null : fc.toExerciceKey(dateAcq)) ?? "y0";
    tvaImmoDeductible[yk] += tvaImmo;
  }

  const creditInitial = tvaImmoDeductible.y0;

  // TVA sur stock initial (ponctuelN[0]) : position y0/ouverture identique au HT.
  // Elle n'entre PAS dans le moteur TVA Y1 (creditInitial inchangé) pour ne pas
  // annuler l'effet de la suppression du flux M01 — mais est ajoutée à creditTVA.y0
  // pour refléter la créance réelle sur le Trésor à l'ouverture de l'exercice.
  const tvaY0StockInit = isFranchise
    ? 0
    : achatsActifsMois.reduce((s, a) => {
        const taux = n(a.tvaAchats ?? 20) / 100;
        const ponctuelRec = a.achatsStockPonctuel as Record<string, number[]> | undefined;
        return s + (ponctuelRec?.N?.[0] ?? 0) * taux;
      }, 0);

  // ── Crédit TVA via computeTVAMonthly — source unique de vérité ────────────
  // Cohérent avec l'onglet TVA (build-rows.ts) et la trésorerie (decaissements.ts).
  // Les séries mensuelles tiennent compte de la saisonnalité et de la fréquence
  // des charges ; le report mensuel est exact pour les déclarants mensuels/trimestriels.

  const tvaCollMonthY1: MonthlySeries = actifsActifs.reduce(
    (s, a) => sumSeries(s, seasonalMonthly(n(a.montantN) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N")),
    zeroSeries(),
  );
  const tvaCollMonthY2: MonthlySeries = actifsActifs.reduce(
    (s, a) => sumSeries(s, seasonalMonthly(n(a.montantN1) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N1")),
    zeroSeries(),
  );
  const tvaCollMonthY3: MonthlySeries = actifsActifs.reduce(
    (s, a) => sumSeries(s, seasonalMonthly(n(a.montantN2) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N2")),
    zeroSeries(),
  );

  // Les ponctuels sont des montants HT d'achats (pas du CA) : on applique uniquement
  // le tauxTVA, sans le coef (qui sert à convertir du CA en achats).
  // La TVA déductible porte sur les achats effectués = consommés + ΔStock + ponctuels.
  // Règle BFR : ponctuelN[0] (stock initial y0) — sa TVA suit le même traitement que
  // le HT : position d'ouverture, exclue du flux Y1. Elle est ajoutée à creditTVA.y0.
  const tvaDedAchatsMonthY1: MonthlySeries = achatsActifsMois.reduce((s, a) => {
    const coef = Math.max(0, 1 - n(a.tauxMarge) / 100);
    const taux = n(a.tvaAchats ?? 20) / 100;
    const joursStk = n(a.stocks ?? 0);
    const varStock = (n(a.montantN) * coef * joursStk) / 360; // ΔStock Y1 (SI=0)
    const rec = seasonalMonthly(n(a.montantN) * coef * taux, a.saisonnaliteAchats, "N");
    const stockVar = uniformMonthly(varStock * taux); // TVA sur ΔStock
    const poncRaw = [...ponctuelMonthly(a.achatsStockPonctuel, "N")] as MonthlySeries;
    poncRaw[0] = 0; // ponctuelN[0] = stock initial y0 — TVA exclue du flux Y1
    const ponc = poncRaw.map((v: number) => v * taux) as MonthlySeries;
    return sumSeries(s, sumSeries(sumSeries(rec, stockVar), ponc));
  }, zeroSeries());
  const tvaDedAchatsMonthY2: MonthlySeries = achatsActifsMois.reduce((s, a) => {
    const coef = Math.max(0, 1 - n(a.tauxMarge) / 100);
    const taux = n(a.tvaAchats ?? 20) / 100;
    const joursStk = n(a.stocks ?? 0);
    const sfY1 = (n(a.montantN) * coef * joursStk) / 360;
    const varStock = (n(a.montantN1) * coef * joursStk) / 360 - sfY1; // ΔStock Y2
    const rec = seasonalMonthly(n(a.montantN1) * coef * taux, a.saisonnaliteAchats, "N1");
    const stockVar = uniformMonthly(varStock * taux); // TVA sur ΔStock
    const ponc = ponctuelMonthly(a.achatsStockPonctuel, "N1").map((v: number) => v * taux) as MonthlySeries;
    return sumSeries(s, sumSeries(sumSeries(rec, stockVar), ponc));
  }, zeroSeries());
  const tvaDedAchatsMonthY3: MonthlySeries = achatsActifsMois.reduce((s, a) => {
    const coef = Math.max(0, 1 - n(a.tauxMarge) / 100);
    const taux = n(a.tvaAchats ?? 20) / 100;
    const joursStk = n(a.stocks ?? 0);
    const sfY2 = (n(a.montantN1) * coef * joursStk) / 360;
    const varStock = (n(a.montantN2) * coef * joursStk) / 360 - sfY2; // ΔStock Y3
    const rec = seasonalMonthly(n(a.montantN2) * coef * taux, a.saisonnaliteAchats, "N2");
    const stockVar = uniformMonthly(varStock * taux); // TVA sur ΔStock
    const ponc = ponctuelMonthly(a.achatsStockPonctuel, "N2").map((v: number) => v * taux) as MonthlySeries;
    return sumSeries(s, sumSeries(sumSeries(rec, stockVar), ponc));
  }, zeroSeries());

  const tvaDedChargesMonthY1: MonthlySeries = allChargesActif.reduce(
    (s, c) => sumSeries(s, chargeExplMonthly(n(c.montantN) * (n(c.tauxTVA ?? 20) / 100), { frequence: c.frequence as string, detailCalc: c.detailCalc }, "N")),
    zeroSeries(),
  );
  const tvaDedChargesMonthY2: MonthlySeries = allChargesActif.reduce(
    (s, c) => sumSeries(s, chargeExplMonthly(n(c.montantN1) * (n(c.tauxTVA ?? 20) / 100), { frequence: c.frequence as string, detailCalc: c.detailCalc }, "N1")),
    zeroSeries(),
  );
  const tvaDedChargesMonthY3: MonthlySeries = allChargesActif.reduce(
    (s, c) => sumSeries(s, chargeExplMonthly(n(c.montantN2) * (n(c.tauxTVA ?? 20) / 100), { frequence: c.frequence as string, detailCalc: c.detailCalc }, "N2")),
    zeroSeries(),
  );

  // TVA déductible mensuelle immos (y1/y2/y3) — y0 = creditInitial ci-dessus
  const tvaImmoMonthY1 = zeroSeries();
  const tvaImmoMonthY2 = zeroSeries();
  const tvaImmoMonthY3 = zeroSeries();
  for (const immo of immobilisations) {
    if (immo.actif === false) continue;
    if (immo.typeTva !== "RECUPERABLE") continue;
    const tva = n(immo.montantHT) * (n(immo.tauxTVA) / 100);
    if (tva <= 0) continue;
    const dateAcq =
      immo.dateAcquisition instanceof Date
        ? immo.dateAcquisition
        : new Date(String(immo.dateAcquisition));
    if (dateAcq <= data.dateDemarrage) continue; // y0 — déjà dans creditInitial
    const yk = fc.toExerciceKey(dateAcq);
    if (yk === "y1") {
      const mi = Math.min(11, Math.max(0, (dateAcq.getFullYear() - fc.exBorne1.getFullYear()) * 12 + (dateAcq.getMonth() - fc.exBorne1.getMonth())));
      tvaImmoMonthY1[mi] = (tvaImmoMonthY1[mi] ?? 0) + tva;
    } else if (yk === "y2") {
      const mi = Math.min(11, Math.max(0, (dateAcq.getFullYear() - fc.exBorne2.getFullYear()) * 12 + (dateAcq.getMonth() - fc.exBorne2.getMonth())));
      tvaImmoMonthY2[mi] = (tvaImmoMonthY2[mi] ?? 0) + tva;
    } else if (yk === "y3") {
      const mi = Math.min(11, Math.max(0, (dateAcq.getFullYear() - fc.exBorne3.getFullYear()) * 12 + (dateAcq.getMonth() - fc.exBorne3.getMonth())));
      tvaImmoMonthY3[mi] = (tvaImmoMonthY3[mi] ?? 0) + tva;
    }
  }

  const tvaM1 = computeTVAMonthly(
    tvaCollMonthY1,
    sumSeries(sumSeries(tvaDedAchatsMonthY1, tvaDedChargesMonthY1), tvaImmoMonthY1),
    periodicite,
    creditInitial,
  );
  const tvaM2 = computeTVAMonthly(
    tvaCollMonthY2,
    sumSeries(sumSeries(tvaDedAchatsMonthY2, tvaDedChargesMonthY2), tvaImmoMonthY2),
    periodicite,
    tvaM1.finalCredit,
  );
  const tvaM3 = computeTVAMonthly(
    tvaCollMonthY3,
    sumSeries(sumSeries(tvaDedAchatsMonthY3, tvaDedChargesMonthY3), tvaImmoMonthY3),
    periodicite,
    tvaM2.finalCredit,
  );

  // Crédit TVA = solde de créance sur le Trésor en fin d'exercice (besoin BFR)
  // y0 : TVA récupérable sur immos acquises ≤ dateDemarrage + TVA sur stock initial (y0)
  // y1/y2/y3 : crédit résiduel à la clôture de chaque exercice (finalCredit du moteur TVA)
  const creditTVA: YearAcc4 = {
    y0: creditInitial + tvaY0StockInit,
    y1: tvaM1.finalCredit,
    y2: tvaM2.finalCredit,
    y3: tvaM3.finalCredit,
  };

  // TVA à payer = dernier mois de la série TVA réelle (règle dernier mois — §12.2)
  // Pour déclarant mensuel : TVA de décembre (à payer en janvier → encours fin d'exercice).
  // Pour déclarant trimestriel : TVA accumulée sur T4 (mois 9-11, payée début janvier).
  const tvaAPayer: YearAcc4 = {
    y0: 0,
    y1: tvaM1.tvaAPayerMonthly[11] ?? 0,
    y2: tvaM2.tvaAPayerMonthly[11] ?? 0,
    y3: tvaM3.tvaAPayerMonthly[11] ?? 0,
  };

  // ── Dettes fiscales et sociales ──────────────────────────────────────────
  // Si l'impôt a une date précise (dateN), il est payé au mois exact dans le
  // tableau → aucune dette résiduelle en fin d'exercice.
  // Si pas de date → lissage uniforme → 1 mois d'encours (montant / 12).
  let diY1 = 0, diY2 = 0, diY3 = 0;
  for (const impot of data.impotsTaxes.filter((i) => i.actif !== false)) {
    if (!impot.dateN)  diY1 += n(impot.montantN  ?? 0) / 12;
    if (!impot.dateN1) diY2 += n(impot.montantN1 ?? 0) / 12;
    if (!impot.dateN2) diY3 += n(impot.montantN2 ?? 0) / 12;
  }
  const dettesImpots: YearAcc4 = { y0: 0, y1: diY1, y2: diY2, y3: diY3 };

  // Dettes personnel : encours en fin d'exercice dépend du délai de paiement.
  // Convention RCA : 0=mois courant (M), 1=M+1, 2=M+2, 3=M+3.
  // Si paiement en mois courant (delay=0), tout est payé dans le mois → aucune
  // dette résiduelle à la clôture. Si delay=1, le mois 12 (décembre) est encore dû.
  // Si delay=2, les mois 11 et 12 sont encore dus, etc.
  // Cohérent avec shiftYk3(series, moisPaiementSalaires) dans decaissements.ts.
  const moisDebutBfr = fc.moisDebut;
  const delaiPaie = Math.max(0, n(data.scenario.parametres?.moisPaiementSalaires ?? 1));

  /** Somme des derniers `delay` mois d'une série mensuelle (encours fin d'exercice). */
  function sumLastMonths(series: MonthlySeries, delay: number): number {
    if (delay <= 0) return 0;
    let acc = 0;
    for (let i = Math.max(0, 12 - delay); i < 12; i++) acc += series[i] ?? 0;
    return acc;
  }

  let lastPersonnelY1 = 0, lastPersonnelY2 = 0, lastPersonnelY3 = 0;

  for (const sal of data.salaries ?? []) {
    const tCotPat = n(sal.tauxCotPat) / 100;
    const b1 = salarieMonthlyBrut(n(sal.montantN), sal.detailMensuelN, moisDebutBfr);
    const b2 = salarieMonthlyBrut(n(sal.montantN1), sal.detailMensuelN1, moisDebutBfr);
    const b3 = salarieMonthlyBrut(n(sal.montantN2), sal.detailMensuelN2, moisDebutBfr);
    // Coût total employeur = brut × (1 + tCotPat) — les cotisations salariales
    // sont reversées à l'organisme par l'employeur donc comptent dans la dette.
    lastPersonnelY1 += sumLastMonths(b1, delaiPaie) * (1 + tCotPat);
    lastPersonnelY2 += sumLastMonths(b2, delaiPaie) * (1 + tCotPat);
    lastPersonnelY3 += sumLastMonths(b3, delaiPaie) * (1 + tCotPat);
  }

  for (const d of data.dirigeants ?? []) {
    const b1 = salarieMonthlyBrut(n(d.montantN), d.detailMensuelN, moisDebutBfr);
    const b2 = salarieMonthlyBrut(n(d.montantN1), d.detailMensuelN1, moisDebutBfr);
    const b3 = salarieMonthlyBrut(n(d.montantN2), d.detailMensuelN2, moisDebutBfr);
    lastPersonnelY1 += sumLastMonths(b1, delaiPaie);
    lastPersonnelY2 += sumLastMonths(b2, delaiPaie);
    lastPersonnelY3 += sumLastMonths(b3, delaiPaie);
  }

  // TNS : calcul de la dette URSSAF en fin d'exercice selon le mode de calcul.
  const tnsModeCalcul = data.scenario.parametres?.tnsModeCalcul ?? "DEFINITIF";
  const tnsActifs = (data.cotisationsTNS ?? []).filter((c) => c.actif !== false);
  const tnsDefY1 = tnsActifs.reduce((s, c) => s + n(c.montantN), 0);
  const tnsDefY2 = tnsActifs.reduce((s, c) => s + n(c.montantN1), 0);
  const tnsDefY3 = tnsActifs.reduce((s, c) => s + n(c.montantN2), 0);

  // Séparation URSSAF obligatoires (calcAuto=true) / facultatives (calcAuto=false, ex. Madelin)
  // Utilisée en mode DEBUT_ACTIVITE_FORFAIT pour éviter de gonfler la dette de régularisation URSSAF
  // avec des montants qui ne passent pas par l'URSSAF (cotisations facultatives).
  const tnsUrssafActifs = tnsActifs.filter((c) => c.calcAuto);
  const tnsFacActifs    = tnsActifs.filter((c) => !c.calcAuto);
  const tnsUrssafY1 = tnsUrssafActifs.reduce((s, c) => s + n(c.montantN), 0);
  const tnsUrssafY2 = tnsUrssafActifs.reduce((s, c) => s + n(c.montantN1), 0);
  const tnsUrssafY3 = tnsUrssafActifs.reduce((s, c) => s + n(c.montantN2), 0);
  const tnsFacY1 = tnsFacActifs.reduce((s, c) => s + n(c.montantN), 0);
  const tnsFacY2 = tnsFacActifs.reduce((s, c) => s + n(c.montantN1), 0);
  const tnsFacY3 = tnsFacActifs.reduce((s, c) => s + n(c.montantN2), 0);

  if (tnsModeCalcul === "DEBUT_ACTIVITE_FORFAIT" && (data.dirigeants ?? []).filter((d) => d.actif !== false).length > 0) {
    // En mode « Début d'activité forfait » :
    // La charge comptable (CR) = montants DEFINITIFS.
    // L'URSSAF encaisse des appels PROVISIONNELS (forfait) pendant l'exercice,
    // puis réclame la régularisation l'exercice suivant.
    // → Dette URSSAF au bilan = DEFINITIF_annuel - forfait_provisoire_payé_dans_l'année
    //   = montant de la régularisation à payer à l'URSSAF l'année suivante.
    const regime = (data.scenario.parametres?.tnsRegimeSocial ?? "commerce") as RegimeSocial;
    const tnsDir = (data.dirigeants ?? [])
      .filter((d) => d.actif !== false)
      .map((d) => ({
        actif: d.actif,
        montantN: n(d.montantN),
        montantN1: n(d.montantN1),
        montantN2: n(d.montantN2),
        tauxFixe: n(d.tauxFixe),
        exonerationTNS: d.exonerationTNS ?? undefined,
      }));
    const { remuN, remuN1, remuN2 } = remuTNSBase(tnsDir);
    const acreN = detecterACRE(tnsDir);
    const brutN  = trouverBrutPourNet(remuN,  regime, acreN,  { mode: "DEFINITIF" }).brut;
    const brutN1 = trouverBrutPourNet(remuN1, regime, false, { mode: "DEFINITIF" }).brut;
    const brutN2 = trouverBrutPourNet(remuN2, regime, false, { mode: "DEFINITIF" }).brut;
    const treso = simulerTresorerieUrssafSur3Ans({ brutN, brutN1, brutN2, regime, acreN });
    // Dette URSSAF = régularisation future + dernier délaiPaie mois de cash en transit.
    //
    // Formule par exercice i :
    //   dettes_i = max(0, DEFINITIF_i - PROVISIONNEL_i) + totalPaye_i / 12 × delaiPaie
    //
    // • DEFINITIF_i - PROVISIONNEL_i  = régularisation due à l'URSSAF l'exercice suivant.
    //   provN = totalPaye_i - regularisation_i (= appels provisionnels seuls, sans régul précédente).
    //   Note : treso[0].regularisation = 0 (pas de régul l'année 1).
    //
    // • totalPaye_i / 12 × delaiPaie = transit (cotisations du dernier mois non encore décaissées).
    //   Cohérent avec shiftYk3(uniformMonthly(totalPaye), delaiPaie) dans decaissements.ts.
    //
    // Cette formule préserve l'égalité trésorerie-bilan = solde-tableau pour les 3 exercices.
    const provN  = treso[0].totalPaye;                               // = forfN (regularisation = 0)
    const provN1 = treso[1].totalPaye - treso[1].regularisation;     // = forfN1 seul
    const provN2 = treso[2].totalPaye - treso[2].regularisation;     // = provisionnelN2

    // URSSAF obligatoires : régularisation de fin d'exercice + transit en cours de paiement
    lastPersonnelY1 += Math.max(0, tnsUrssafY1 - provN)  + treso[0].totalPaye / 12 * delaiPaie;
    lastPersonnelY2 += Math.max(0, tnsUrssafY2 - provN1) + treso[1].totalPaye / 12 * delaiPaie;
    lastPersonnelY3 += Math.max(0, tnsUrssafY3 - provN2) + treso[2].totalPaye / 12 * delaiPaie;
    // Cotisations facultatives (Madelin etc.) : traitement DEFINITIF (encours mensuel uniforme)
    lastPersonnelY1 += tnsFacY1 / 12 * delaiPaie;
    lastPersonnelY2 += tnsFacY2 / 12 * delaiPaie;
    lastPersonnelY3 += tnsFacY3 / 12 * delaiPaie;
  } else {
    // Mode DEFINITIF : encours de paiement standard — derniers délaiPaie mois d'appels uniformes.
    // Si paiement mois courant (delay=0), aucune dette en fin d'exercice.
    lastPersonnelY1 += tnsDefY1 / 12 * delaiPaie;
    lastPersonnelY2 += tnsDefY2 / 12 * delaiPaie;
    lastPersonnelY3 += tnsDefY3 / 12 * delaiPaie;
  }

  // Taxes sur salaires : si date précise → déjà payée avant clôture → 0 ; sinon encours × delay
  for (const taxe of data.taxesSalaires ?? []) {
    if (!taxe.dateN) lastPersonnelY1 += n(taxe.montantN) / 12 * delaiPaie;
    if (!taxe.dateN1) lastPersonnelY2 += n(taxe.montantN1) / 12 * delaiPaie;
    if (!taxe.dateN2) lastPersonnelY3 += n(taxe.montantN2) / 12 * delaiPaie;
  }

  const dettesPersonnel: YearAcc4 = {
    y0: 0,
    y1: lastPersonnelY1,
    y2: lastPersonnelY2,
    y3: lastPersonnelY3,
  };

  // IS : acomptes trimestriels — encours 1 trimestre
  const dettesIS: YearAcc4 = {
    y0: 0,
    y1: fc.isParAnnee.y1 / 4,
    y2: fc.isParAnnee.y2 / 4,
    y3: fc.isParAnnee.y3 / 4,
  };

  // ── Créances clients (cash immobilisé en attente de paiement) ─────────────
  // Règle §12.3 : créancesClients[y] = CA_TTC[y][11] × (délaiClients / 30)
  // Toujours utiliser le dernier mois saisonnalisé (index 11), jamais montant_annuel × delai/360.
  // Pour les sociétés franchiséees TVA : tauxTVA = 0 → coefTTC = 1, créances = CA HT.
  const creancesClients: YearAcc4 = { y0: 0, y1: 0, y2: 0, y3: 0 };
  for (const a of actifsActifs) {
    // isFranchise : pas de TVA collectée → créances = HT uniquement (cohérent avec encaissements.ts)
    const coefTTC = isFranchise ? 1 : 1 + n(a.tauxTVA) / 100;
    const delaiMois = n(a.reglementClients ?? 30) / 30;
    const s1 = seasonalMonthly(n(a.montantN), a.saisonnaliteCA, "N");
    const s2 = seasonalMonthly(n(a.montantN1), a.saisonnaliteCA, "N1");
    const s3 = seasonalMonthly(n(a.montantN2), a.saisonnaliteCA, "N2");
    creancesClients.y1 += (s1[11] ?? 0) * coefTTC * delaiMois;
    creancesClients.y2 += (s2[11] ?? 0) * coefTTC * delaiMois;
    creancesClients.y3 += (s3[11] ?? 0) * coefTTC * delaiMois;
  }

  // ── Totaux BFR ───────────────────────────────────────────────────────────
  const totalBesoins: YearAcc4 = {
    y0: stocksMatieres.y0 + creditTVA.y0,
    y1: stocksMatieres.y1 + creditTVA.y1 + creancesClients.y1,
    y2: stocksMatieres.y2 + creditTVA.y2 + creancesClients.y2,
    y3: stocksMatieres.y3 + creditTVA.y3 + creancesClients.y3,
  };

  const totalRessources: YearAcc4 = {
    y0:
      dettesFournisseurs.y0 +
      dettesChargesExternes.y0 +
      dettesImpots.y0 +
      dettesPersonnel.y0 +
      tvaAPayer.y0 +
      (isIS ? dettesIS.y0 : 0),
    y1:
      dettesFournisseurs.y1 +
      dettesChargesExternes.y1 +
      dettesImpots.y1 +
      dettesPersonnel.y1 +
      tvaAPayer.y1 +
      (isIS ? dettesIS.y1 : 0),
    y2:
      dettesFournisseurs.y2 +
      dettesChargesExternes.y2 +
      dettesImpots.y2 +
      dettesPersonnel.y2 +
      tvaAPayer.y2 +
      (isIS ? dettesIS.y2 : 0),
    y3:
      dettesFournisseurs.y3 +
      dettesChargesExternes.y3 +
      dettesImpots.y3 +
      dettesPersonnel.y3 +
      tvaAPayer.y3 +
      (isIS ? dettesIS.y3 : 0),
  };

  const bfr: YearAcc4 = {
    y0: totalBesoins.y0 - totalRessources.y0,
    y1: totalBesoins.y1 - totalRessources.y1,
    y2: totalBesoins.y2 - totalRessources.y2,
    y3: totalBesoins.y3 - totalRessources.y3,
  };

  // Variation : y0 = BFR initial, y1-y3 = incréments annuels (delta par rapport à la période précédente)
  // y1 = bfr.y1 - bfr.y0 : accroissement entre le BFR initial et la fin de l'exercice 1
  // (cohérent avec y2 = bfr.y2 - bfr.y1 et y3 = bfr.y3 - bfr.y2)
  const variationBFR: YearAcc4 = {
    y0: bfr.y0,
    y1: bfr.y1 - bfr.y0,
    y2: bfr.y2 - bfr.y1,
    y3: bfr.y3 - bfr.y2,
  };

  return {
    stocksMatieres,
    creditTVA,
    creancesClients,
    tvaAPayer,
    dettesFournisseurs,
    dettesChargesExternes,
    dettesImpots,
    dettesPersonnel,
    dettesIS,
    totalBesoins,
    totalRessources,
    bfr,
    variationBFR,
    achatsRows,
    chargesExtRows,
  };
}
