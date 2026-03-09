const stats = [
  { value: "10", label: "Modules métiers", sublabel: "Couvrant l'intégralité du prévisionnel" },
  { value: "< 1s", label: "Temps de calcul", sublabel: "Recalcul complet du modèle" },
  { value: "100%", label: "Conformité française", sublabel: "IS, IR, TVA, charges sociales" },
  { value: "3", label: "Formats d'export", sublabel: "PDF, Excel, rapport bancaire" },
];

export default function Stats() {
  return (
    <section className="w-full bg-primary py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 text-center">
              <span className="text-4xl font-extrabold text-primary-foreground md:text-5xl">
                {stat.value}
              </span>
              <span className="text-base font-semibold text-primary-foreground">
                {stat.label}
              </span>
              <span className="text-sm text-primary-foreground/70">
                {stat.sublabel}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
