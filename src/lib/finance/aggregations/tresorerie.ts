/**
 * Construction de l'arbre de lignes du tableau de trésorerie.
 *
 * Responsabilité unique : assembler les séries calculées (Yk3) en une
 * structure `TresorerieRow[]` consommable par le composant UI.
 *
 * Aucune logique de calcul métier ici — uniquement la mise en forme.
 *
 * @module aggregations/tresorerie
 * @moved-from calculs/tresorerie-rows.ts
 */

import type { MonthlySeries } from "@/lib/finance/calculs/monthly";
import type { TresorerieValue, TresorerieRow, TresorerieRowStyle, Yk3 } from "@/lib/finance/tresorerie-types";

// ── Helpers de présentation ────────────────────────────────────────────────────

export function tresoValue(months: MonthlySeries, endValue?: boolean): TresorerieValue {
  return {
    months,
    total: endValue ? (months[11] ?? 0) : months.reduce((a, b) => a + b, 0),
  };
}

export function mkRow(
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

export function sectionRow(key: string, label: string): TresorerieRow {
  const zero = new Array(12).fill(0) as MonthlySeries;
  const empty: Yk3 = { y1: zero, y2: zero, y3: zero };
  return mkRow(key, label, "section", empty);
}

// ── Types d'entrée ─────────────────────────────────────────────────────────────

import type { EncaissementsResult } from "@/lib/finance/calculs/encaissements";
import type { DecaissementsResult } from "@/lib/finance/calculs/decaissements";
import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";

export interface TresorerieRowsInput {
  enc: EncaissementsResult;
  dec: DecaissementsResult;
  soldePrecedent: Yk3;
  variation: Yk3;
  soldeFinal: Yk3;
  encoursFournisseurs: Yk3;
  immosParNature: {
    CORPOREL: Array<{ immo: ScenarioFinData["immobilisations"][number]; yk3: Yk3 }>;
    INCORPOREL: Array<{ immo: ScenarioFinData["immobilisations"][number]; yk3: Yk3 }>;
    FINANCIER: Array<{ immo: ScenarioFinData["immobilisations"][number]; yk3: Yk3 }>;
  };
}

// ── Construction de l'arbre ────────────────────────────────────────────────────

export function buildTresorerieRows(input: TresorerieRowsInput): TresorerieRow[] {
  const { enc, dec, soldePrecedent, variation, soldeFinal, encoursFournisseurs, immosParNature } = input;

  return [
    // ──── ENCAISSEMENTS ─────────────────────────────────────────────────────
    sectionRow("enc-section", "ENCAISSEMENTS"),
    mkRow("enc-capital", "Apports en capital", "normal", enc.encApportsCapital, { hideIfZero: true }),
    mkRow("enc-cc", "Apports en comptes courants", "normal", enc.encApportsCC, { hideIfZero: true }),
    mkRow("enc-emprunts", "Emprunts (déblocages)", "normal", enc.encEmprunts, { hideIfZero: true }),
    mkRow("enc-ca", "Production vendue", "normal", enc.encProdVendue, {
      hideIfZero: true,
      defaultCollapsed: true,
      children: enc.activitesEncData.map(({ act, yk3 }) =>
        mkRow(`enc-ca-${act.id}`, act.libelle, "indent", yk3, { hideIfZero: true }),
      ),
    }),
    mkRow("enc-subv-expl", "Subventions d'exploitation", "normal", enc.encSubvExpl, { hideIfZero: true }),
    mkRow("enc-subv-invest", "Subventions et aides", "normal", enc.encSubvInvest, { hideIfZero: true }),
    mkRow("enc-divers", "Encaissements divers", "normal", enc.encDivers, { hideIfZero: true }),
    mkRow("enc-total", "Total des encaissements", "subtotal", enc.totalEnc),

    // ──── DÉCAISSEMENTS ─────────────────────────────────────────────────────
    sectionRow("dec-section", "DÉCAISSEMENTS"),

    mkRow("dec-immo", "Immobilisations (Total)", "normal", dec.decImmoTTC, {
      hideIfZero: true,
      defaultCollapsed: true,
      children: [
        mkRow("dec-immo-corp", "Immobilisations corporelles", "indent", dec.decImmoCorporel, {
          hideIfZero: true,
          children: immosParNature.CORPOREL.map(({ immo, yk3 }) =>
            mkRow(`dec-immo-${immo.id}`, immo.libelle, "indent", yk3, { hideIfZero: true }),
          ),
        }),
        mkRow("dec-immo-incorp", "Immobilisations incorporelles", "indent", dec.decImmoIncorporel, {
          hideIfZero: true,
          children: immosParNature.INCORPOREL.map(({ immo, yk3 }) =>
            mkRow(`dec-immo-${immo.id}`, immo.libelle, "indent", yk3, { hideIfZero: true }),
          ),
        }),
        mkRow("dec-immo-fin", "Immobilisations financières", "indent", dec.decImmoFinancier, {
          hideIfZero: true,
          children: immosParNature.FINANCIER.map(({ immo, yk3 }) =>
            mkRow(`dec-immo-${immo.id}`, immo.libelle, "indent", yk3, { hideIfZero: true }),
          ),
        }),
      ],
    }),

    mkRow("dec-emprunts", "Échéances d'emprunts", "normal", dec.decEmprunts, {
      hideIfZero: true,
      defaultCollapsed: true,
      children: [
        mkRow("dec-capital", "Remboursements capital", "indent", dec.decCapital, { hideIfZero: true }),
        mkRow("dec-interets", "Intérêts et assurances", "indent", dec.decInterets, { hideIfZero: true }),
        mkRow("dec-frais-dossier", "Frais de dossier", "indent", dec.decFraisDossier, { hideIfZero: true }),
      ],
    }),

    mkRow("dec-achats", "Achats effectués (Total)", "normal", dec.decAchats, {
      hideIfZero: true,
      defaultCollapsed: true,
      children: dec.activitesAchatData.map(({ act, yk3 }) =>
        mkRow(`dec-achat-${act.id}`, act.libelle, "indent", yk3, { hideIfZero: true }),
      ),
    }),

    mkRow("dec-charges-ext", "Charges externes (Total)", "normal", dec.decChargesExt, {
      hideIfZero: true,
      defaultCollapsed: true,
      children: [
        mkRow("dec-fournitures", "Fournitures consommables", "indent", dec.decFournitures, {
          hideIfZero: true,
          children: dec.fournituresData.map(({ charge, yk3 }) =>
            mkRow(`dec-fourn-${charge.id}`, charge.libelle, "indent", yk3, { hideIfZero: true }),
          ),
        }),
        mkRow("dec-services", "Services extérieurs", "indent", dec.decServices, {
          hideIfZero: true,
          children: dec.servicesData.map(({ charge, yk3 }) =>
            mkRow(`dec-serv-${charge.id}`, charge.libelle, "indent", yk3, { hideIfZero: true }),
          ),
        }),
      ],
    }),

    mkRow("dec-impots", "État – Impôts et taxes", "normal", dec.decImpots, { hideIfZero: true }),

    mkRow("dec-personnel", "Charges de personnel (Total)", "normal", dec.decPersonnel, {
      hideIfZero: true,
      defaultCollapsed: true,
      children: [
        mkRow("dec-salaires", "Salaires nets", "indent", dec.decSalairesNets, { hideIfZero: true }),
        mkRow("dec-charges-soc", "Charges sociales", "indent", dec.decChargesSociales, { hideIfZero: true }),
        mkRow("dec-dirigeant", "Rémunération dirigeant", "indent", dec.decRemuDirigeant, { hideIfZero: true }),
        mkRow("dec-tns", "Cotisations TNS", "indent", dec.decCotisationsTNS, { hideIfZero: true }),
        mkRow("dec-taxes-sal", "Taxes assises sur salaires", "indent", dec.decTaxesSalaires, { hideIfZero: true }),
      ],
    }),

    mkRow("dec-tva", "TVA à payer", "normal", dec.decTVA, {
      hideIfZero: true,
      defaultCollapsed: true,
      children: [
        mkRow("dec-tva-coll", "TVA collectée", "indent", dec.decTVACollectee, { hideIfZero: true }),
        mkRow("dec-tva-ded", "TVA déductible", "indent", dec.decTVADeductible, { hideIfZero: true }),
      ],
    }),
    mkRow("dec-is", "Impôt sur les sociétés", "normal", dec.decIS, { hideIfZero: true }),
    mkRow("dec-divers", "Décaissements divers", "normal", dec.decDivers, { hideIfZero: true }),
    mkRow("dec-total", "Total des décaissements", "subtotal", dec.totalDec),

    // ──── SOLDE ─────────────────────────────────────────────────────────────
    sectionRow("tres-section", "SOLDE DE TRÉSORERIE"),
    mkRow("tres-solde-prec", "Solde précédent", "result", soldePrecedent),
    mkRow("tres-variation", "Variation de trésorerie", "result", variation),
    mkRow("tres-solde-final", "Solde de trésorerie", "highlight", soldeFinal, { totalIsEndValue: true }),
    mkRow("tres-encours", "Encours fournisseurs", "normal", encoursFournisseurs, { totalIsEndValue: true }),
  ];
}
