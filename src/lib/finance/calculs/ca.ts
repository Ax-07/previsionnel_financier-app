import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import { n, sumBy, type YearAcc } from "@/lib/finance/utils";

// ── CA par type ──────────────────────────────────────────────────────────────

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

// ── Charges externes ─────────────────────────────────────────────────────────

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

// ── Subventions d'exploitation ────────────────────────────────────────────────

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

// ── Impôts et taxes ───────────────────────────────────────────────────────────

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

// ── Commissions d'activité ────────────────────────────────────────────────────

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

// ── Productions immobilisées ──────────────────────────────────────────────────

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

// ── Transferts de charges (produits) ─────────────────────────────────────────

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

// ── Autres produits de gestion courante ──────────────────────────────────────

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

// ── Autres charges de gestion courante ───────────────────────────────────────

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
