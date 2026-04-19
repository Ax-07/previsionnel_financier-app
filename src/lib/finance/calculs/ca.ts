import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { n, sumBy, type YearAcc } from "@/lib/finance/utils";

// â”€â”€ CA par type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcCA(data: Pick<ScenarioFinData, "activites">): YearAcc {
  const rows = data.activites.filter((a) => a.actif !== false);
  return {
    y1: sumBy(rows, (r) => n(r.montantN)),
    y2: sumBy(rows, (r) => n(r.montantN1)),
    y3: sumBy(rows, (r) => n(r.montantN2)),
  };
}

export function calcCAByType(
  data: Pick<ScenarioFinData, "activites">,
  type: string,
): YearAcc {
  const rows = data.activites.filter(
    (a) => a.actif !== false && a.typeActivite === type,
  );
  return {
    y1: sumBy(rows, (r) => n(r.montantN)),
    y2: sumBy(rows, (r) => n(r.montantN1)),
    y3: sumBy(rows, (r) => n(r.montantN2)),
  };
}

// â”€â”€ Charges externes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcChargesExternes(
  data: Pick<ScenarioFinData, "fournitures" | "services">,
): { fournitures: YearAcc; services: YearAcc; total: YearAcc } {
  const f: YearAcc = {
    y1: sumBy(data.fournitures.filter((r) => r.actif !== false), (r) => n(r.montantN)),
    y2: sumBy(data.fournitures.filter((r) => r.actif !== false), (r) => n(r.montantN1)),
    y3: sumBy(data.fournitures.filter((r) => r.actif !== false), (r) => n(r.montantN2)),
  };
  const s: YearAcc = {
    y1: sumBy(data.services.filter((r) => r.actif !== false), (r) => n(r.montantN)),
    y2: sumBy(data.services.filter((r) => r.actif !== false), (r) => n(r.montantN1)),
    y3: sumBy(data.services.filter((r) => r.actif !== false), (r) => n(r.montantN2)),
  };
  return {
    fournitures: f,
    services: s,
    total: { y1: f.y1 + s.y1, y2: f.y2 + s.y2, y3: f.y3 + s.y3 },
  };
}

// â”€â”€ Subventions d'exploitation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcSubventions(
  data: Pick<ScenarioFinData, "subventionsExploitation">,
): YearAcc {
  const rows = data.subventionsExploitation.filter((r) => r.actif !== false);
  return {
    y1: sumBy(rows, (r) => n(r.montantN)),
    y2: sumBy(rows, (r) => n(r.montantN1)),
    y3: sumBy(rows, (r) => n(r.montantN2)),
  };
}

// â”€â”€ Impôts et taxes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcImpotsTaxes(
  data: Pick<ScenarioFinData, "impotsTaxes">,
): YearAcc {
  const rows = data.impotsTaxes.filter((r) => r.actif !== false);
  return {
    y1: sumBy(rows, (r) => n(r.montantN ?? 0)),
    y2: sumBy(rows, (r) => n(r.montantN1 ?? 0)),
    y3: sumBy(rows, (r) => n(r.montantN2 ?? 0)),
  };
}

// â”€â”€ Commissions d'activité â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcCommissions(
  data: Pick<ScenarioFinData, "activiteCommissions">,
): YearAcc {
  const rows = data.activiteCommissions.filter((r) => r.actif !== false);
  return {
    y1: sumBy(rows, (r) => n(r.montantN)),
    y2: sumBy(rows, (r) => n(r.montantN1)),
    y3: sumBy(rows, (r) => n(r.montantN2)),
  };
}

// â”€â”€ Productions immobilisées â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcProdImmo(
  data: Pick<ScenarioFinData, "productionsImmobilisees">,
  toExerciceKey: (date: Date | string) => "y1" | "y2" | "y3" | null,
): YearAcc {
  const acc: YearAcc = { y1: 0, y2: 0, y3: 0 };
  for (const p of data.productionsImmobilisees) {
    if (p.actif === false) continue;
    const yk = toExerciceKey(p.date);
    if (yk) acc[yk] += n(p.montant);
  }
  return acc;
}

// â”€â”€ Transferts de charges (produits) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcTransferts(
  data: Pick<ScenarioFinData, "transfertsProduits">,
): YearAcc {
  const rows = data.transfertsProduits.filter((r) => r.actif !== false);
  return {
    y1: sumBy(rows, (r) => n(r.montantN)),
    y2: sumBy(rows, (r) => n(r.montantN1)),
    y3: sumBy(rows, (r) => n(r.montantN2)),
  };
}

// â”€â”€ Autres produits de gestion courante â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcAutresProdGestion(
  data: Pick<ScenarioFinData, "gestionCouranteProduits">,
): YearAcc {
  const rows = data.gestionCouranteProduits.filter((r) => r.actif !== false);
  return {
    y1: sumBy(rows, (r) => n(r.montantN)),
    y2: sumBy(rows, (r) => n(r.montantN1)),
    y3: sumBy(rows, (r) => n(r.montantN2)),
  };
}

// â”€â”€ Autres charges de gestion courante â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function calcAutresChargesGestion(
  data: Pick<ScenarioFinData, "chargesGestionCourante">,
): YearAcc {
  const rows = data.chargesGestionCourante.filter((r) => r.actif !== false);
  return {
    y1: sumBy(rows, (r) => n(r.montantN)),
    y2: sumBy(rows, (r) => n(r.montantN1)),
    y3: sumBy(rows, (r) => n(r.montantN2)),
  };
}
