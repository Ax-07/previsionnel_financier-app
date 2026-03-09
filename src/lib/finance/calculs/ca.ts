import type { ScenarioFinData } from "@/lib/finance/fetch-scenario";
import type { YearKey } from "@/lib/finance/utils";

export type YAcc = Record<YearKey, number>;

const n = (v: unknown): number =>
  typeof v === "object" && v !== null && "toNumber" in v
    ? (v as { toNumber: () => number }).toNumber()
    : Number(v ?? 0);

const zero: YAcc = { y1: 0, y2: 0, y3: 0 };

function sumBy<T>(arr: T[], fn: (item: T) => number) {
  return arr.reduce((s, x) => s + fn(x), 0);
}

// ── CA par type ──────────────────────────────────────────────────────────────

export function calcCA(data: Pick<ScenarioFinData, "activites">): YAcc {
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
): YAcc {
  const rows = data.activites.filter(
    (a) => a.actif !== false && a.typeActivite === type,
  );
  return {
    y1: sumBy(rows, (r) => n(r.montantN)),
    y2: sumBy(rows, (r) => n(r.montantN1)),
    y3: sumBy(rows, (r) => n(r.montantN2)),
  };
}

// ── Stocks ───────────────────────────────────────────────────────────────────

export function calcStocks(data: Pick<ScenarioFinData, "activites">): {
  achatsEffectues: YAcc;
  stockInitial: YAcc;
  stockFinal: YAcc;
  varStock: YAcc;
  achatsConsommes: YAcc;
} {
  const achatsRows = data.activites
    .filter((a) => a.actif !== false && a.typeActivite !== "PRESTATION_SERVICES")
    .map((a) => ({
      montantN: n(a.montantN),
      montantN1: n(a.montantN1),
      montantN2: n(a.montantN2),
      tauxMarge: n(a.tauxMarge),
      stocks: a.stocks ?? 0,
    }));

  const achatsEffectues: YAcc = {
    y1: sumBy(achatsRows, (r) => r.montantN * Math.max(0, 1 - r.tauxMarge / 100)),
    y2: sumBy(achatsRows, (r) => r.montantN1 * Math.max(0, 1 - r.tauxMarge / 100)),
    y3: sumBy(achatsRows, (r) => r.montantN2 * Math.max(0, 1 - r.tauxMarge / 100)),
  };

  const sfY1 = sumBy(achatsRows, (r) => (r.montantN * Math.max(0, 1 - r.tauxMarge / 100) * r.stocks) / 365);
  const sfY2 = sumBy(achatsRows, (r) => (r.montantN1 * Math.max(0, 1 - r.tauxMarge / 100) * r.stocks) / 365);
  const sfY3 = sumBy(achatsRows, (r) => (r.montantN2 * Math.max(0, 1 - r.tauxMarge / 100) * r.stocks) / 365);

  const stockFinal: YAcc = { y1: sfY1, y2: sfY2, y3: sfY3 };
  const stockInitial: YAcc = { y1: 0, y2: sfY1, y3: sfY2 };
  const varStock: YAcc = {
    y1: sfY1 - 0,
    y2: sfY2 - sfY1,
    y3: sfY3 - sfY2,
  };
  const achatsConsommes: YAcc = {
    y1: achatsEffectues.y1 + stockInitial.y1 - stockFinal.y1,
    y2: achatsEffectues.y2 + stockInitial.y2 - stockFinal.y2,
    y3: achatsEffectues.y3 + stockInitial.y3 - stockFinal.y3,
  };

  return { achatsEffectues, stockInitial, stockFinal, varStock, achatsConsommes };
}

// ── Charges externes ─────────────────────────────────────────────────────────

export function calcChargesExternes(
  data: Pick<ScenarioFinData, "fournitures" | "services">,
): { fournitures: YAcc; services: YAcc; total: YAcc } {
  const f: YAcc = {
    y1: sumBy(data.fournitures.filter((r) => r.actif !== false), (r) => n(r.montantN)),
    y2: sumBy(data.fournitures.filter((r) => r.actif !== false), (r) => n(r.montantN1)),
    y3: sumBy(data.fournitures.filter((r) => r.actif !== false), (r) => n(r.montantN2)),
  };
  const s: YAcc = {
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
): YAcc {
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
): YAcc {
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
): YAcc {
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
): YAcc {
  const acc: YAcc = { y1: 0, y2: 0, y3: 0 };
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
): YAcc {
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
): YAcc {
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
): YAcc {
  const rows = data.chargesGestionCourante.filter((r) => r.actif !== false);
  return {
    y1: sumBy(rows, (r) => n(r.montantN)),
    y2: sumBy(rows, (r) => n(r.montantN1)),
    y3: sumBy(rows, (r) => n(r.montantN2)),
  };
}

export { zero, n, sumBy };
