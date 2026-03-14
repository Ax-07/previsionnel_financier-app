"use client";

import { useEffect, useState } from "react";
import { EyeIcon, PencilIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useReportSectionsStore } from "@/stores/report-sections-store";
import SectionEditor from "./section-editor";
import SectionFinancial from "./section-financial";
import RapportPreview from "./rapport-preview";
import type { SectionKey } from "@/lib/schemas/rapport";

// ── Structure du rapport ────────────────────────────────────────────────────

interface SectionDef {
  key: SectionKey;
  label: string;
  placeholder: string;
  maxLength: number;
}

interface SectionGroup {
  group: string;
  /** null = section financière auto (pas d'éditeur) */
  sections: SectionDef[] | null;
}

const RAPPORT_STRUCTURE: SectionGroup[] = [
  {
    group: "Page de couverture",
    sections: [
      {
        key: "cover_tagline",
        label: "Phrase d'accroche",
        placeholder: "Votre slogan ou phrase de présentation…",
        maxLength: 300,
      },
    ],
  },
  {
    group: "Résumé exécutif",
    sections: [
      {
        key: "executive_summary",
        label: "Résumé exécutif",
        placeholder:
          "Décrivez le projet, le marché ciblé, le modèle économique et le montant recherché…",
        maxLength: 3000,
      },
    ],
  },
  {
    group: "Présentation du projet",
    sections: [
      {
        key: "project_origin",
        label: "Origine du projet",
        placeholder: "Comment et pourquoi ce projet a-t-il émergé ?",
        maxLength: 2000,
      },
      {
        key: "project_mission",
        label: "Mission",
        placeholder: "Quelle est la mission de l'entreprise ?",
        maxLength: 1000,
      },
      {
        key: "project_vision",
        label: "Vision",
        placeholder: "Où souhaitez-vous emmener l'entreprise dans 5 ans ?",
        maxLength: 1000,
      },
    ],
  },
  {
    group: "Étude de marché",
    sections: [
      {
        key: "market_description",
        label: "Description du marché",
        placeholder: "Taille, segment, dynamiques du marché…",
        maxLength: 2000,
      },
      {
        key: "market_trends",
        label: "Tendances",
        placeholder: "Quelles sont les tendances qui favorisent votre projet ?",
        maxLength: 1500,
      },
      {
        key: "market_competition",
        label: "Analyse de la concurrence",
        placeholder: "Qui sont vos concurrents directs et indirects ?",
        maxLength: 2000,
      },
      {
        key: "market_targets",
        label: "Clients cibles",
        placeholder: "Profil de vos clients idéaux, personas…",
        maxLength: 1500,
      },
    ],
  },
  {
    group: "Offre et modèle économique",
    sections: [
      {
        key: "business_model_description",
        label: "Description du modèle économique",
        placeholder: "Comment l'entreprise génère-t-elle ses revenus ?",
        maxLength: 2000,
      },
    ],
  },
  {
    group: "Stratégie commerciale",
    sections: [
      {
        key: "strategy_acquisition",
        label: "Stratégie d'acquisition",
        placeholder: "Canaux d'acquisition, coût d'acquisition client…",
        maxLength: 1500,
      },
      {
        key: "strategy_communication",
        label: "Communication",
        placeholder: "Plan de communication, supports, messages clés…",
        maxLength: 1500,
      },
      {
        key: "strategy_partnerships",
        label: "Partenariats",
        placeholder: "Partenaires commerciaux, distributeurs, prescripteurs…",
        maxLength: 1500,
      },
    ],
  },
  {
    group: "Organisation et équipe",
    sections: [
      {
        key: "team_founder",
        label: "Présentation du fondateur",
        placeholder: "Parcours, compétences, légitimité sur le projet…",
        maxLength: 2000,
      },
      {
        key: "team_members",
        label: "Équipe",
        placeholder: "Présentation des membres clés de l'équipe…",
        maxLength: 2000,
      },
    ],
  },
  {
    group: "Plan opérationnel",
    sections: [
      {
        key: "operations_suppliers",
        label: "Fournisseurs",
        placeholder: "Principaux fournisseurs, dépendances, conditions…",
        maxLength: 1500,
      },
      {
        key: "operations_logistics",
        label: "Logistique",
        placeholder: "Organisation de la production, livraison, outils…",
        maxLength: 1500,
      },
    ],
  },
  {
    group: "Prévisionnel financier",
    sections: null, // automatique
  },
  {
    group: "Besoin de financement",
    sections: [
      {
        key: "funding_usage",
        label: "Utilisation des fonds",
        placeholder: "Comment seront utilisés les fonds levés…",
        maxLength: 1500,
      },
    ],
  },
  {
    group: "Annexes",
    sections: [
      {
        key: "annex",
        label: "Annexes",
        placeholder: "Documents complémentaires, commentaires, informations additionnelles…",
        maxLength: 5000,
      },
    ],
  },
];

// ── Composant ───────────────────────────────────────────────────────────────

interface RapportEditorProps {
  dossierId: string;
}

export default function RapportEditor({ dossierId }: RapportEditorProps) {
  const load = useReportSectionsStore((s) => s.load);
  const cache = useReportSectionsStore((s) => s.cache[dossierId]);

  const [activeGroup, setActiveGroup] = useState(RAPPORT_STRUCTURE[0].group);
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    load(dossierId);
  }, [dossierId, load]);

  const currentGroup = RAPPORT_STRUCTURE.find((g) => g.group === activeGroup);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Barre supérieure : toggle mode ── */}
      <div className="flex shrink-0 items-center justify-between border-b bg-background px-4 py-2">
        <span className="text-sm font-medium">Rapport Business Plan</span>
        <div className="flex items-center gap-1 rounded-md border p-0.5">
          <Button
            variant={mode === "edit" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 px-3 text-xs"
            onClick={() => setMode("edit")}
          >
            <PencilIcon className="size-3" />
            Édition
          </Button>
          <Button
            variant={mode === "preview" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 px-3 text-xs"
            onClick={() => setMode("preview")}
          >
            <EyeIcon className="size-3" />
            Aperçu
          </Button>
        </div>
      </div>

      {mode === "preview" ? (
        /* ── Mode Aperçu : rapport complet en lecture seule ── */
        <div className="flex-1 overflow-y-auto bg-muted/20">
          <RapportPreview dossierId={dossierId} />
        </div>
      ) : (
        /* ── Mode Édition : nav + éditeur ── */
        <div className="flex min-h-0 flex-1 overflow-hidden">
      {/* ── Barre de navigation gauche ── */}
      <nav
        className="flex w-56 shrink-0 flex-col gap-0.5 overflow-y-auto border-r bg-muted/30 p-3"
        aria-label="Sections du rapport"
      >
        {RAPPORT_STRUCTURE.map((group) => {
          // Calcul de l'état de la section (complète / vide)
          const isFinancial = group.sections === null;
          const hasContent =
            !isFinancial &&
            group.sections!.some((s) => !!(cache?.[s.key]?.trim()));
          const isActive = group.group === activeGroup;

          return (
            <button
              key={group.group}
              type="button"
              onClick={() => setActiveGroup(group.group)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                isActive
                  ? "bg-background font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
              )}
            >
              <span className="flex-1 truncate">{group.group}</span>
              {isFinancial ? (
                <span className="text-[10px] text-muted-foreground">auto</span>
              ) : hasContent ? (
                <span className="text-[10px] text-green-600">✓</span>
              ) : (
                <span className="text-[10px] text-muted-foreground">○</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Zone d'édition droite ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-6">
        {currentGroup ? (
          currentGroup.sections === null ? (
            /* Section financière : aperçu direct des tableaux */
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-semibold">Prévisionnel financier</h2>
              <p className="text-sm text-muted-foreground">
                Ces tableaux sont générés automatiquement depuis vos données saisies.
                Passez en mode <strong>Aperçu</strong> pour voir le rapport complet.
              </p>
              <SectionFinancial dossierId={dossierId} />
            </div>
          ) : (
            /* Sections éditables */
            <div className="flex flex-col gap-8">
              <h2 className="text-lg font-semibold">{currentGroup.group}</h2>
              {currentGroup.sections.map((section) => (
                <SectionEditor
                  key={section.key}
                  dossierId={dossierId}
                  sectionKey={section.key}
                  label={section.label}
                  placeholder={section.placeholder}
                  maxLength={section.maxLength}
                />
              ))}
            </div>
          )
        ) : null}
      </div>
        </div>
      )}
    </div>
  );
}
