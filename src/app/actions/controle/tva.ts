"use server";

import { fetchScenarioData } from "@/lib/finance/fetch-scenario";
import type { YearKey } from "@/lib/finance/utils";
import {
  type MonthlySeries,
  zeroSeries,
  sumSeries,
  seasonalMonthly,
  chargeExplMonthly,
  buildMonthLabels,
} from "@/lib/finance/calculs/monthly";
import { computeTVAMonthly } from "@/lib/finance/tva-engine";
import { n } from "@/lib/finance/utils"; // valeurs runtime séparées du import type ci-dessus

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VATValue {
  months: MonthlySeries;
  total: number;
}

export type VATRowStyle =
  | "normal"    // ligne de détail
  | "section"   // en-tête de section (bandeau)
  | "subtotal"  // sous-total
  | "result"    // résultat intermédiaire clé
  | "highlight"; // résultat final mis en avant

export interface VATRow {
  key: string;
  label: string;
  values: Record<YearKey, VATValue>;
  style: VATRowStyle;
  hideIfZero?: boolean;
  children?: VATRow[];
}

export interface VATData {
  yearLabels: Record<YearKey, string>;
  monthLabels: Record<YearKey, string[]>;
  rows: VATRow[];
  periodicite: "mensuel" | "trimestriel";
  isFranchise: boolean;
}

// ── Helpers locaux (spécifiques TVA) ─────────────────────────────────────────

function vatValue(months: MonthlySeries): VATValue {
  return { months, total: months.reduce((a, b) => a + b, 0) };
}

function vatRow(
  key: string,
  label: string,
  vals: Record<YearKey, MonthlySeries>,
  style: VATRowStyle,
  hideIfZero = false,
  children?: VATRow[],
): VATRow {
  return {
    key,
    label,
    values: {
      y1: vatValue(vals.y1),
      y2: vatValue(vals.y2),
      y3: vatValue(vals.y3),
    },
    style,
    hideIfZero,
    ...(children && children.length > 0 ? { children } : {}),
  };
}

// ── Server Action ─────────────────────────────────────────────────────────────

export async function fetchVAT(dossierId: string): Promise<VATData> {
  const data = await fetchScenarioData(dossierId);
  const {
    dateDemarrage,
    scenario,
    activites,
    fournitures,
    services,
    immobilisations,
  } = data;

  const anneeDebut = dateDemarrage.getFullYear();
  const moisDebut = dateDemarrage.getMonth(); // 0-based

  const yearLabels: Record<YearKey, string> = {
    y1: `${anneeDebut}–${anneeDebut + 1}`,
    y2: `${anneeDebut + 1}–${anneeDebut + 2}`,
    y3: `${anneeDebut + 2}–${anneeDebut + 3}`,
  };

  const monthLabels: Record<YearKey, string[]> = {
    y1: buildMonthLabels(moisDebut, anneeDebut),
    y2: buildMonthLabels(moisDebut, anneeDebut + 1),
    y3: buildMonthLabels(moisDebut, anneeDebut + 2),
  };

  const regimeTVA = scenario.parametres?.regimeTVA ?? "REEL_NORMAL";
  const isFranchise = regimeTVA === "FRANCHISE";

  // En franchise, pas de TVA à déclarer
  if (isFranchise) {
    return { yearLabels, monthLabels, rows: [], periodicite: "mensuel", isFranchise: true };
  }

  const periodicite = (
    (scenario.parametres?.periodiciteDeclarationTVA ?? "mensuel") === "trimestriel"
      ? "trimestriel"
      : "mensuel"
  ) as "mensuel" | "trimestriel";


  // ── 4. TVA collectée sur CA ────────────────────────────────────────────────
  // Répartition mensuelle respectant la saisonnalité de chaque activité.

  const tvaCollecteeSeries: Record<YearKey, MonthlySeries> = {
    y1: activites.reduce(
      (s, a) => sumSeries(s, seasonalMonthly(n(a.montantN) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N")),
      zeroSeries(),
    ),
    y2: activites.reduce(
      (s, a) => sumSeries(s, seasonalMonthly(n(a.montantN1) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N1")),
      zeroSeries(),
    ),
    y3: activites.reduce(
      (s, a) => sumSeries(s, seasonalMonthly(n(a.montantN2) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N2")),
      zeroSeries(),
    ),
  };

  // Détail TVA collectée par activité (enfants dépliables)
  const tvaCAChildren: VATRow[] = activites
    .filter((a) => a.actif !== false)
    .map((a) => ({
      key: `tva-ca-${a.id}`,
      label: a.libelle,
      values: {
        y1: vatValue(seasonalMonthly(n(a.montantN) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N")),
        y2: vatValue(seasonalMonthly(n(a.montantN1) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N1")),
        y3: vatValue(seasonalMonthly(n(a.montantN2) * (n(a.tauxTVA) / 100), a.saisonnaliteCA, "N2")),
      },
      style: "normal" as VATRowStyle,
      hideIfZero: true,
    }));

  // ── 5. TVA déductible sur immobilisations ──────────────────────────────────
  // Chaque investissement est placé sur le mois correspondant à sa date d'acquisition.

  /** Retourne l'exercice (0→y1, 1→y2, 2→y3) et l'index de mois (0–11) pour une date donnée */
  function dateToExercise(d: Date): { yk: YearKey | null; monthIndex: number } {
    const starts = [
      new Date(dateDemarrage.getFullYear(), dateDemarrage.getMonth(), 1),
      new Date(dateDemarrage.getFullYear() + 1, dateDemarrage.getMonth(), 1),
      new Date(dateDemarrage.getFullYear() + 2, dateDemarrage.getMonth(), 1),
      new Date(dateDemarrage.getFullYear() + 3, dateDemarrage.getMonth(), 1),
    ];
    const YKS: YearKey[] = ["y1", "y2", "y3"];

    for (let i = 0; i < 3; i++) {
      if (d >= starts[i]! && d < starts[i + 1]!) {
        // Nombre de mois depuis le début de l'exercice
        const yearDiff = d.getFullYear() - starts[i]!.getFullYear();
        const monthDiff = d.getMonth() - starts[i]!.getMonth();
        const monthIndex = Math.min(11, Math.max(0, yearDiff * 12 + monthDiff));
        return { yk: YKS[i]!, monthIndex };
      }
    }
    return { yk: null, monthIndex: -1 };
  }

  const tvaImmoSeries: Record<YearKey, MonthlySeries> = {
    y1: zeroSeries(),
    y2: zeroSeries(),
    y3: zeroSeries(),
  };

  for (const immo of immobilisations) {
    if (immo.actif === false) continue;
    // Seule la TVA récupérable est déductible
    if (immo.typeTva !== "RECUPERABLE") continue;
    const tva = n(immo.montantHT) * (n(immo.tauxTVA) / 100);
    if (tva <= 0) continue;
    const { yk, monthIndex } = dateToExercise(new Date(immo.dateAcquisition));
    if (yk && monthIndex >= 0) {
      tvaImmoSeries[yk][monthIndex] = (tvaImmoSeries[yk][monthIndex] ?? 0) + tva;
    }
  }

  // Détail TVA sur immobilisations par ligne (enfants dépliables)
  const tvaImmoChildren: VATRow[] = immobilisations
    .filter((immo) => immo.actif !== false && immo.typeTva === "RECUPERABLE")
    .map((immo) => {
      const tvaImmo = n(immo.montantHT) * (n(immo.tauxTVA) / 100);
      const y1s = zeroSeries(), y2s = zeroSeries(), y3s = zeroSeries();
      if (tvaImmo > 0) {
        const { yk, monthIndex } = dateToExercise(new Date(immo.dateAcquisition));
        if (yk === "y1" && monthIndex >= 0) y1s[monthIndex] = (y1s[monthIndex] ?? 0) + tvaImmo;
        else if (yk === "y2" && monthIndex >= 0) y2s[monthIndex] = (y2s[monthIndex] ?? 0) + tvaImmo;
        else if (yk === "y3" && monthIndex >= 0) y3s[monthIndex] = (y3s[monthIndex] ?? 0) + tvaImmo;
      }
      return {
        key: `tva-immo-${immo.id}`,
        label: immo.libelle,
        values: { y1: vatValue(y1s), y2: vatValue(y2s), y3: vatValue(y3s) },
        style: "normal" as VATRowStyle,
        hideIfZero: true,
      };
    });

  // ── 6. TVA déductible sur achats de matières ──────────────────────────────
  const achatsRows = activites
    .filter((a) => a.typeActivite !== "PRESTATION_SERVICES")
    .map((a) => ({
      coef: Math.max(0, 1 - n(a.tauxMarge) / 100),
      tvaAchats: n(a.tvaAchats),
      montantN: n(a.montantN),
      montantN1: n(a.montantN1),
      montantN2: n(a.montantN2),
      saisonnaliteAchats: a.saisonnaliteAchats,
    }));

  const tvaAchatsSeries: Record<YearKey, MonthlySeries> = {
    y1: achatsRows.reduce(
      (s, r) => sumSeries(s, seasonalMonthly(r.montantN * r.coef * (r.tvaAchats / 100), r.saisonnaliteAchats, "N")),
      zeroSeries(),
    ),
    y2: achatsRows.reduce(
      (s, r) => sumSeries(s, seasonalMonthly(r.montantN1 * r.coef * (r.tvaAchats / 100), r.saisonnaliteAchats, "N1")),
      zeroSeries(),
    ),
    y3: achatsRows.reduce(
      (s, r) => sumSeries(s, seasonalMonthly(r.montantN2 * r.coef * (r.tvaAchats / 100), r.saisonnaliteAchats, "N2")),
      zeroSeries(),
    ),
  };

  // Détail TVA achats de matières par activité (enfants dépliables)
  const tvaAchatsChildren: VATRow[] = activites
    .filter((a) => a.actif !== false && a.typeActivite !== "PRESTATION_SERVICES")
    .map((a) => {
      const coef = Math.max(0, 1 - n(a.tauxMarge) / 100);
      const tvaRate = n(a.tvaAchats) / 100;
      return {
        key: `tva-achats-${a.id}`,
        label: a.libelle,
        values: {
          y1: vatValue(seasonalMonthly(n(a.montantN) * coef * tvaRate, a.saisonnaliteAchats, "N")),
          y2: vatValue(seasonalMonthly(n(a.montantN1) * coef * tvaRate, a.saisonnaliteAchats, "N1")),
          y3: vatValue(seasonalMonthly(n(a.montantN2) * coef * tvaRate, a.saisonnaliteAchats, "N2")),
        },
        style: "normal" as VATRowStyle,
        hideIfZero: true,
      };
    });

  // ── 7. TVA déductible sur charges externes ────────────────────────────────
  const chargesRows = [
    ...fournitures.map((f) => ({
      montantN: n(f.montantN),
      montantN1: n(f.montantN1),
      montantN2: n(f.montantN2),
      tva: n(f.tauxTVA),
      frequence: f.frequence as string,
      detailCalc: f.detailCalc,
    })),
    ...services.map((s) => ({
      montantN: n(s.montantN),
      montantN1: n(s.montantN1),
      montantN2: n(s.montantN2),
      tva: n(s.tauxTVA),
      frequence: s.frequence as string,
      detailCalc: s.detailCalc,
    })),
  ];

  const tvaChargesSeries: Record<YearKey, MonthlySeries> = {
    y1: chargesRows.reduce(
      (s, r) => sumSeries(s, chargeExplMonthly(r.montantN * (r.tva / 100), r, "N")),
      zeroSeries(),
    ),
    y2: chargesRows.reduce(
      (s, r) => sumSeries(s, chargeExplMonthly(r.montantN1 * (r.tva / 100), r, "N1")),
      zeroSeries(),
    ),
    y3: chargesRows.reduce(
      (s, r) => sumSeries(s, chargeExplMonthly(r.montantN2 * (r.tva / 100), r, "N2")),
      zeroSeries(),
    ),
  };

  // Détail TVA charges externes par ligne (enfants dépliables)
  const tvaChargesChildren: VATRow[] = [
    ...fournitures.map((f) => ({
      key: `tva-charges-f-${f.id}`,
      label: f.libelle,
      values: {
        y1: vatValue(chargeExplMonthly(n(f.montantN) * (n(f.tauxTVA) / 100), { frequence: f.frequence as string, detailCalc: f.detailCalc }, "N")),
        y2: vatValue(chargeExplMonthly(n(f.montantN1) * (n(f.tauxTVA) / 100), { frequence: f.frequence as string, detailCalc: f.detailCalc }, "N1")),
        y3: vatValue(chargeExplMonthly(n(f.montantN2) * (n(f.tauxTVA) / 100), { frequence: f.frequence as string, detailCalc: f.detailCalc }, "N2")),
      },
      style: "normal" as VATRowStyle,
      hideIfZero: true,
    })),
    ...services.map((s) => ({
      key: `tva-charges-s-${s.id}`,
      label: s.libelle,
      values: {
        y1: vatValue(chargeExplMonthly(n(s.montantN) * (n(s.tauxTVA) / 100), { frequence: s.frequence as string, detailCalc: s.detailCalc }, "N")),
        y2: vatValue(chargeExplMonthly(n(s.montantN1) * (n(s.tauxTVA) / 100), { frequence: s.frequence as string, detailCalc: s.detailCalc }, "N1")),
        y3: vatValue(chargeExplMonthly(n(s.montantN2) * (n(s.tauxTVA) / 100), { frequence: s.frequence as string, detailCalc: s.detailCalc }, "N2")),
      },
      style: "normal" as VATRowStyle,
      hideIfZero: true,
    })),
  ];

  // ── 8. Total TVA déductible ────────────────────────────────────────────────
  const tvaDeductibleSeries: Record<YearKey, MonthlySeries> = {
    y1: sumSeries(sumSeries(tvaImmoSeries.y1, tvaAchatsSeries.y1), tvaChargesSeries.y1),
    y2: sumSeries(sumSeries(tvaImmoSeries.y2, tvaAchatsSeries.y2), tvaChargesSeries.y2),
    y3: sumSeries(sumSeries(tvaImmoSeries.y3, tvaAchatsSeries.y3), tvaChargesSeries.y3),
  };

  // ── 9. TVA nette, crédit et TVA à payer (report inter-exercices) ───────────
  const y1Calc = computeTVAMonthly(
    tvaCollecteeSeries.y1,
    tvaDeductibleSeries.y1,
    periodicite,
    0,
  );
  const y2Calc = computeTVAMonthly(
    tvaCollecteeSeries.y2,
    tvaDeductibleSeries.y2,
    periodicite,
    y1Calc.finalCredit,
  );
  const y3Calc = computeTVAMonthly(
    tvaCollecteeSeries.y3,
    tvaDeductibleSeries.y3,
    periodicite,
    y2Calc.finalCredit,
  );

  // ── 10. Construction des lignes ───────────────────────────────────────────
  const rows: VATRow[] = [
    // ── TVA collectée ──────────────────────────────────────────────────────
    vatRow(
      "section-collectee",
      "TVA COLLECTÉE",
      { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() },
      "section",
    ),
    vatRow(
      "tva-ca",
      "TVA sur chiffre d'affaires",
      tvaCollecteeSeries,
      "normal",
      false,
      tvaCAChildren,
    ),
    vatRow(
      "total-collectee",
      "Total TVA collectée",
      tvaCollecteeSeries,
      "subtotal",
    ),

    // ── TVA déductible ─────────────────────────────────────────────────────
    vatRow(
      "section-deductible",
      "TVA DÉDUCTIBLE",
      { y1: zeroSeries(), y2: zeroSeries(), y3: zeroSeries() },
      "section",
    ),
    vatRow(
      "tva-immo",
      "TVA sur immobilisations",
      tvaImmoSeries,
      "normal",
      true,
      tvaImmoChildren,
    ),
    vatRow(
      "tva-achats",
      "TVA sur achats de matières",
      tvaAchatsSeries,
      "normal",
      true,
      tvaAchatsChildren,
    ),
    vatRow(
      "tva-charges",
      "TVA sur charges externes",
      tvaChargesSeries,
      "normal",
      true,
      tvaChargesChildren,
    ),
    vatRow(
      "total-deductible",
      "Total TVA déductible",
      tvaDeductibleSeries,
      "subtotal",
    ),

    // ── TVA nette ─────────────────────────────────────────────────────────
    vatRow(
      "tva-nette",
      "TVA nette du mois",
      {
        y1: y1Calc.tvaNetteMonthly,
        y2: y2Calc.tvaNetteMonthly,
        y3: y3Calc.tvaNetteMonthly,
      },
      "result",
    ),

    // ── Crédit reporté ────────────────────────────────────────────────────
    vatRow(
      "credit-tva",
      "Crédit TVA reporté",
      {
        y1: y1Calc.creditReporteMonthly,
        y2: y2Calc.creditReporteMonthly,
        y3: y3Calc.creditReporteMonthly,
      },
      "normal",
      true,
    ),

    // ── TVA à payer ───────────────────────────────────────────────────────
    vatRow(
      "tva-payer",
      "TVA à payer",
      {
        y1: y1Calc.tvaAPayerMonthly,
        y2: y2Calc.tvaAPayerMonthly,
        y3: y3Calc.tvaAPayerMonthly,
      },
      "highlight",
    ),
  ];

  return { yearLabels, monthLabels, rows, periodicite, isFranchise };
}
