"use server";

import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { buildFinCalc } from "@/lib/finance/calculs";
import { n } from "@/lib/finance/utils";
import type { YearKey } from "@/lib/finance/utils";
import {
  type MonthlySeries,
  zeroSeries,
  sumSeries,
  subSeries,
  sumAll,
  totalOf,
  uniformMonthly,
  seasonalMonthly,
  buildMonthLabels,
} from "@/lib/finance/calculs/monthly";
import { computeTVAMonthly } from "@/lib/finance/tva-engine";
import {
  parseDetailMensuel,
  salarieMonthlyBrut,
  shiftSeries,
  shiftSeriesWeighted,
  computeSoldeMonthly,
  isQuarterly,
} from "@/lib/finance/tresorerie-engine";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TresorerieValue {
  months: MonthlySeries;
  total: number;
}

export type TresorerieRowStyle =
  | "normal"     // ligne de détail
  | "indent"     // sous-ligne (enfant)
  | "section"    // en-tête de section (bandeau)
  | "subtotal"   // sous-total
  | "result"     // résultat intermédiaire clé
  | "highlight"; // solde final mis en avant

export interface TresorerieRow {
  key: string;
  label: string;
  style: TresorerieRowStyle;
  /** true → total = valeur M12 au lieu de la somme */
  totalIsEndValue?: boolean;
  values: Record<YearKey, TresorerieValue>;
  hideIfZero?: boolean;
  /** Sous-lignes dépliables */
  children?: TresorerieRow[];
  /** Replié par défaut */
  defaultCollapsed?: boolean;
}

export interface TresorerieData {
  yearLabels: Record<YearKey, string>;
  monthLabels: Record<YearKey, string[]>;
  rows: TresorerieRow[];
}

// ── Helpers locaux (spécifiques tresorerie.ts) ─────────────────────────────────

type Yk3 = Record<YearKey, MonthlySeries>;

function tresoValue(months: MonthlySeries, endValue?: boolean): TresorerieValue {
  return {
    months,
    total: endValue ? (months[11] ?? 0) : months.reduce((a, b) => a + b, 0),
  };
}

function mkRow(
  key: string,
  label: string,
  style: TresorerieRowStyle,
  vals: Yk3,
  options?: {
    hideIfZero?: boolean;
    totalIsEndValue?: boolean;
    children?: TresorerieRow[];
    defaultCollapsed?: boolean;
  },
): TresorerieRow {
  return {
    key,
    label,
    style,
    hideIfZero: options?.hideIfZero,
    totalIsEndValue: options?.totalIsEndValue,
    children: options?.children,
    defaultCollapsed: options?.defaultCollapsed,
    values: {
      y1: tresoValue(vals.y1, options?.totalIsEndValue),
      y2: tresoValue(vals.y2, options?.totalIsEndValue),
      y3: tresoValue(vals.y3, options?.totalIsEndValue),
    },
  };
}

function sectionRow(key: string, label: string): TresorerieRow {
  const zero = zeroSeries();
  return mkRow(key, label, "section", { y1: zero, y2: zero, y3: zero });
}

// ── Server Action ─────────────────────────────────────────────────────────────

export async function fetchTresorerie(
  dossierId: string,
  moisPaiementSalaires = 0,
  preloadedData?: ScenarioFinData,
): Promise<TresorerieData> {
  // ── 1. Dossier ────────────────────────────────────────────────────────────
  const data = preloadedData ?? await fetchScenarioData(dossierId);
  const {
    dateDemarrage: dateDemarrageDate,
    isIS,
    scenario,
    apports,
    subventions,
    emprunts,
    immobilisations,
    activites,
    fournitures,
    services,
    impotsTaxes,
    salaries,
    dirigeants,
    cotisationsTNS,
    taxesSalaires,
    parametresIS,
    subventionsExploitation,
    diversEncaissements,
    diversDecaissements,
    diversRemboursementsCC,
  } = data;
  const regimeTVA = scenario.parametres?.regimeTVA ?? "REEL_NORMAL";
  const isFranchise = regimeTVA === "FRANCHISE";
  const periodicite: "mensuel" | "trimestriel" =
    (scenario.parametres?.periodiciteDeclarationTVA ?? "mensuel") === "trimestriel"
      ? "trimestriel"
      : "mensuel";
  const defaultDelaiClients = 30; // jours
  const defaultDelaiFourn = 30;   // jours
  const anneeDebut = dateDemarrageDate.getFullYear();
  const moisDebut = dateDemarrageDate.getMonth(); // 0-based

  const yearLabels: Record<YearKey, string> = {
    y1: `${anneeDebut}`,
    y2: `${anneeDebut + 1}`,
    y3: `${anneeDebut + 2}`,
  };

  const monthLabels: Record<YearKey, string[]> = {
    y1: buildMonthLabels(moisDebut, anneeDebut),
    y2: buildMonthLabels(moisDebut, anneeDebut + 1),
    y3: buildMonthLabels(moisDebut, anneeDebut + 2),
  };

  // ── 2. Scénario ───────────────────────────────────────────────────────────

  // ── 4. Helper : date → exercice / mois ───────────────────────────────────
  const yearStarts = [
    new Date(anneeDebut, moisDebut, 1),
    new Date(anneeDebut + 1, moisDebut, 1),
    new Date(anneeDebut + 2, moisDebut, 1),
    new Date(anneeDebut + 3, moisDebut, 1),
  ] as const;
  const YKS: YearKey[] = ["y1", "y2", "y3"];

  function dateToSlot(d: Date): { yk: YearKey | null; mi: number } {
    for (let i = 0; i < 3; i++) {
      if (d >= yearStarts[i] && d < yearStarts[i + 1]!) {
        const dy = d.getFullYear() - yearStarts[i]!.getFullYear();
        const dm = d.getMonth() - yearStarts[i]!.getMonth();
        return {
          yk: YKS[i]!,
          mi: Math.min(11, Math.max(0, dy * 12 + dm)),
        };
      }
    }
    return { yk: null, mi: -1 };
  }

  function addToSeries(series: Yk3, date: Date, amount: number): void {
    const { yk, mi } = dateToSlot(date);
    if (yk && mi >= 0) series[yk][mi] = (series[yk][mi] ?? 0) + amount;
  }

  // ── 5. ENCAISSEMENTS ─────────────────────────────────────────────────────

  // 5.1 Apports en capital et comptes courants
  const encApportsCapital: Yk3 = {
    y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries(),
  };
  const encApportsCC: Yk3 = {
    y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries(),
  };

  for (const apport of apports) {
    const amt = n(apport.montant);
    const date = new Date(apport.dateApport);
    if (
      apport.type === "CAPITAL" ||
      apport.type === "APPORT_NATURE"
    ) {
      addToSeries(encApportsCapital, date, amt);
    } else if (apport.type === "COMPTE_COURANT") {
      addToSeries(encApportsCC, date, amt);
    }
  }
  for (const subv of subventions) {
    if (subv.type !== "PRET_HONNEUR") continue;
    const d = subv.dateEncaissement ?? subv.dateObtention;
    if (d) addToSeries(encApportsCC, new Date(d), n(subv.montant));
  }

  // 5.2 Déblocages emprunts
  const encEmprunts: Yk3 = {
    y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries(),
  };
  for (const emprunt of emprunts) {
    addToSeries(encEmprunts, new Date(emprunt.dateDéblocage), n(emprunt.montant));
  }

  // 5.3 Production vendue TTC (avec décalage client) — par activité
  const activitesEncData = activites.map((act) => {
    const coefTTC = isFranchise ? 1 : 1 + n(act.tauxTVA) / 100;
    const delaiMois = n(act.reglementClients ?? defaultDelaiClients) / 30;
    const r1 = seasonalMonthly(n(act.montantN) * coefTTC, act.saisonnaliteCA, "N");
    const r2 = seasonalMonthly(n(act.montantN1) * coefTTC, act.saisonnaliteCA, "N1");
    const r3 = seasonalMonthly(n(act.montantN2) * coefTTC, act.saisonnaliteCA, "N2");
    if (delaiMois <= 0) return { act, yk3: { y1: r1, y2: r2, y3: r3 } as Yk3 };
    const { shifted: s1, overflow: ov1 } = shiftSeriesWeighted(r1, delaiMois);
    const { shifted: s2, overflow: ov2 } = shiftSeriesWeighted(r2, delaiMois, ov1);
    const { shifted: s3 } = shiftSeriesWeighted(r3, delaiMois, ov2);
    return { act, yk3: { y1: s1, y2: s2, y3: s3 } as Yk3 };
  });
  const encProdVendue: Yk3 = {
    y1: activitesEncData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y1), zeroSeries()),
    y2: activitesEncData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y2), zeroSeries()),
    y3: activitesEncData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y3), zeroSeries()),
  };

  // 5.4 Subventions d'exploitation
  const encSubvExpl: Yk3 = {
    y1: uniformMonthly(
      subventionsExploitation.reduce((s, sv) => s + n(sv.montantN), 0),
    ),
    y2: uniformMonthly(
      subventionsExploitation.reduce((s, sv) => s + n(sv.montantN1), 0),
    ),
    y3: uniformMonthly(
      subventionsExploitation.reduce((s, sv) => s + n(sv.montantN2), 0),
    ),
  };

  // 5.5 Subventions d'investissement (par date)
  const encSubvInvest: Yk3 = {
    y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries(),
  };
  for (const subv of subventions) {
    if (subv.type === "PRET_HONNEUR") continue;
    const d = subv.dateEncaissement ?? subv.dateObtention;
    if (d) addToSeries(encSubvInvest, new Date(d), n(subv.montant));
  }

  // 5.6 Encaissements divers
  const encDivers: Yk3 = {
    y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries(),
  };
  for (const flux of diversEncaissements) {
    if (flux.dateN) addToSeries(encDivers, new Date(flux.dateN), n(flux.montantN));
    else encDivers.y1 = sumSeries(encDivers.y1, uniformMonthly(n(flux.montantN)));
    if (flux.dateN1) addToSeries(encDivers, new Date(flux.dateN1), n(flux.montantN1));
    else encDivers.y2 = sumSeries(encDivers.y2, uniformMonthly(n(flux.montantN1)));
    if (flux.dateN2) addToSeries(encDivers, new Date(flux.dateN2), n(flux.montantN2));
    else encDivers.y3 = sumSeries(encDivers.y3, uniformMonthly(n(flux.montantN2)));
  }

  // Total encaissements
  const totalEnc: Yk3 = {
    y1: sumAll(
      encApportsCapital.y1, encApportsCC.y1, encEmprunts.y1,
      encProdVendue.y1, encSubvExpl.y1, encSubvInvest.y1, encDivers.y1,
    ),
    y2: sumAll(
      encApportsCapital.y2, encApportsCC.y2, encEmprunts.y2,
      encProdVendue.y2, encSubvExpl.y2, encSubvInvest.y2, encDivers.y2,
    ),
    y3: sumAll(
      encApportsCapital.y3, encApportsCC.y3, encEmprunts.y3,
      encProdVendue.y3, encSubvExpl.y3, encSubvInvest.y3, encDivers.y3,
    ),
  };

  // ── 6. DÉCAISSEMENTS ─────────────────────────────────────────────────────

  // 6.1 Immobilisations HT (par date) — par immobilisation
  const immosData = immobilisations.map((immo) => {
    const yk3: Yk3 = { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() };
    addToSeries(yk3, new Date(immo.dateAcquisition), n(immo.montantHT));
    return { immo, yk3 };
  });
  // Sous-groupes par nature
  const immosParNature = {
    CORPOREL:   immosData.filter(({ immo }) => immo.nature === "CORPOREL"),
    INCORPOREL: immosData.filter(({ immo }) => immo.nature === "INCORPOREL"),
    FINANCIER:  immosData.filter(({ immo }) => immo.nature === "FINANCIER"),
  } as const;
  function sumImmosGroup(group: typeof immosData): Yk3 {
    return {
      y1: group.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y1), zeroSeries()),
      y2: group.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y2), zeroSeries()),
      y3: group.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y3), zeroSeries()),
    };
  }
  const decImmoCorporel   = sumImmosGroup(immosParNature.CORPOREL);
  const decImmoIncorporel = sumImmosGroup(immosParNature.INCORPOREL);
  const decImmoFinancier  = sumImmosGroup(immosParNature.FINANCIER);
  const decImmoHT: Yk3 = {
    y1: sumAll(decImmoCorporel.y1, decImmoIncorporel.y1, decImmoFinancier.y1),
    y2: sumAll(decImmoCorporel.y2, decImmoIncorporel.y2, decImmoFinancier.y2),
    y3: sumAll(decImmoCorporel.y3, decImmoIncorporel.y3, decImmoFinancier.y3),
  };

  // 6.2 Échéances d'emprunts : capital et intérêts séparés
  const decCapital: Yk3 = {
    y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries(),
  };
  const decInterets: Yk3 = {
    y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries(),
  };
  for (const emprunt of emprunts) {
    for (const ligne of emprunt.lignesEcheancier) {
      const date = new Date(ligne.dateEcheance);
      addToSeries(decCapital, date, n(ligne.capitalRembourse));
      addToSeries(
        decInterets,
        date,
        n(ligne.interesMois) + n(ligne.assuranceMois),
      );
    }
  }
  const decEmprunts: Yk3 = {
    y1: sumSeries(decCapital.y1, decInterets.y1),
    y2: sumSeries(decCapital.y2, decInterets.y2),
    y3: sumSeries(decCapital.y3, decInterets.y3),
  };

  // 6.3 Achats TTC (avec délai fournisseur) — par activité
  const activitesAchatData = activites
    .filter((act) => act.typeActivite !== "PRESTATION_SERVICES")
    .map((act) => {
      const coef = Math.max(0, 1 - n(act.tauxMarge) / 100);
      const coefTVA = isFranchise ? 1 : 1 + n(act.tvaAchats ?? 20) / 100;
      const delaiMois = n(act.reglementFournisseurs ?? defaultDelaiFourn) / 30;
      const r1 = seasonalMonthly(n(act.montantN) * coef * coefTVA, act.saisonnaliteAchats, "N");
      const r2 = seasonalMonthly(n(act.montantN1) * coef * coefTVA, act.saisonnaliteAchats, "N1");
      const r3 = seasonalMonthly(n(act.montantN2) * coef * coefTVA, act.saisonnaliteAchats, "N2");
      if (delaiMois <= 0) return { act, yk3: { y1: r1, y2: r2, y3: r3 } as Yk3 };
      const { shifted: s1, overflow: ov1 } = shiftSeriesWeighted(r1, delaiMois);
      const { shifted: s2, overflow: ov2 } = shiftSeriesWeighted(r2, delaiMois, ov1);
      const { shifted: s3 } = shiftSeriesWeighted(r3, delaiMois, ov2);
      return { act, yk3: { y1: s1, y2: s2, y3: s3 } as Yk3 };
    });
  // Série brute HT pour les encours fournisseurs
  const decAchatsRaw: Yk3 = {
    y1: activites.filter((a) => a.typeActivite !== "PRESTATION_SERVICES")
      .reduce((acc, a) => sumSeries(acc, seasonalMonthly(n(a.montantN) * Math.max(0, 1 - n(a.tauxMarge) / 100), a.saisonnaliteAchats, "N")), zeroSeries()),
    y2: activites.filter((a) => a.typeActivite !== "PRESTATION_SERVICES")
      .reduce((acc, a) => sumSeries(acc, seasonalMonthly(n(a.montantN1) * Math.max(0, 1 - n(a.tauxMarge) / 100), a.saisonnaliteAchats, "N1")), zeroSeries()),
    y3: activites.filter((a) => a.typeActivite !== "PRESTATION_SERVICES")
      .reduce((acc, a) => sumSeries(acc, seasonalMonthly(n(a.montantN2) * Math.max(0, 1 - n(a.tauxMarge) / 100), a.saisonnaliteAchats, "N2")), zeroSeries()),
  };
  const decAchats: Yk3 = {
    y1: activitesAchatData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y1), zeroSeries()),
    y2: activitesAchatData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y2), zeroSeries()),
    y3: activitesAchatData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y3), zeroSeries()),
  };

  // 6.4 Charges externes TTC : par charge, avec fréquence de règlement

  /** Distribue un montant annuel selon la fréquence de règlement saisie */
  function buildFrequenceSeries(annualAmount: number, frequence: string): MonthlySeries {
    switch (frequence) {
      case "TRIMESTRIELLE": {
        const s = zeroSeries();
        const q = annualAmount / 4;
        // Fin de trimestre : M3, M6, M9, M12 (indices 2, 5, 8, 11)
        s[2] = q; s[5] = q; s[8] = q; s[11] = q;
        return s;
      }
      case "SEMESTRIELLE": {
        const s = zeroSeries();
        const h = annualAmount / 2;
        // Fin de semestre : M6, M12 (indices 5, 11)
        s[5] = h; s[11] = h;
        return s;
      }
      case "ANNUELLE": {
        const s = zeroSeries();
        // Fin d'exercice : M12 (indice 11)
        s[11] = annualAmount;
        return s;
      }
      case "MENSUELLE":
      case "PERSONNALISEE":
      default:
        return uniformMonthly(annualAmount);
    }
  }

  /** Calcule les décaissements TTC d'une charge externe unique (délai + fréquence) */
  function buildChargeExt(charge: typeof fournitures[number]): Yk3 {
    const coefTVA = isFranchise ? 1 : 1 + n(charge.tauxTVA ?? 20) / 100;
    const delaiMois = n(charge.delaiReglement ?? defaultDelaiFourn) / 30;
    const freq = (charge.frequence as string) ?? "MENSUELLE";

    const r1 = buildFrequenceSeries(n(charge.montantN) * coefTVA, freq);
    const r2 = buildFrequenceSeries(n(charge.montantN1) * coefTVA, freq);
    const r3 = buildFrequenceSeries(n(charge.montantN2) * coefTVA, freq);

    if (delaiMois <= 0) {
      return { y1: r1, y2: r2, y3: r3 };
    }
    const { shifted: s1, overflow: o1 } = shiftSeriesWeighted(r1, delaiMois);
    const { shifted: s2, overflow: o2 } = shiftSeriesWeighted(r2, delaiMois, o1);
    const { shifted: s3 } = shiftSeriesWeighted(r3, delaiMois, o2);
    return { y1: s1, y2: s2, y3: s3 };
  }

  // Calcul par charge individuelle (pour le détail en trésorerie)
  const fournituresData = fournitures.map((c) => ({ charge: c, yk3: buildChargeExt(c) }));
  const servicesData = services.map((c) => ({ charge: c, yk3: buildChargeExt(c) }));

  const decFournitures: Yk3 = {
    y1: fournituresData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y1), zeroSeries()),
    y2: fournituresData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y2), zeroSeries()),
    y3: fournituresData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y3), zeroSeries()),
  };
  const decServices: Yk3 = {
    y1: servicesData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y1), zeroSeries()),
    y2: servicesData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y2), zeroSeries()),
    y3: servicesData.reduce((acc, { yk3 }) => sumSeries(acc, yk3.y3), zeroSeries()),
  };
  const decChargesExt: Yk3 = {
    y1: sumSeries(decFournitures.y1, decServices.y1),
    y2: sumSeries(decFournitures.y2, decServices.y2),
    y3: sumSeries(decFournitures.y3, decServices.y3),
  };

  // 6.5 Impôts et taxes (uniform)
  const decImpots: Yk3 = {
    y1: uniformMonthly(
      impotsTaxes.reduce((s, i) => s + n(i.montantN ?? 0), 0),
    ),
    y2: uniformMonthly(
      impotsTaxes.reduce((s, i) => s + n(i.montantN1 ?? 0), 0),
    ),
    y3: uniformMonthly(
      impotsTaxes.reduce((s, i) => s + n(i.montantN2 ?? 0), 0),
    ),
  };

  // 6.6 Personnel — 4 sous-lignes
  // ─── Salariés : ventilation mensuelle depuis detailMensuelN/N1/N2 (ou uniforme si absent)
  let brutSeriesY1 = zeroSeries();
  let brutSeriesY2 = zeroSeries();
  let brutSeriesY3 = zeroSeries();
  let cotSalSeriesY1 = zeroSeries();
  let cotSalSeriesY2 = zeroSeries();
  let cotSalSeriesY3 = zeroSeries();
  let cotPatSeriesY1 = zeroSeries();
  let cotPatSeriesY2 = zeroSeries();
  let cotPatSeriesY3 = zeroSeries();

  for (const sal of salaries) {
    const tCotSal = n(sal.tauxCotSal ?? 22) / 100;
    const tCotPat = n(sal.tauxCotPat) / 100;
    const b1 = salarieMonthlyBrut(n(sal.montantN), sal.detailMensuelN, moisDebut);
    const b2 = salarieMonthlyBrut(n(sal.montantN1), sal.detailMensuelN1, moisDebut);
    const b3 = salarieMonthlyBrut(n(sal.montantN2), sal.detailMensuelN2, moisDebut);
    brutSeriesY1 = sumSeries(brutSeriesY1, b1);
    brutSeriesY2 = sumSeries(brutSeriesY2, b2);
    brutSeriesY3 = sumSeries(brutSeriesY3, b3);
    cotSalSeriesY1 = sumSeries(cotSalSeriesY1, b1.map((v) => v * tCotSal) as MonthlySeries);
    cotSalSeriesY2 = sumSeries(cotSalSeriesY2, b2.map((v) => v * tCotSal) as MonthlySeries);
    cotSalSeriesY3 = sumSeries(cotSalSeriesY3, b3.map((v) => v * tCotSal) as MonthlySeries);
    cotPatSeriesY1 = sumSeries(cotPatSeriesY1, b1.map((v) => v * tCotPat) as MonthlySeries);
    cotPatSeriesY2 = sumSeries(cotPatSeriesY2, b2.map((v) => v * tCotPat) as MonthlySeries);
    cotPatSeriesY3 = sumSeries(cotPatSeriesY3, b3.map((v) => v * tCotPat) as MonthlySeries);
  }

  // ─── Totaux annuels dérivés des séries (utilisés dans le calcul IS)
  const salairesBruts = {
    y1: totalOf(brutSeriesY1),
    y2: totalOf(brutSeriesY2),
    y3: totalOf(brutSeriesY3),
  };
  const cotPat = {
    y1: totalOf(cotPatSeriesY1),
    y2: totalOf(cotPatSeriesY2),
    y3: totalOf(cotPatSeriesY3),
  };

  // ─── Dirigeants : même logique, pas de cotSal/cotPat (TNS séparé)
  let remuDirigeantY1 = zeroSeries();
  let remuDirigeantY2 = zeroSeries();
  let remuDirigeantY3 = zeroSeries();
  for (const d of dirigeants) {
    remuDirigeantY1 = sumSeries(remuDirigeantY1, salarieMonthlyBrut(n(d.montantN), d.detailMensuelN, moisDebut));
    remuDirigeantY2 = sumSeries(remuDirigeantY2, salarieMonthlyBrut(n(d.montantN1), d.detailMensuelN1, moisDebut));
    remuDirigeantY3 = sumSeries(remuDirigeantY3, salarieMonthlyBrut(n(d.montantN2), d.detailMensuelN2, moisDebut));
  }

  // ── Helper : applique le décalage de paiement sur une série Yk3 ─────────────
  function shiftYk3(raw: Yk3, delay: number): Yk3 {
    if (delay <= 0) return raw;
    const { shifted: s1, overflow: ov1 } = shiftSeries(raw.y1, delay);
    const { shifted: s2, overflow: ov2 } = shiftSeries(raw.y2, delay, ov1);
    const { shifted: s3 }               = shiftSeries(raw.y3, delay, ov2);
    return { y1: s1, y2: s2, y3: s3 };
  }

  // Décalage de l'ensemble des charges de personnel selon moisPaiementSalaires (M, M+1, M+2, M+3)
  const decSalairesNets = shiftYk3(
    {
      y1: subSeries(brutSeriesY1, cotSalSeriesY1),
      y2: subSeries(brutSeriesY2, cotSalSeriesY2),
      y3: subSeries(brutSeriesY3, cotSalSeriesY3),
    },
    moisPaiementSalaires,
  );
  const decChargesSociales = shiftYk3(
    {
      y1: sumSeries(cotSalSeriesY1, cotPatSeriesY1),
      y2: sumSeries(cotSalSeriesY2, cotPatSeriesY2),
      y3: sumSeries(cotSalSeriesY3, cotPatSeriesY3),
    },
    moisPaiementSalaires,
  );
  const decRemuDirigeant = shiftYk3(
    { y1: remuDirigeantY1, y2: remuDirigeantY2, y3: remuDirigeantY3 },
    moisPaiementSalaires,
  );
  const decCotisationsTNS = shiftYk3(
    {
      y1: uniformMonthly(cotisationsTNS.reduce((s, c) => s + n(c.montantN), 0)),
      y2: uniformMonthly(cotisationsTNS.reduce((s, c) => s + n(c.montantN1), 0)),
      y3: uniformMonthly(cotisationsTNS.reduce((s, c) => s + n(c.montantN2), 0)),
    },
    moisPaiementSalaires,
  );

  // ── Taxes assises sur les salaires ────────────────────────────────────────
  // Règle de ventilation :
  //   • Si dateX est renseignée → paiement ponctuel à cette date (usage : solde annuel)
  //   • Si dateX est vide       → répartition mensuelle uniforme (usage : part DSN mensuelle)
  const decTaxesSalairesY1 = zeroSeries();
  const decTaxesSalairesY2 = zeroSeries();
  const decTaxesSalairesY3 = zeroSeries();
  for (const taxe of taxesSalaires) {
    const amt1 = n(taxe.montantN);
    const amt2 = n(taxe.montantN1);
    const amt3 = n(taxe.montantN2);
    if (taxe.dateN) {
      addToSeries({ y1: decTaxesSalairesY1, y2: decTaxesSalairesY2, y3: decTaxesSalairesY3 }, new Date(taxe.dateN), amt1);
    } else {
      const spread1 = uniformMonthly(amt1);
      for (let m = 0; m < 12; m++) decTaxesSalairesY1[m] = (decTaxesSalairesY1[m] ?? 0) + (spread1[m] ?? 0);
    }
    if (taxe.dateN1) {
      addToSeries({ y1: decTaxesSalairesY1, y2: decTaxesSalairesY2, y3: decTaxesSalairesY3 }, new Date(taxe.dateN1), amt2);
    } else {
      const spread2 = uniformMonthly(amt2);
      for (let m = 0; m < 12; m++) decTaxesSalairesY2[m] = (decTaxesSalairesY2[m] ?? 0) + (spread2[m] ?? 0);
    }
    if (taxe.dateN2) {
      addToSeries({ y1: decTaxesSalairesY1, y2: decTaxesSalairesY2, y3: decTaxesSalairesY3 }, new Date(taxe.dateN2), amt3);
    } else {
      const spread3 = uniformMonthly(amt3);
      for (let m = 0; m < 12; m++) decTaxesSalairesY3[m] = (decTaxesSalairesY3[m] ?? 0) + (spread3[m] ?? 0);
    }
  }
  const decTaxesSalaires: Yk3 = {
    y1: decTaxesSalairesY1,
    y2: decTaxesSalairesY2,
    y3: decTaxesSalairesY3,
  };

  const decPersonnel: Yk3 = {
    y1: sumAll(
      decSalairesNets.y1, decChargesSociales.y1,
      decRemuDirigeant.y1, decCotisationsTNS.y1, decTaxesSalaires.y1,
    ),
    y2: sumAll(
      decSalairesNets.y2, decChargesSociales.y2,
      decRemuDirigeant.y2, decCotisationsTNS.y2, decTaxesSalaires.y2,
    ),
    y3: sumAll(
      decSalairesNets.y3, decChargesSociales.y3,
      decRemuDirigeant.y3, decCotisationsTNS.y3, decTaxesSalaires.y3,
    ),
  };

  // 6.7 TVA à payer
  const tvaCollY1 = activites.reduce(
    (acc, a) => sumSeries(acc, seasonalMonthly(n(a.montantN) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N")),
    zeroSeries(),
  );
  const tvaCollY2 = activites.reduce(
    (acc, a) => sumSeries(acc, seasonalMonthly(n(a.montantN1) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N1")),
    zeroSeries(),
  );
  const tvaCollY3 = activites.reduce(
    (acc, a) => sumSeries(acc, seasonalMonthly(n(a.montantN2) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N2")),
    zeroSeries(),
  );

  const tvaAchatsY1 = activites
    .filter((a) => a.typeActivite !== "PRESTATION_SERVICES")
    .reduce(
      (acc, a) => sumSeries(acc, seasonalMonthly(
        n(a.montantN) * Math.max(0, 1 - n(a.tauxMarge) / 100) * (n(a.tvaAchats ?? 20) / 100),
        a.saisonnaliteAchats, "N",
      )),
      zeroSeries(),
    );
  const tvaAchatsY2 = activites
    .filter((a) => a.typeActivite !== "PRESTATION_SERVICES")
    .reduce(
      (acc, a) => sumSeries(acc, seasonalMonthly(
        n(a.montantN1) * Math.max(0, 1 - n(a.tauxMarge) / 100) * (n(a.tvaAchats ?? 20) / 100),
        a.saisonnaliteAchats, "N1",
      )),
      zeroSeries(),
    );
  const tvaAchatsY3 = activites
    .filter((a) => a.typeActivite !== "PRESTATION_SERVICES")
    .reduce(
      (acc, a) => sumSeries(acc, seasonalMonthly(
        n(a.montantN2) * Math.max(0, 1 - n(a.tauxMarge) / 100) * (n(a.tvaAchats ?? 20) / 100),
        a.saisonnaliteAchats, "N2",
      )),
      zeroSeries(),
    );

  const allCharges = [...fournitures, ...services];
  const tvaChargesY1 = uniformMonthly(
    allCharges.reduce(
      (s, c) => s + n(c.montantN) * (n(c.tauxTVA ?? 20) / 100), 0,
    ),
  );
  const tvaChargesY2 = uniformMonthly(
    allCharges.reduce(
      (s, c) => s + n(c.montantN1) * (n(c.tauxTVA ?? 20) / 100), 0,
    ),
  );
  const tvaChargesY3 = uniformMonthly(
    allCharges.reduce(
      (s, c) => s + n(c.montantN2) * (n(c.tauxTVA ?? 20) / 100), 0,
    ),
  );

  const tvaImmoY1 = zeroSeries();
  const tvaImmoY2 = zeroSeries();
  const tvaImmoY3 = zeroSeries();
  for (const immo of immobilisations) {
    if (immo.actif === false) continue;
    if (immo.typeTva !== "RECUPERABLE") continue;
    const tva = n(immo.montantHT) * (n(immo.tauxTVA) / 100);
    if (tva <= 0) continue;
    const { yk, mi } = dateToSlot(new Date(immo.dateAcquisition));
    if (yk === "y1" && mi >= 0) tvaImmoY1[mi] = (tvaImmoY1[mi] ?? 0) + tva;
    else if (yk === "y2" && mi >= 0) tvaImmoY2[mi] = (tvaImmoY2[mi] ?? 0) + tva;
    else if (yk === "y3" && mi >= 0) tvaImmoY3[mi] = (tvaImmoY3[mi] ?? 0) + tva;
  }

  // Sous-lignes TVA — pour affichage informatif dans le tableau
  const decTVACollectee: Yk3 = {
    y1: tvaCollY1, y2: tvaCollY2, y3: tvaCollY3,
  };
  const decTVADeductible: Yk3 = {
    y1: sumAll(tvaAchatsY1, tvaChargesY1, tvaImmoY1),
    y2: sumAll(tvaAchatsY2, tvaChargesY2, tvaImmoY2),
    y3: sumAll(tvaAchatsY3, tvaChargesY3, tvaImmoY3),
  };

  const decTVA: Yk3 = {
    y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries(),
  };

  if (!isFranchise) {
    const { tvaAPayerMonthly: t1, finalCredit: c1 } = computeTVAMonthly(
      tvaCollY1,
      sumAll(tvaAchatsY1, tvaChargesY1, tvaImmoY1),
      periodicite,
      0,
    );
    const { tvaAPayerMonthly: t2, finalCredit: c2 } = computeTVAMonthly(
      tvaCollY2,
      sumAll(tvaAchatsY2, tvaChargesY2, tvaImmoY2),
      periodicite,
      c1,
    );
    const { tvaAPayerMonthly: t3 } = computeTVAMonthly(
      tvaCollY3,
      sumAll(tvaAchatsY3, tvaChargesY3, tvaImmoY3),
      periodicite,
      c2,
    );
    decTVA.y1 = t1;
    decTVA.y2 = t2;
    decTVA.y3 = t3;
  }

  // 6.8 IS (4 acomptes trimestriels) — base de calcul depuis buildFinCalc
  // pour éviter la désynchronisation avec le compte de résultat.
  const decIS: Yk3 = {
    y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries(),
  };

  if (isIS && parametresIS?.isEnabled !== false) {
    const fc = buildFinCalc(data, dateDemarrageDate);
    decIS.y1 = isQuarterly(fc.isParAnnee.y1);
    decIS.y2 = isQuarterly(fc.isParAnnee.y2);
    decIS.y3 = isQuarterly(fc.isParAnnee.y3);
  }

  // 6.9 Décaissements divers + remboursements CC
  const decDivers: Yk3 = {
    y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries(),
  };
  for (const flux of [...diversDecaissements, ...diversRemboursementsCC]) {
    if (flux.dateN)
      addToSeries(decDivers, new Date(flux.dateN), n(flux.montantN));
    else
      decDivers.y1 = sumSeries(
        decDivers.y1, uniformMonthly(n(flux.montantN)),
      );
    if (flux.dateN1)
      addToSeries(decDivers, new Date(flux.dateN1), n(flux.montantN1));
    else
      decDivers.y2 = sumSeries(
        decDivers.y2, uniformMonthly(n(flux.montantN1)),
      );
    if (flux.dateN2)
      addToSeries(decDivers, new Date(flux.dateN2), n(flux.montantN2));
    else
      decDivers.y3 = sumSeries(
        decDivers.y3, uniformMonthly(n(flux.montantN2)),
      );
  }

  // Total décaissements
  const totalDec: Yk3 = {
    y1: sumAll(
      decImmoHT.y1, decEmprunts.y1, decAchats.y1, decChargesExt.y1,
      decImpots.y1, decPersonnel.y1, decTVA.y1, decIS.y1, decDivers.y1,
    ),
    y2: sumAll(
      decImmoHT.y2, decEmprunts.y2, decAchats.y2, decChargesExt.y2,
      decImpots.y2, decPersonnel.y2, decTVA.y2, decIS.y2, decDivers.y2,
    ),
    y3: sumAll(
      decImmoHT.y3, decEmprunts.y3, decAchats.y3, decChargesExt.y3,
      decImpots.y3, decPersonnel.y3, decTVA.y3, decIS.y3, decDivers.y3,
    ),
  };

  // ── 7. SOLDE ───────────────────────────────────────────────────────────────

  const variation: Yk3 = {
    y1: subSeries(totalEnc.y1, totalDec.y1),
    y2: subSeries(totalEnc.y2, totalDec.y2),
    y3: subSeries(totalEnc.y3, totalDec.y3),
  };

  const y1Sol = computeSoldeMonthly(variation.y1, 0);
  const y2Sol = computeSoldeMonthly(variation.y2, y1Sol.soldeFinal[11] ?? 0);
  const y3Sol = computeSoldeMonthly(variation.y3, y2Sol.soldeFinal[11] ?? 0);

  const soldePrecedent: Yk3 = {
    y1: y1Sol.soldePrecedent,
    y2: y2Sol.soldePrecedent,
    y3: y3Sol.soldePrecedent,
  };
  const soldeFinal: Yk3 = {
    y1: y1Sol.soldeFinal,
    y2: y2Sol.soldeFinal,
    y3: y3Sol.soldeFinal,
  };

  // ── 8. ENCOURS FOURNISSEURS ───────────────────────────────────────────────
  //   Balance courante des dettes fournisseurs (achats HT facturés − paiements TTC/coefTVA).
  const coefTVAMoy = isFranchise ? 1 : 1.2;

  function computeEncoursFourn(
    raw: MonthlySeries,
    paid: MonthlySeries,
    initialEncours: number,
  ): MonthlySeries {
    const result = zeroSeries();
    let running = initialEncours;
    for (let m = 0; m < 12; m++) {
      running =
        running + (raw[m] ?? 0) - (paid[m] ?? 0) / coefTVAMoy;
      result[m] = Math.max(0, running);
    }
    return result;
  }

  const encoursFourn1 = computeEncoursFourn(decAchatsRaw.y1, decAchats.y1, 0);
  const encoursFourn2 = computeEncoursFourn(
    decAchatsRaw.y2, decAchats.y2, encoursFourn1[11] ?? 0,
  );
  const encoursFourn3 = computeEncoursFourn(
    decAchatsRaw.y3, decAchats.y3, encoursFourn2[11] ?? 0,
  );

  const encoursFournisseurs: Yk3 = {
    y1: encoursFourn1,
    y2: encoursFourn2,
    y3: encoursFourn3,
  };

  // ── 9. Construction des lignes ────────────────────────────────────────────

  const rows: TresorerieRow[] = [
    // ──── ENCAISSEMENTS ─────────────────────────────────────────────────────
    sectionRow("enc-section", "ENCAISSEMENTS"),
    mkRow("enc-capital", "Apports en capital", "normal", encApportsCapital, {
      hideIfZero: true,
    }),
    mkRow("enc-cc", "Apports en comptes courants", "normal", encApportsCC, {
      hideIfZero: true,
    }),
    mkRow("enc-emprunts", "Emprunts (déblocages)", "normal", encEmprunts, {
      hideIfZero: true,
    }),
    mkRow("enc-ca", "Production vendue", "normal", encProdVendue, {
      hideIfZero: true,
      defaultCollapsed: true,
      children: activitesEncData.map(({ act, yk3 }) =>
        mkRow(`enc-ca-${act.id}`, act.libelle, "indent", yk3, { hideIfZero: true }),
      ),
    }),
    mkRow(
      "enc-subv-expl",
      "Subventions d'exploitation",
      "normal",
      encSubvExpl,
      { hideIfZero: true },
    ),
    mkRow(
      "enc-subv-invest",
      "Subventions et aides",
      "normal",
      encSubvInvest,
      { hideIfZero: true },
    ),
    mkRow("enc-divers", "Encaissements divers", "normal", encDivers, {
      hideIfZero: true,
    }),
    mkRow("enc-total", "Total des encaissements", "subtotal", totalEnc),

    // ──── DÉCAISSEMENTS ─────────────────────────────────────────────────────
    sectionRow("dec-section", "DÉCAISSEMENTS"),

    mkRow("dec-immo", "Immobilisations (Total)", "normal", decImmoHT, {
      hideIfZero: true,
      defaultCollapsed: true,
      children: [
        mkRow("dec-immo-corp", "Immobilisations corporelles", "indent", decImmoCorporel, {
          hideIfZero: true,
          children: immosParNature.CORPOREL.map(({ immo, yk3 }) =>
            mkRow(`dec-immo-${immo.id}`, immo.libelle, "indent", yk3, { hideIfZero: true }),
          ),
        }),
        mkRow("dec-immo-incorp", "Immobilisations incorporelles", "indent", decImmoIncorporel, {
          hideIfZero: true,
          children: immosParNature.INCORPOREL.map(({ immo, yk3 }) =>
            mkRow(`dec-immo-${immo.id}`, immo.libelle, "indent", yk3, { hideIfZero: true }),
          ),
        }),
        mkRow("dec-immo-fin", "Immobilisations financières", "indent", decImmoFinancier, {
          hideIfZero: true,
          children: immosParNature.FINANCIER.map(({ immo, yk3 }) =>
            mkRow(`dec-immo-${immo.id}`, immo.libelle, "indent", yk3, { hideIfZero: true }),
          ),
        }),
      ],
    }),

    mkRow("dec-emprunts", "Échéances d'emprunts", "normal", decEmprunts, {
      hideIfZero: true,
      defaultCollapsed: true,
      children: [
        mkRow(
          "dec-capital",
          "Remboursements capital",
          "indent",
          decCapital,
          { hideIfZero: true },
        ),
        mkRow(
          "dec-interets",
          "Intérêts et assurances",
          "indent",
          decInterets,
          { hideIfZero: true },
        ),
      ],
    }),

    mkRow("dec-achats", "Achats effectués (Total)", "normal", decAchats, {
      hideIfZero: true,
      defaultCollapsed: true,
      children: activitesAchatData.map(({ act, yk3 }) =>
        mkRow(`dec-achat-${act.id}`, act.libelle, "indent", yk3, { hideIfZero: true }),
      ),
    }),

    mkRow(
      "dec-charges-ext",
      "Charges externes (Total)",
      "normal",
      decChargesExt,
      {
        hideIfZero: true,
        defaultCollapsed: true,
        children: [
          mkRow(
            "dec-fournitures",
            "Fournitures consommables",
            "indent",
            decFournitures,
            {
              hideIfZero: true,
              children: fournituresData.map(({ charge, yk3 }) =>
                mkRow(
                  `dec-fourn-${charge.id}`,
                  charge.libelle,
                  "indent",
                  yk3,
                  { hideIfZero: true },
                ),
              ),
            },
          ),
          mkRow(
            "dec-services",
            "Services extérieurs",
            "indent",
            decServices,
            {
              hideIfZero: true,
              children: servicesData.map(({ charge, yk3 }) =>
                mkRow(
                  `dec-serv-${charge.id}`,
                  charge.libelle,
                  "indent",
                  yk3,
                  { hideIfZero: true },
                ),
              ),
            },
          ),
        ],
      },
    ),

    mkRow("dec-impots", "État – Impôts et taxes", "normal", decImpots, {
      hideIfZero: true,
    }),

    mkRow(
      "dec-personnel",
      "Charges de personnel (Total)",
      "normal",
      decPersonnel,
      {
        hideIfZero: true,
        defaultCollapsed: true,
        children: [
          mkRow("dec-salaires", "Salaires nets", "indent", decSalairesNets, {
            hideIfZero: true,
          }),
          mkRow(
            "dec-charges-soc",
            "Charges sociales",
            "indent",
            decChargesSociales,
            { hideIfZero: true },
          ),
          mkRow(
            "dec-dirigeant",
            "Rémunération dirigeant",
            "indent",
            decRemuDirigeant,
            { hideIfZero: true },
          ),
          mkRow(
            "dec-tns",
            "Cotisations TNS",
            "indent",
            decCotisationsTNS,
            { hideIfZero: true },
          ),
          mkRow(
            "dec-taxes-sal",
            "Taxes assises sur salaires",
            "indent",
            decTaxesSalaires,
            { hideIfZero: true },
          ),
        ],
      },
    ),

    mkRow("dec-tva", "TVA à payer", "normal", decTVA, {
      hideIfZero: true,
      defaultCollapsed: true,
      children: [
        mkRow("dec-tva-coll", "TVA collectée", "indent", decTVACollectee, { hideIfZero: true }),
        mkRow("dec-tva-ded", "TVA déductible", "indent", decTVADeductible, { hideIfZero: true }),
      ],
    }),
    mkRow("dec-is", "Impôt sur les sociétés", "normal", decIS, {
      hideIfZero: true,
    }),
    mkRow("dec-divers", "Décaissements divers", "normal", decDivers, {
      hideIfZero: true,
    }),
    mkRow("dec-total", "Total des décaissements", "subtotal", totalDec),

    // ──── SOLDE ─────────────────────────────────────────────────────────────
    sectionRow("tres-section", "SOLDE DE TRÉSORERIE"),
    mkRow("tres-solde-prec", "Solde précédent", "result", soldePrecedent),
    mkRow("tres-variation", "Variation de trésorerie", "result", variation),
    mkRow("tres-solde-final", "Solde de trésorerie", "highlight", soldeFinal, {
      totalIsEndValue: true,
    }),
    mkRow(
      "tres-encours",
      "Encours fournisseurs",
      "normal",
      encoursFournisseurs,
      { totalIsEndValue: true },
    ),
  ];

  return { yearLabels, monthLabels, rows };
}
