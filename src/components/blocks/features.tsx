import {
  ZapIcon,
  FileTextIcon,
  BuildingIcon,
  GitCompareArrowsIcon,
  CalculatorIcon,
  UsersIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: ZapIcon,
    title: "Calcul en temps réel",
    description:
      "Toute modification d'une hypothèse recalcule instantanément l'intégralité du modèle financier en moins d'une seconde.",
  },
  {
    icon: FileTextIcon,
    title: "États financiers complets",
    description:
      "Compte de résultat prévisionnel, bilan, plan de financement et trésorerie mensuelle générés automatiquement.",
  },
  {
    icon: BuildingIcon,
    title: "Rapport bancaire prêt",
    description:
      "Dossier de financement structuré et professionnel directement exploitable pour vos demandes de crédit.",
  },
  {
    icon: GitCompareArrowsIcon,
    title: "Simulation de scénarios",
    description:
      "Comparez plusieurs hypothèses, analysez la sensibilité et évaluez les risques de vos projections.",
  },
  {
    icon: CalculatorIcon,
    title: "Fiscalité française",
    description:
      "IS, IR, TVA, cotisations sociales et charges patronales calculés automatiquement selon le régime choisi.",
  },
  {
    icon: UsersIcon,
    title: "Masse salariale",
    description:
      "Gestion complète des salariés, dirigeants, charges sociales et évolution des effectifs sur la période.",
  },
];

export default function Features() {
  return (
    <section id="fonctionnalites" className="w-full bg-muted/40 py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-14 flex flex-col items-center gap-4 text-center">
          <Badge variant="outline" className="rounded-full px-4 py-1.5 text-sm font-semibold">
            Fonctionnalités
          </Badge>
          <h2 className="text-3xl font-bold leading-snug text-foreground md:text-4xl lg:text-5xl">
            Tout ce dont vous avez besoin
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Un moteur de calcul professionnel mis à la portée de tous. Les mêmes
          outils que les experts-comptables, en plus simple et plus rapide.
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
