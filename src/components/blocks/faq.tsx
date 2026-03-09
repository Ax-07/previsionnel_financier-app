"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const faqs = [
  {
    question: "À qui s'adresse Previsia ?",
    answer:
      "Previsia s'adresse à tous les particuliers qui souhaitent construire un prévisionnel financier professionnel : créateurs d'entreprise, repreneurs, porteurs de projet, micro-entrepreneurs ou toute personne ayant besoin d'un dossier de financement bancaire — sans passer par un comptable.",
  },
  {
    question: "Faut-il des connaissances en comptabilité ?",
    answer:
      "Non. Previsia est conçu pour être accessible à tous. Vous n'avez qu'à renseigner vos hypothèses (chiffre d'affaires, charges, investissements…) et le moteur génère automatiquement tous les documents financiers : compte de résultat, bilan, trésorerie, rapport bancaire.",
  },
  {
    question: "Le logiciel gère-t-il les spécificités fiscales françaises ?",
    answer:
      "Oui, entièrement. Le moteur de calcul intègre l'impôt sur les sociétés (IS), l'impôt sur le revenu (IR), la TVA selon différents régimes, les cotisations sociales patronales et salariales ainsi que les charges spécifiques aux dirigeants.",
  },
  {
    question: "Puis-je gérer plusieurs scénarios pour un même dossier ?",
    answer:
      "Oui. Le module de simulation vous permet de créer plusieurs scénarios (optimiste, réaliste, pessimiste), de les comparer côte à côte et d'analyser la sensibilité de vos résultats à chaque hypothèse.",
  },
  {
    question: "Quels formats d'export sont disponibles ?",
    answer:
      "Vous pouvez exporter vos prévisionnels en PDF, en Excel (format xlsx) et générer un dossier de financement bancaire complet et structuré, prêt à être présenté à vote banquier.",
  },
  {
    question: "Comment fonctionne le moteur de calcul ?",
    answer:
      "Le moteur repose sur un système de dépendance en chaîne : Hypothèses → CA → Charges → Résultat → Trésorerie → États financiers. Toute modification d'une variable en amont recalcule automatiquement l'ensemble du modèle en moins d'une seconde.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Absolument. La plateforme est conforme RGPD, vos données sont chiffrées en transit et au repos, et votre espace est totalement privé et isolé des autres utilisateurs.",
  },
  {
    question: "Y a-t-il un engagement de durée ?",
    answer:
      "Non. L'abonnement est mensuel et sans engagement. Vous pouvez changer de formule ou résilier à tout moment depuis votre espace client.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="w-full bg-muted/40 py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-14 flex flex-col items-center gap-4 text-center">
          <Badge variant="outline" className="rounded-full px-4 py-1.5 text-sm font-semibold">
            FAQ
          </Badge>
          <h2 className="text-3xl font-bold leading-snug text-foreground md:text-4xl lg:text-5xl">
            Questions fréquentes
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Tout ce que vous devez savoir avant de commencer.
          </p>
        </div>

        {/* Accordion */}
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
