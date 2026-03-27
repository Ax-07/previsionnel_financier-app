import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import type { FinCalcResult } from "@/lib/finance/calculs";
import { n } from "@/lib/finance/utils";
import { distribuerAmortParExercice } from "@/lib/finance/calculs/amortissements";

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
  // achatsRows = achats effectués par activité = consommés + varStock annuelle
  // Formule : cN + (sfY1 - 0) pour Y1 ; cN1 + (sfY2 - sfY1) pour Y2, etc.
  // Les ponctuels NE sont PAS ajoutés ici : ils sont absorbés par la dynamique
  // stock (sfBase = cumulConsommes×jours/360) et n'affectent pas le total annuel.
  const achatsRows = caRows
    .filter((r) => r.typeActivite !== "PRESTATION_SERVICES")
    .map((r) => {
      const coef = Math.max(0, 1 - r.tauxMarge / 100);
      const cN  = r.montantN  * coef;
      const cN1 = r.montantN1 * coef;
      const cN2 = r.montantN2 * coef;
      const jours = r.stocks;
      const sfY1 = (cN  * jours) / 360;
      const sfY2 = (cN1 * jours) / 360;
      const sfY3 = (cN2 * jours) / 360;
      return {
        libelle: `Achats – ${r.libelle}`,
        actif: r.actif,
        montantN:  cN  + sfY1,
        montantN1: cN1 + (sfY2 - sfY1),
        montantN2: cN2 + (sfY3 - sfY2),
      };
    });

  // ── Achats de stock ponctuels ──────────────────────────────────────────────
  const achatsPonctuelsRows = activites
    .filter((a) => a.actif !== false && a.typeActivite !== "PRESTATION_SERVICES")
    .flatMap((a) => {
      const p = a.achatsStockPonctuel as Record<string, number[]> | null | undefined;
      if (!p) return [];
      const sumArr = (arr: number[] | undefined) => (arr ?? []).reduce((s, v) => s + v, 0);
      const y1 = sumArr(p["N"]);
      const y2 = sumArr(p["N1"]);
      const y3 = sumArr(p["N2"]);
      if (y1 === 0 && y2 === 0 && y3 === 0) return [];
      return [{ libelle: `Achats ponctuels – ${a.libelle}`, montantN: y1, montantN1: y2, montantN2: y3 }];
    });

  // ── Commissions ───────────────────────────────────────────────────────────
  const commissionRows = commissions
    .filter((c) => c.actif !== false)
    .map((c) => ({ libelle: c.libelle, actif: c.actif, montantN: n(c.montantN), montantN1: n(c.montantN1), montantN2: n(c.montantN2) }));

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
