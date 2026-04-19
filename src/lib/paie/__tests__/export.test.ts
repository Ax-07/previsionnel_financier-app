/**
 * Tests unitaires — Module d'export (CSV et JSON).
 *
 * Vérifie le format et l'intégrité des exports générés.
 * Le PDF (downloadBulletinPdf) est client-only et ne peut pas être testé unitairement.
 */

import { describe, it, expect } from "vitest";
import { buildBulletinCSV } from "@/lib/paie/export/csv";
import { buildExportJSON } from "@/lib/paie/export/json";
import { simulate } from "@/lib/paie/simulate";
import type { SimulationInput } from "@/lib/paie/types";

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const input: SimulationInput = {
  salarié: {
    statut: "non_cadre",
    typeContrat: "CDI",
    heuresContrat: 151.67,
    brutMensuel: 2000,
    tauxPAS: 0.05,
  },
  entreprise: {
    effectif: 10,
    tauxATMP: 0.021,
  },
};

const resultat = simulate(input);

// ─────────────────────────────────────────────────────────────────────────────
// CSV
// ─────────────────────────────────────────────────────────────────────────────

describe("Export CSV (buildBulletinCSV)", () => {
  const csv = buildBulletinCSV(input, resultat);

  it("commence par le BOM UTF-8", () => {
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  it("utilise le séparateur point-virgule", () => {
    const headerLine = csv.split("\r\n").find((l) => l.startsWith("Code"));
    expect(headerLine).toBeDefined();
    expect(headerLine!.split(";").length).toBe(11); // 11 colonnes
  });

  it("contient les 11 colonnes attendues dans le header", () => {
    const headerLine = csv.split("\r\n").find((l) => l.startsWith("Code"))!;
    const cols = headerLine.split(";");
    expect(cols).toContain("Code");
    expect(cols).toContain("Libellé");
    expect(cols).toContain("Famille");
    expect(cols).toContain("Assiette (€)");
    expect(cols).toContain("Taux salarié (%)");
    expect(cols).toContain("Montant salarié (€)");
    expect(cols).toContain("Montant employeur (€)");
    expect(cols).toContain("Déductible");
  });

  it("contient au moins une ligne de cotisation", () => {
    // Header + au moins une ligne de données après le header
    const lines = csv.split("\r\n");
    const headerIdx = lines.findIndex((l) => l.startsWith("Code"));
    expect(headerIdx).toBeGreaterThan(-1);
    // La ligne suivante doit contenir du contenu
    expect(lines[headerIdx + 1]?.length).toBeGreaterThan(0);
  });

  it("inclut les métadonnées (titre, date, brut)", () => {
    expect(csv).toContain("Bulletin de paie simulateur");
    expect(csv).toContain("2000,00"); // brut = 2000 formaté FR (pas de séparateur de milliers)
  });

  it("inclut les totaux (TOTAL SALARIAL, NET À PAYER)", () => {
    expect(csv).toContain("TOTAL SALARIAL");
    expect(csv).toContain("NET À PAYER");
    expect(csv).toContain("COÛT EMPLOYEUR");
  });

  it("utilise le format FR pour les nombres (virgule décimale)", () => {
    // Le brut 2000.00 doit apparaître comme "2000,00"
    expect(csv).toContain("2000,00");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// JSON
// ─────────────────────────────────────────────────────────────────────────────

describe("Export JSON (buildExportJSON)", () => {
  const payload = buildExportJSON(input, resultat);

  it("inclut la version du moteur", () => {
    expect(payload.meta.moteurVersion).toBeDefined();
    expect(typeof payload.meta.moteurVersion).toBe("string");
  });

  it("inclut le millésime", () => {
    expect(payload.meta.millesime).toBe("2026");
  });

  it("inclut un timestamp ISO 8601", () => {
    expect(payload.meta.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("inclut l'input complet", () => {
    expect(payload.input.salarié.brutMensuel).toBe(2000);
    expect(payload.input.entreprise.effectif).toBe(10);
  });

  it("inclut le résultat avec lignes de cotisations", () => {
    expect(payload.resultat.brutSoumis).toBe(resultat.brutSoumis);
    expect(payload.resultat.lignes.length).toBeGreaterThan(0);
    expect(payload.resultat.netAPayer).toBeDefined();
  });

  it("est sérialisable en JSON valide", () => {
    const json = JSON.stringify(payload);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
