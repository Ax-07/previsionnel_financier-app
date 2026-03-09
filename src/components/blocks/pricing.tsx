import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Essentiel",
    price: "9",
    description: "Pour découvrir et réaliser votre premier prévisionnel simplement.",
    features: [
      "1 dossier actif",
      "Tous les modules de saisie",
      "États financiers complets",
      "Export PDF",
      "Support par email",
    ],
    cta: "Commencer gratuitement",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "29",
    description: "Pour les porteurs de projet sérieux avec plusieurs scénarios.",
    features: [
      "5 dossiers actifs",
      "Tous les modules de saisie",
      "États financiers complets",
      "Export PDF & Excel",
      "Simulation scénarios",
      "Rapport bancaire",
      "Support prioritaire",
    ],
    cta: "Choisir Pro",
    highlighted: true,
  },
  {
    name: "Illimité",
    price: "59",
    description: "Pour les entrepreneurs actifs gérant plusieurs projets en parallèle.",
    features: [
      "Dossiers illimités",
      "Tous les modules de saisie",
      "États financiers complets",
      "Export PDF & Excel",
      "Simulation scénarios",
      "Rapport bancaire",
      "Partage avec un tiers (comptable…)",
      "Support dédié",
    ],
    cta: "Choisir Illimité",
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section id="tarifs" className="w-full bg-background py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-14 flex flex-col items-center gap-4 text-center">
          <Badge variant="outline" className="rounded-full px-4 py-1.5 text-sm font-semibold">
            Tarifs
          </Badge>
          <h2 className="text-3xl font-bold leading-snug text-foreground md:text-4xl lg:text-5xl">
            Des tarifs accessibles à tous
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Sans engagement. Commencez avec l&apos;offre Essentielle et évoluez à votre rythme.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:items-center">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "relative flex flex-col transition-shadow hover:shadow-md",
                plan.highlighted &&
                  "border-primary shadow-lg ring-2 ring-primary"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge className="rounded-full px-4 py-1 text-xs font-semibold">
                    Recommandé
                  </Badge>
                </div>
              )}

              <CardHeader>
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <div className="flex items-end gap-1 pt-2">
                  <span className="text-4xl font-extrabold text-foreground">
                    {plan.price}€
                  </span>
                  <span className="mb-1 text-sm text-muted-foreground">/mois</span>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-6">
                <Separator />
                <ul className="flex flex-1 flex-col gap-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-foreground">
                      <CheckIcon className="size-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="#"
                  className={cn(
                    buttonVariants({
                      variant: plan.highlighted ? "default" : "outline",
                    }),
                    "w-full"
                  )}
                >
                  {plan.cta}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
