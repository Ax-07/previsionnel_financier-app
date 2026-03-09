"use client";

/**
 * ScenariosManager
 *
 * Gestion des scénarios comparatifs sauvegardés.
 * Permet de :
 *  - Sauvegarder la simulation courante comme un scénario nommé
 *  - Lister les scénarios existants avec un résumé financier
 *  - Supprimer un scénario
 *  - Renommer un scénario inline
 *  - Sélectionner deux scénarios pour les comparer (ouvre ScenariosComparison)
 */

import { useState } from "react";
import { useSimulateurStore, type Scenario } from "@/stores/simulateur-paie-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookmarkPlusIcon,
  CheckIcon,
  PencilIcon,
  Trash2Icon,
  BarChart2Icon,
  XIcon,
} from "lucide-react";
import { ScenariosComparison } from "./ScenariosComparison";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function eur(v: number): string {
  return v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : ligne de scénario
// ─────────────────────────────────────────────────────────────────────────────

interface ScenarioRowProps {
  scenario: Scenario;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onRename: (nom: string) => void;
}

function ScenarioRow({ scenario, isSelected, onSelect, onRemove, onRename }: ScenarioRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(scenario.nom);

  function commitRename() {
    if (draft.trim()) onRename(draft.trim());
    setEditing(false);
  }

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        isSelected ? "border-primary bg-primary/5" : "border-border bg-card"
      }`}
    >
      {/* Nom + date */}
      <div className="flex items-start gap-2">
        {editing ? (
          <div className="flex flex-1 items-center gap-1">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setEditing(false);
              }}
              className="h-7 text-sm"
              autoFocus
            />
            <Button size="icon" variant="ghost" className="size-7" onClick={commitRename}>
              <CheckIcon className="size-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditing(false)}>
              <XIcon className="size-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 items-center gap-1.5 min-w-0">
            <span className="flex-1 truncate text-sm font-medium">{scenario.nom}</span>
            <Button
              size="icon"
              variant="ghost"
              className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => { setDraft(scenario.nom); setEditing(true); }}
            >
              <PencilIcon className="size-3" />
            </Button>
          </div>
        )}

        <Button
          size="icon"
          variant="ghost"
          className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2Icon className="size-3" />
        </Button>
      </div>

      {/* Métadonnées */}
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span>{formatDate(scenario.createdAt)}</span>
        <span>·</span>
        <span>{scenario.input.salarié.statut === "cadre" ? "Cadre" : "Non-cadre"}</span>
        <span>·</span>
        <span>{eur(scenario.input.salarié.brutMensuel)} brut</span>
      </div>

      {/* Indicateurs financiers */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge variant="secondary" className="text-xs font-medium">
          Net {eur(scenario.resultat.netAPayer)}
        </Badge>
        <Badge variant="outline" className="text-xs">
          Coût {eur(scenario.resultat.coutEmployeur)}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {scenario.resultat.tauxCotisationsPatronalesEffectif.toFixed(1)} % pat.
        </Badge>
      </div>

      {/* Bouton sélection pour comparaison */}
      <div className="mt-2">
        <Button
          size="sm"
          variant={isSelected ? "default" : "outline"}
          className="h-7 text-xs"
          onClick={onSelect}
        >
          {isSelected ? (
            <>
              <CheckIcon className="mr-1 size-3" />
              Sélectionné
            </>
          ) : (
            "Sélectionner pour comparer"
          )}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export function ScenariosManager() {
  const { resultat, input, scenarios, addScenario, removeScenario, renameScenario } =
    useSimulateurStore();

  const [nomDraft, setNomDraft] = useState("");
  const [selection, setSelection] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // ── Sauvegarde ─────────────────────────────────────────────────────────

  function handleAdd() {
    const nom = nomDraft.trim() || `Scénario — ${eur(input?.salarié.brutMensuel ?? 0)} brut`;
    addScenario(nom);
    setNomDraft("");
  }

  // ── Sélection pour comparaison ─────────────────────────────────────────

  function toggleSelect(id: string) {
    setSelection((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 2
          ? [...prev, id]
          : [prev[1], id], // glissement : on garde le dernier sélectionné
    );
  }

  const canCompare = selection.length === 2;
  const scenariosSelected = selection
    .map((id) => scenarios.find((s) => s.id === id))
    .filter(Boolean) as Scenario[];

  if (showComparison && scenariosSelected.length === 2) {
    return (
      <div className="flex flex-col gap-4">
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setShowComparison(false)}
        >
          <XIcon className="mr-1.5 size-3.5" />
          Fermer la comparaison
        </Button>
        <ScenariosComparison
          scenarioA={scenariosSelected[0]}
          scenarioB={scenariosSelected[1]}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Sauvegarde du scénario courant ── */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Sauvegarder la simulation courante</h3>
        {!resultat ? (
          <p className="text-sm text-muted-foreground">
            Lancez une simulation pour pouvoir la sauvegarder comme scénario.
          </p>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder={`ex. CDI non-cadre ${eur(input?.salarié.brutMensuel ?? 0)}`}
              value={nomDraft}
              onChange={(e) => setNomDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="h-9 text-sm"
            />
            <Button size="sm" onClick={handleAdd} className="shrink-0">
              <BookmarkPlusIcon className="mr-1.5 size-3.5" />
              Sauvegarder
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* ── Liste des scénarios ── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Scénarios sauvegardés
            {scenarios.length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({scenarios.length})
              </span>
            )}
          </h3>
          {canCompare && (
            <Button
              size="sm"
              onClick={() => setShowComparison(true)}
              className="h-7 text-xs"
            >
              <BarChart2Icon className="mr-1.5 size-3.5" />
              Comparer les 2 scénarios
            </Button>
          )}
        </div>

        {scenarios.length === 0 ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            Aucun scénario enregistré.
            <br />
            <span className="text-xs">
              Sauvegardez une simulation pour la retrouver ici.
            </span>
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {selection.length > 0 && !canCompare && (
              <p className="text-xs text-muted-foreground">
                Sélectionnez un 2e scénario pour activer la comparaison.
              </p>
            )}
            {scenarios.map((scenario) => (
              <ScenarioRow
                key={scenario.id}
                scenario={scenario}
                isSelected={selection.includes(scenario.id)}
                onSelect={() => toggleSelect(scenario.id)}
                onRemove={() => {
                  removeScenario(scenario.id);
                  setSelection((prev) => prev.filter((x) => x !== scenario.id));
                }}
                onRename={(nom) => renameScenario(scenario.id, nom)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
