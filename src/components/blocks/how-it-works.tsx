import { ClipboardListIcon, CpuIcon, DownloadIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const steps = [
  {
    step: "01",
    icon: ClipboardListIcon,
    title: "Saisissez vos hypothèses",
    description:
      "Renseignez les informations du dossier : activité, chiffre d'affaires prévisionnel, charges, investissements et plan de financement. Le workflow guidé vous accompagne étape par étape.",
  },
  {
    step: "02",
    icon: CpuIcon,
    title: "Le moteur calcule tout",
    description:
      "Notre moteur de calcul génère automatiquement le compte de résultat, le bilan, la trésorerie mensuelle, le BFR, la CAF, les SIG et le seuil de rentabilité.",
  },
  {
    step: "03",
    icon: DownloadIcon,
    title: "Exportez vos documents",
    description:
      "Téléchargez votre dossier de financement complet au format PDF ou Excel, prêt à être présenté à votre banquier ou intégré dans votre business plan.",
  },
];

export default function HowItWorks() {
  return (
    <section id="fonctionnement" className="w-full bg-background py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 flex flex-col items-center gap-4 text-center">
          <Badge variant="outline" className="rounded-full px-4 py-1.5 text-sm font-semibold">
            Comment ça marche
          </Badge>
          <h2 className="text-3xl font-bold leading-snug text-foreground md:text-4xl lg:text-5xl">
            Un prévisionnel complet en 3 étapes
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Du paramétrage à l&apos;export, chaque étape est pensée pour vous faire
            gagner du temps sans compromis sur la qualité.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          {/* Connecting line desktop */}
          <div className="absolute top-8 left-[16.66%] right-[16.66%] hidden h-px bg-border md:block" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="relative flex flex-col items-center gap-5 text-center">
                {/* Circle with number */}
                <div className="relative z-10 flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background">
                  <Icon className="size-6 text-primary" />
                  <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {step.step}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>

                {/* Mobile separator */}
                {index < steps.length - 1 && (
                  <Separator className="md:hidden" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
