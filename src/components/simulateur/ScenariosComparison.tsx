"use client";

/**
 * ScenariosComparison
 *
 * Vue côte à côte de deux scénarios sauvegardés.
 *   — Résumé en cartes pour les métriques clés
 *   — DiffTable pour le détail des écarts
 */

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DiffTable } from "./DiffTable";
import type { Scenario } from "@/stores/simulateur-paie-store";
import { formatEur as eur } from "@/lib/format";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : carte résumé d'un scénario
// ─────────────────────────────────────────────────────────────────────────────

interface ScenarioCardProps {
  scenario: Scenario;
  accentClass: string;
  badgeClass: string;
}

function ScenarioCard({ scenario, accentClass, badgeClass }: ScenarioCardProps) {
  const { input, resultat } = scenario;
  return (
    <div className={`rounded-xl border-2 p-4 flex flex-col gap-3 ${accentClass}`}>
      {/* Titre */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm leading-tight">{scenario.nom}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(scenario.createdAt)}</p>
        </div>
        <Badge className={`shrink-0 text-xs ${badgeClass}`}>
          {input.salarié.statut === "cadre" ? "Cadre" : "Non-cadre"}
        </Badge>
      </div>

      <Separator />

      {/* Métriques principales */}
      <div className="grid grid-cols-2 gap-2">
        <Metric label="Brut mensuel" value={eur(input.salarié.brutMensuel)} />
        <Metric label="Net à payer" value={eur(resultat.netAPayer)} highlight />
        <Metric label="Coût employeur" value={eur(resultat.coutEmployeur)} />
        <Metric label="Taux pat." value={`${resultat.tauxCotisationsPatronalesEffectif.toFixed(2)} %`} />
        <Metric label="Cotis. salariales" value={eur(Math.abs(resultat.totalCotisationsSalariales))} />
        <Metric
          label="RGDU"
          value={eur(Math.abs(resultat.montantRGDU))}
          highlight
          positive
        />
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline" className="text-xs">
          {input.salarié.typeContrat.toUpperCase()}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {input.entreprise.effectif} sal.
        </Badge>
        {input.salarié.alsaceMoselle && (
          <Badge variant="outline" className="text-xs">
            Alsace-Moselle
          </Badge>
        )}
        {(input.salarié.heuresSupplementaires ?? 0) > 0 && (
          <Badge variant="outline" className="text-xs">
            {input.salarié.heuresSupplementaires} h sup.
          </Badge>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  highlight = false,
  positive = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground leading-none">{label}</p>
      <p
        className={`text-sm font-semibold mt-0.5 tabular-nums ${
          highlight
            ? positive
              ? "text-green-600 dark:text-green-400"
              : "text-foreground"
            : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

interface ScenariosComparisonProps {
  scenarioA: Scenario;
  scenarioB: Scenario;
}

export function ScenariosComparison({ scenarioA, scenarioB }: ScenariosComparisonProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* ── Cartes côte à côte ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ScenarioCard
          scenario={scenarioA}
          accentClass="border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20"
          badgeClass="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        />
        <ScenarioCard
          scenario={scenarioB}
          accentClass="border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/20"
          badgeClass="bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200"
        />
      </div>

      {/* ── Tableau des écarts ── */}
      <div>
        <h3 className="text-sm font-semibold mb-3">
          Tableau des écarts
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            (B − A)
          </span>
        </h3>
        <DiffTable
          resultatA={scenarioA.resultat}
          labelA={scenarioA.nom}
          resultatB={scenarioB.resultat}
          labelB={scenarioB.nom}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="font-medium text-green-600 dark:text-green-400">Vert</span> = amélioration pour le salarié / l&apos;entreprise ·{" "}
          <span className="font-medium text-red-600 dark:text-red-400">Rouge</span> = dégradation
        </p>
      </div>
    </div>
  );
}
