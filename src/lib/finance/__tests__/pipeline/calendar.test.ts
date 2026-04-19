/**
 * Tests unitaires — pipeline/calendar.ts
 *
 * Couvre :
 *   - makeExerciceHelpers : bornes d'exercice, toExerciceKey, pFin/pDeb
 *   - fmtExercice : labels exercice normal et décalé
 *   - buildTemporelCtx : construction du contexte temporel
 *   - dateToSlot : mapping date → { yk, mi }
 *
 * Cas limites testés :
 *   - démarrage 1er janvier (exercice calendaire)
 *   - démarrage en cours d'année (exercice décalé, ex: avril)
 *   - dates exactement sur les bornes (borne incluse dans le suivant)
 *   - date hors périmètre → null
 */

import { describe, it, expect } from "vitest";
import {
  makeExerciceHelpers,
  fmtExercice,
  buildTemporelCtx,
  dateToSlot,
} from "@/lib/finance/pipeline/calendar";

// ── makeExerciceHelpers — exercice calendaire (démarrage 1er janvier) ─────────

describe("makeExerciceHelpers — exercice calendaire (2026-01-01)", () => {
  const DD = new Date("2026-01-01");
  const h = makeExerciceHelpers(DD);

  it("exBorne1 = 2027-01-01 (heure locale)", () => {
    expect(h.exBorne1.getFullYear()).toBe(2027);
    expect(h.exBorne1.getMonth()).toBe(0);
    expect(h.exBorne1.getDate()).toBe(1);
  });

  it("exBorne2 = 2028-01-01 (heure locale)", () => {
    expect(h.exBorne2.getFullYear()).toBe(2028);
    expect(h.exBorne2.getMonth()).toBe(0);
    expect(h.exBorne2.getDate()).toBe(1);
  });

  it("exBorne3 = 2029-01-01 (heure locale)", () => {
    expect(h.exBorne3.getFullYear()).toBe(2029);
    expect(h.exBorne3.getMonth()).toBe(0);
    expect(h.exBorne3.getDate()).toBe(1);
  });

  it("pFin = 0, pDeb = 1 (démarrage janvier)", () => {
    expect(h.pFin).toBe(0);
    expect(h.pDeb).toBe(1);
  });

  it("date dans Y1 → 'y1'", () => {
    expect(h.toExerciceKey(new Date("2026-06-15"))).toBe("y1");
  });

  it("date dans Y2 → 'y2'", () => {
    expect(h.toExerciceKey(new Date("2027-03-01"))).toBe("y2");
  });

  it("date dans Y3 → 'y3'", () => {
    expect(h.toExerciceKey(new Date("2028-12-31"))).toBe("y3");
  });

  it("date = borne de démarrage → 'y1' (incluse)", () => {
    expect(h.toExerciceKey(new Date("2026-01-01"))).toBe("y1");
  });

  it("date = exBorne1 → 'y2' (première borne de Y2)", () => {
    expect(h.toExerciceKey(new Date("2027-01-01"))).toBe("y2");
  });

  it("date avant le démarrage → null", () => {
    expect(h.toExerciceKey(new Date("2025-12-31"))).toBeNull();
  });

  it("date après exBorne3 → null", () => {
    expect(h.toExerciceKey(new Date("2029-01-01"))).toBeNull();
  });

  it("accepte une string ISO en entrée", () => {
    expect(h.toExerciceKey("2026-06-15")).toBe("y1");
  });
});

// ── makeExerciceHelpers — exercice décalé (démarrage 1er avril) ───────────────

describe("makeExerciceHelpers — exercice décalé (2026-04-01)", () => {
  const DD = new Date("2026-04-01");
  const h = makeExerciceHelpers(DD);

  it("exBorne1 = 2027-04-01 (heure locale)", () => {
    expect(h.exBorne1.getFullYear()).toBe(2027);
    expect(h.exBorne1.getMonth()).toBe(3); // avril = 3
    expect(h.exBorne1.getDate()).toBe(1);
  });

  it("pFin = 3/12 = 0.25, pDeb = 0.75", () => {
    expect(h.pFin).toBeCloseTo(3 / 12, 10);
    expect(h.pDeb).toBeCloseTo(9 / 12, 10);
  });

  it("date 2026-10 dans Y1", () => {
    expect(h.toExerciceKey(new Date("2026-10-01"))).toBe("y1");
  });

  it("date 2027-03-31 (dernier jour de Y1) → y1", () => {
    expect(h.toExerciceKey(new Date("2027-03-31"))).toBe("y1");
  });

  it("date 2027-04-01 (premier jour de Y2) → y2", () => {
    expect(h.toExerciceKey(new Date("2027-04-01"))).toBe("y2");
  });

  it("date 2028-04-01 (premier jour de Y3) → y3", () => {
    expect(h.toExerciceKey(new Date("2028-04-01"))).toBe("y3");
  });

  it("date 2029-04-01 (après exBorne3) → null", () => {
    expect(h.toExerciceKey(new Date("2029-04-01"))).toBeNull();
  });
});

// ── fmtExercice ───────────────────────────────────────────────────────────────

describe("fmtExercice", () => {
  it("moisDebut = 0 → label simple '2026'", () => {
    expect(fmtExercice(2026, 0)).toBe("2026");
  });

  it("moisDebut = 3 → label biennal '2026–2027'", () => {
    expect(fmtExercice(2026, 3)).toBe("2026\u20132027");
  });

  it("moisDebut = 11 → '2026–2027'", () => {
    expect(fmtExercice(2026, 11)).toBe("2026\u20132027");
  });
});

// ── buildTemporelCtx ──────────────────────────────────────────────────────────

describe("buildTemporelCtx", () => {
  it("yearStarts[0] = date de démarrage (normalisée au 1er du mois)", () => {
    const ctx = buildTemporelCtx(new Date("2026-04-01"), false);
    const ys0 = ctx.yearStarts[0];
    expect(ys0.getFullYear()).toBe(2026);
    expect(ys0.getMonth()).toBe(3); // avril
    expect(ys0.getDate()).toBe(1);
  });

  it("yearStarts a 4 éléments (Y0, Y1, Y2, Y3)", () => {
    const ctx = buildTemporelCtx(new Date("2026-01-01"), false);
    expect(ctx.yearStarts).toHaveLength(4);
  });

  it("isFranchise = true est propagé", () => {
    const ctx = buildTemporelCtx(new Date("2026-01-01"), true);
    expect(ctx.isFranchise).toBe(true);
  });

  it("defaultDelaiClients = 30 par défaut", () => {
    const ctx = buildTemporelCtx(new Date("2026-01-01"), false);
    expect(ctx.defaultDelaiClients).toBe(30);
  });

  it("defaultDelaiClients peut être surchargé", () => {
    const ctx = buildTemporelCtx(new Date("2026-01-01"), false, 60);
    expect(ctx.defaultDelaiClients).toBe(60);
  });

  it("anneeDebut et moisDebut corrects", () => {
    const ctx = buildTemporelCtx(new Date("2026-04-01"), false);
    expect(ctx.anneeDebut).toBe(2026);
    expect(ctx.moisDebut).toBe(3); // avril = index 3
  });
});

// ── dateToSlot ────────────────────────────────────────────────────────────────

describe("dateToSlot", () => {
  const ctx = buildTemporelCtx(new Date("2026-01-01"), false);

  it("date en Y1 M0 → { yk: 'y1', mi: 0 }", () => {
    const d = new Date("2026-01-15");
    expect(dateToSlot(d, ctx.yearStarts)).toEqual({ yk: "y1", mi: 0 });
  });

  it("date en Y1 M11 → { yk: 'y1', mi: 11 }", () => {
    const d = new Date("2026-12-15");
    expect(dateToSlot(d, ctx.yearStarts)).toEqual({ yk: "y1", mi: 11 });
  });

  it("date en Y2 M0 → { yk: 'y2', mi: 0 }", () => {
    const d = new Date("2027-01-15");
    expect(dateToSlot(d, ctx.yearStarts)).toEqual({ yk: "y2", mi: 0 });
  });

  it("date en Y3 M11 → { yk: 'y3', mi: 11 }", () => {
    const d = new Date("2028-12-15");
    expect(dateToSlot(d, ctx.yearStarts)).toEqual({ yk: "y3", mi: 11 });
  });

  it("date avant yearStarts[0] → { yk: null, mi: -1 }", () => {
    const d = new Date("2025-06-01");
    expect(dateToSlot(d, ctx.yearStarts)).toEqual({ yk: null, mi: -1 });
  });

  it("date après yearStarts[3] → { yk: null, mi: -1 }", () => {
    const d = new Date("2029-06-01");
    expect(dateToSlot(d, ctx.yearStarts)).toEqual({ yk: null, mi: -1 });
  });

  it("exercice décalé (avril) — date juillet Y1 → mi = 3", () => {
    const ctxD = buildTemporelCtx(new Date("2026-04-01"), false);
    const d = new Date("2026-07-01");
    expect(dateToSlot(d, ctxD.yearStarts)).toEqual({ yk: "y1", mi: 3 });
  });
});
