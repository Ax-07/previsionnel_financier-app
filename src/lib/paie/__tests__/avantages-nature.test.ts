import { describe, it, expect } from "vitest";
import { simulate } from "@/lib/paie/simulate";

describe("Avantages en nature — déduction du net à payer", () => {
  const base = {
    salarié: {
      statut: "non_cadre" as const,
      typeContrat: "CDI" as const,
      heuresContrat: 151.66669,
      brutMensuel: 2000,
      tauxPAS: 0,
    },
    entreprise: { effectif: 10, tauxATMP: 0.021, tauxMobilite: 0 },
    millesime: "2026",
  };

  it("sans avantages : netAPayer = netSocial - PAS", () => {
    const res = simulate(base);
    expect(res.netAPayer).toBeCloseTo(res.netSocial - res.pas, 2);
  });

  it("avec 200€ avantages : netAPayer = netSocial - 200 - PAS", () => {
    const res = simulate({
      ...base,
      salarié: { ...base.salarié, avantagesEnNature: 200 },
    });
    expect(res.netAPayer).toBeCloseTo(res.netSocial - 200 - res.pas, 2);
  });

  it("les avantages n'augmentent pas le net à payer (brut +200 et net -200 s'équilibrent)", () => {
    const sans = simulate(base);
    const avec = simulate({
      ...base,
      salarié: { ...base.salarié, avantagesEnNature: 200 },
    });
    // Ajouter 200€ d'avantage augmente le brut (+200) MAIS déduit -200 du net.
    // L'effet net est seulement l'incidence cotisations sur ces 200€ extra (~20-25%).
    // Donc net_avec < net_sans, mais la différence est faible (≈ cotisations sur 200€).
    expect(avec.netAPayer).toBeLessThan(sans.netAPayer);
    const delta = sans.netAPayer - avec.netAPayer;
    expect(delta).toBeGreaterThan(20);  // au moins les cotisations min
    expect(delta).toBeLessThan(80);     // pas plus que 40% de 200€
  });
});
