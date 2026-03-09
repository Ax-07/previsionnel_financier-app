import {
  BuildingIcon,
  TrendingUpIcon,
  MinusCircleIcon,
  WrenchIcon,
  LandmarkIcon,
  UsersIcon,
  ReceiptIcon,
  CpuIcon,
  FileBarChartIcon,
  SlidersIcon,
  PrinterIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const modules = [
  {
    number: "01",
    icon: BuildingIcon,
    title: "Dossier entreprise",
    description: "Statut juridique, régime fiscal, régime TVA, activité et paramètres de projection.",
  },
  {
    number: "02",
    icon: TrendingUpIcon,
    title: "Hypothèses de CA",
    description: "Modélisation par activité, tarification, volume, saisonnalité et croissance annuelle.",
  },
  {
    number: "03",
    icon: MinusCircleIcon,
    title: "Charges",
    description: "Charges fixes, charges variables, évolution paramétrée et indexation inflation.",
  },
  {
    number: "04",
    icon: WrenchIcon,
    title: "Investissements",
    description: "Immobilisations, plan d'amortissement automatique et renouvellements.",
  },
  {
    number: "05",
    icon: LandmarkIcon,
    title: "Financement",
    description: "Apports, emprunts, subventions, échéancier automatique et calcul des intérêts.",
  },
  {
    number: "06",
    icon: UsersIcon,
    title: "Masse salariale",
    description: "Salariés, dirigeant, charges sociales françaises et évolution des effectifs.",
  },
  {
    number: "07",
    icon: ReceiptIcon,
    title: "Fiscalité",
    description: "Impôt société, IR, TVA, cotisations sociales et charges patronales.",
  },
  {
    number: "08",
    icon: CpuIcon,
    title: "Moteur de calcul",
    description: "CR, bilan, trésorerie mensuelle, BFR, CAF, SIG, seuil de rentabilité.",
  },
  {
    number: "09",
    icon: FileBarChartIcon,
    title: "États financiers",
    description: "Compte de résultat et bilan prévisionnels, plan de financement et trésorerie.",
  },
  {
    number: "10",
    icon: SlidersIcon,
    title: "Simulation",
    description: "Scénarios multiples, comparaison et analyse de sensibilité.",
  },
  {
    number: "11",
    icon: PrinterIcon,
    title: "Reporting",
    description: "Rapport bancaire, dossier de financement, export PDF et Excel.",
  },
];

export default function Modules() {
  return (
    <section id="modules" className="w-full bg-muted/40 py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-14 flex flex-col items-center gap-4 text-center">
          <Badge variant="outline" className="rounded-full px-4 py-1.5 text-sm font-semibold">
            Architecture modulaire
          </Badge>
          <h2 className="text-3xl font-bold leading-snug text-foreground md:text-4xl lg:text-5xl">
            11 modules métiers intégrés
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Chaque module est indépendant mais interconnecté. Toute modification
            se propage automatiquement dans l&apos;ensemble du modèle.
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Card key={mod.title} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Module {mod.number}
                      </span>
                      <h3 className="text-sm font-semibold text-foreground leading-tight">
                        {mod.title}
                      </h3>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {mod.description}
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
