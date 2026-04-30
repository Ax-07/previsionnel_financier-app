import { cn } from "@/lib/utils";
import type { KpiCard, KpiGroup } from "@/hooks/controle/use-dashboard-kpi-data";
import type { YearKey } from "@/lib/finance/utils";
import { YEAR_KEYS, findGroupCard, formatKpiValue } from "./utils";
import { TrendBadge } from "./trend-badge";
import { Fragment } from "react/jsx-runtime";

const SECTIONS: Array<{ title: string; keys: Array<{ key: string; label: string }> }> = [
  {
    title: "Exploitation",
    keys: [
      { key: "ebe", label: "EBE / EBITDA" },
      { key: "res_expl", label: "Résultat d'exploitation" },
      { key: "res_courant", label: "Résultat courant" },
    ],
  },
  {
    title: "Structure",
    keys: [
      { key: "fr", label: "Fonds de roulement" },
      { key: "bfr", label: "BFR" },
      { key: "solde_annuel", label: "Trésorerie nette" },
    ],
  },
];

type Row = { label: string; card: KpiCard };

export function KpisSecondairesPanel({
  groups,
  yearLabels,
}: {
  groups: KpiGroup[];
  yearLabels: Record<YearKey, string>;
}) {
  const sections = SECTIONS.map((section) => ({
    title: section.title,
    rows: section.keys
      .map(({ key, label }) => ({ label, card: findGroupCard(groups, key) }))
      .filter((r): r is Row => r.card !== null),
  }));

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="border-b bg-muted/30 px-3 py-2">
        <h4 className="text-xs font-semibold">Indicateurs complémentaires</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b bg-muted/20">
              <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Indicateur</th>
              {YEAR_KEYS.map((yk) => (
                <th key={yk} className="px-3 py-1.5 text-right font-medium text-muted-foreground">
                  {yearLabels[yk]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((section, si) =>
              section.rows.length > 0 ? (
                <Fragment key={section.title}>
                  <tr key={`section-${si}`} className="border-b bg-muted/10">
                    <td
                      colSpan={YEAR_KEYS.length + 1}
                      className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {section.title}
                    </td>
                  </tr>
                  {section.rows.map(({ label, card }) => (
                    <tr key={label} className="border-b last:border-0 transition-colors hover:bg-muted/20">
                      <td className="px-3 py-1.5 font-medium text-foreground/80">{label}</td>
                      {YEAR_KEYS.map((yk) => {
                        const val = card.values[yk];
                        const isGood =
                          val.amount !== 0 ? (card.positive === "up" ? val.amount > 0 : val.amount < 0) : null;
                        return (
                          <td key={yk} className="px-3 py-1.5 text-right tabular-nums">
                            <div className="flex items-center justify-end gap-1">
                              <span
                                className={cn(
                                  isGood === null
                                    ? "text-muted-foreground"
                                    : isGood
                                      ? "text-foreground"
                                      : "text-destructive",
                                )}
                              >
                                {formatKpiValue(val.amount, card.format)}
                              </span>
                              {val.trend != null && <TrendBadge trend={val.trend} positive={card.positive} />}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ) : null,
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
