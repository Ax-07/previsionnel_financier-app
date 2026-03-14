"use client";

import { useReportSectionsStore } from "@/stores/report-sections-store";
import SectionFinancial from "./section-financial";
import type { SectionKey } from "@/lib/schemas/rapport";

interface SectionGroupPreview {
  group: string;
  sections: { key: SectionKey; label: string }[] | null;
}

const PREVIEW_STRUCTURE: SectionGroupPreview[] = [
  {
    group: "Page de couverture",
    sections: [{ key: "cover_tagline", label: "Accroche" }],
  },
  {
    group: "Résumé exécutif",
    sections: [{ key: "executive_summary", label: "Résumé exécutif" }],
  },
  {
    group: "Présentation du projet",
    sections: [
      { key: "project_origin", label: "Origine du projet" },
      { key: "project_mission", label: "Mission" },
      { key: "project_vision", label: "Vision" },
    ],
  },
  {
    group: "Étude de marché",
    sections: [
      { key: "market_description", label: "Description du marché" },
      { key: "market_trends", label: "Tendances" },
      { key: "market_competition", label: "Analyse de la concurrence" },
      { key: "market_targets", label: "Clients cibles" },
    ],
  },
  {
    group: "Offre et modèle économique",
    sections: [
      { key: "business_model_description", label: "Modèle économique" },
    ],
  },
  {
    group: "Stratégie commerciale",
    sections: [
      { key: "strategy_acquisition", label: "Acquisition" },
      { key: "strategy_communication", label: "Communication" },
      { key: "strategy_partnerships", label: "Partenariats" },
    ],
  },
  {
    group: "Organisation et équipe",
    sections: [
      { key: "team_founder", label: "Fondateur" },
      { key: "team_members", label: "Équipe" },
    ],
  },
  {
    group: "Plan opérationnel",
    sections: [
      { key: "operations_suppliers", label: "Fournisseurs" },
      { key: "operations_logistics", label: "Logistique" },
    ],
  },
  {
    group: "Prévisionnel financier",
    sections: null,
  },
  {
    group: "Besoin de financement",
    sections: [{ key: "funding_usage", label: "Utilisation des fonds" }],
  },
  {
    group: "Annexes",
    sections: [{ key: "annex", label: "Annexes" }],
  },
];

interface RapportPreviewProps {
  dossierId: string;
}

export default function RapportPreview({ dossierId }: RapportPreviewProps) {
  const getContent = useReportSectionsStore((s) => s.getContent);

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-6 py-8">
      {PREVIEW_STRUCTURE.map((group) => {
        if (group.sections === null) {
          // ── Section prévisionnel financier ──
          return (
            <section key={group.group}>
              <h2 className="mb-6 border-b pb-2 text-2xl font-bold">
                {group.group}
              </h2>
              <SectionFinancial dossierId={dossierId} />
            </section>
          );
        }

        // ── Sections éditables ──
        const hasAnyContent = group.sections.some(
          (s) => !!getContent(dossierId, s.key).trim()
        );

        if (!hasAnyContent) {
          return (
            <section key={group.group} className="opacity-40">
              <h2 className="mb-2 border-b pb-2 text-2xl font-bold">
                {group.group}
              </h2>
              <p className="text-sm italic text-muted-foreground">
                Section non renseignée
              </p>
            </section>
          );
        }

        return (
          <section key={group.group}>
            <h2 className="mb-6 border-b pb-2 text-2xl font-bold">
              {group.group}
            </h2>
            <div className="space-y-6">
              {group.sections.map((s) => {
                const html = getContent(dossierId, s.key);
                if (!html.trim()) return null;
                return (
                  <div key={s.key}>
                    {/* N'afficher le label que si plusieurs sous-sections ont du contenu */}
                    {group.sections!.filter(
                      (x) => !!getContent(dossierId, x.key).trim()
                    ).length > 1 && (
                      <h3 className="mb-2 text-base font-semibold text-muted-foreground">
                        {s.label}
                      </h3>
                    )}
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      // Le contenu HTML provient uniquement de l'éditeur Tiptap
                      // (StarterKit limité : p, h2, h3, strong, em, ul, ol, li)
                      // et est entièrement sous contrôle de l'utilisateur (pas de XSS externe).
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
