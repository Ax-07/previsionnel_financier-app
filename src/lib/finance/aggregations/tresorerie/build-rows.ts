/**
 * Construction de l'arbre de lignes du tableau de trésorerie.
 *
 * Responsabilité unique : assembler les séries calculées (Yk3) en une
 * structure `TresorerieRow[]` consommable par le composant UI.
 *
 * @module aggregations/tresorerie/build-rows
 */

import type { TresorerieRow } from "@/lib/finance/tresorerie-types";
import { mkRow, sectionRow } from "./helpers";
import type { TresorerieRowsInput } from "./types";

export function buildTresorerieRows(input: TresorerieRowsInput): TresorerieRow[] {
  const { enc, dec, soldePrecedent, variation, soldeFinal, encoursFournisseurs, immosParNature } = input;
  const durees = {
    y1: enc.totalEnc.y1.length,
    y2: enc.totalEnc.y2.length,
    y3: enc.totalEnc.y3.length,
  };

  return [
    // ──── ENCAISSEMENTS ─────────────────────────────────────────────────────
    sectionRow("enc-section", "ENCAISSEMENTS", durees),
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
    sectionRow("dec-section", "DÉCAISSEMENTS", durees),

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
    sectionRow("tres-section", "SOLDE DE TRÉSORERIE", durees),
    mkRow("tres-solde-prec", "Solde précédent", "result", soldePrecedent, { totalIsFirstValue: true }),
    mkRow("tres-variation", "Variation de trésorerie", "result", variation),
    mkRow("tres-solde-final", "Solde de trésorerie", "highlight", soldeFinal, { totalIsEndValue: true }),
    mkRow("tres-encours", "Encours fournisseurs", "normal", encoursFournisseurs, { totalIsEndValue: true }),
  ];
}
