import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardChartData, KpiGroup } from "@/hooks/controle/use-dashboard-kpi-data";
import type { YearKey } from "@/lib/finance/utils";
import { formatKpiValue, YEAR_KEYS } from "./utils";

export interface Alerte {
  severity: "danger" | "warning" | "info";
  message: string;
}

export function AlertesPanel({
  charts,
  yearLabels,
  selectedYear,
  groups,
}: {
  charts: DashboardChartData;
  yearLabels: Record<YearKey, string>;
  selectedYear: YearKey;
  groups: KpiGroup[];
}) {
  const alertes: Alerte[] = [];

  // Trésorerie négative dans l'exercice sélectionné
  const tresoPoints = charts.tresorerie[selectedYear];
  const negMois = tresoPoints.filter((p) => p.solde < 0);
  if (negMois.length > 0) {
    const premiers = negMois[0].mois;
    const dernier = negMois[negMois.length - 1].mois;
    const duree = negMois.length;
    const plage = duree === 1 ? premiers : `de ${premiers} à ${dernier}`;
    alertes.push({
      severity: "danger",
      message: `Trésorerie négative ${plage} (${duree} mois, ${yearLabels[selectedYear]})`,
    });
  } else {
    const maxSolde = Math.max(...tresoPoints.map((p) => p.solde));
    const minSolde = Math.min(...tresoPoints.map((p) => p.solde));
    const minPoint = tresoPoints.find((p) => p.solde === minSolde);
    if (maxSolde > 0 && minSolde < maxSolde * 0.2 && minPoint) {
      alertes.push({
        severity: "warning",
        message: `Trésorerie basse en ${minPoint.mois} (${formatKpiValue(minSolde, "currency")})`,
      });
    }
  }

  // Burn en hausse : 3 derniers mois de décaissements en progression stricte
  if (tresoPoints.length >= 3) {
    const last3 = tresoPoints.slice(-3);
    if (
      last3[0].decaissements < last3[1].decaissements &&
      last3[1].decaissements < last3[2].decaissements
    ) {
      alertes.push({
        severity: "warning",
        message: `Burn en hausse (${last3.map((p) => p.mois).join("→")}) — décaissements croissants`,
      });
    }
  }

  // CA < seuil d'équilibre par exercice
  YEAR_KEYS.forEach((yk, idx) => {
    const s = charts.seuil[idx];
    if (s && s.caRealise < s.seuilEco && s.seuilEco > 0) {
      alertes.push({
        severity: yk === "y1" ? "danger" : "warning",
        message: `CA < Seuil en ${yearLabels[yk]} (manque ${formatKpiValue(s.seuilEco - s.caRealise, "currency")})`,
      });
    }
  });

  // Alertes financement
  const financGroup = groups.find((g) => g.key === "financement");
  const cashGroup = groups.find((g) => g.key === "cash");
  const tauxCard = financGroup?.cards.find((c) => c.key === "taux_endettement");
  const covCafCard = financGroup?.cards.find((c) => c.key === "couverture_caf");
  const autofinCard = cashGroup?.cards.find((c) => c.key === "autofinancement");

  YEAR_KEYS.forEach((yk) => {
    const taux = tauxCard?.values[yk]?.amount;
    if (taux !== undefined && taux > 100) {
      alertes.push({
        severity: "warning",
        message: `Taux d'endettement > 100 % en ${yearLabels[yk]} (${taux.toFixed(0)} %) — risque refus bancaire`,
      });
    }
    const cov = covCafCard?.values[yk]?.amount;
    if (cov !== undefined && cov > 0 && cov < 1.0) {
      alertes.push({
        severity: "warning",
        message: `Couverture CAF insuffisante en ${yearLabels[yk]} (× ${cov.toFixed(2)}) — remboursements non couverts`,
      });
    }
  });

  const nbAutofinNeg = YEAR_KEYS.filter((yk) => (autofinCard?.values[yk]?.amount ?? 0) < 0).length;
  if (nbAutofinNeg >= 2) {
    alertes.push({
      severity: "warning",
      message: `Autofinancement négatif sur ${nbAutofinNeg} exercices — capacité de remboursement tendue`,
    });
  }

  // Runway court
  const runwayCard = groups.flatMap((g) => g.cards).find((c) => c.key === "runway");
  const runwayVal = runwayCard?.values[selectedYear]?.amount ?? 36;
  if (runwayVal < 3) {
    alertes.push({
      severity: "danger",
      message: `Runway critique : ${Math.round(runwayVal)} mois avant trésorerie nulle`,
    });
  } else if (runwayVal < 6) {
    alertes.push({
      severity: "warning",
      message: `Runway serré : ${Math.round(runwayVal)} mois avant trésorerie nulle`,
    });
  }

  if (alertes.length === 0) {
    alertes.push({ severity: "info", message: "Aucune alerte critique détectée" });
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex-1 overflow-y-auto rounded-lg border bg-card p-3 shadow-sm">
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
          <AlertTriangleIcon className="size-3.5 text-amber-500" />
          Alertes
        </h4>
        <div className="space-y-1.5">
          {alertes.map((a, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-2 rounded-md px-2 py-1.5 text-[11px]",
                a.severity === "danger"
                  ? "bg-destructive/10 text-destructive"
                  : a.severity === "warning"
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
              )}
            >
              {a.severity === "info" ? (
                <CheckCircle2Icon className="mt-0.5 size-3 shrink-0" />
              ) : (
                <AlertTriangleIcon className="mt-0.5 size-3 shrink-0" />
              )}
              <span>{a.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommandations — section désactivée */}
      {/* <div className="flex-1 overflow-y-auto rounded-lg border bg-card p-3 shadow-sm">
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
          <LightbulbIcon className="size-3.5 text-blue-500" />
          Recommandations
        </h4>
        ...
      </div> */}
    </div>
  );
}
