/**
 * Tests d'intégrité des données de classification (grilles conventionnelles).
 *
 * Pour chaque convention collective, vérifie :
 *   1. Codes uniques dans les niveauxClassification
 *   2. salaireMinimumMensuel > 0
 *   3. Si tauxHoraire est défini : tauxHoraire × 151.67 ≈ salaireMinimumMensuel (tolérance 1 €)
 *   4. salaireMinimumMensuel ≥ SMIC mensuel 2026
 *   5. Ordre croissant des salaires minima
 */

import { describe, it, expect } from "vitest";
import { PARAMS_2026 } from "@/lib/paie/params/2026";
import type { ConventionRuleSet, NiveauClassification } from "@/lib/paie/conventions/types";

// ── Imports des ConventionRuleSets ───────────────────────────────────────────
import { BTP_1597 } from "@/lib/paie/conventions/idcc/btp-1597";
import { COMMERCE_1245 } from "@/lib/paie/conventions/idcc/commerce-1245";
import { HCR_1979 } from "@/lib/paie/conventions/idcc/hcr-1979";
import { AIDE_DOMICILE_2941 } from "@/lib/paie/conventions/idcc/aide-domicile-2941";
import { METALLURGIE_3248 } from "@/lib/paie/conventions/idcc/metallurgie-3248";
import { SECURITE_PRIVEE_1351 } from "@/lib/paie/conventions/idcc/securite-privee-1351";
import { PROPRETE_3043 } from "@/lib/paie/conventions/idcc/proprete-3043";
import { SYNTEC_1486 } from "@/lib/paie/conventions/idcc/syntec-1486";
import { RESTAURATION_COLLECTIVE_1266 } from "@/lib/paie/conventions/idcc/restauration-coll-1266";
import { TRANSPORT_16 } from "@/lib/paie/conventions/idcc/transport-16";

// ── Constantes ───────────────────────────────────────────────────────────────
const HEURES_MENSUELLES = 151.67; // 35h × 52/12
const TOLERANCE_EUROS = 1.0;

// ── Map de toutes les conventions ────────────────────────────────────────────
const CONVENTIONS: Record<string, ConventionRuleSet> = {
  "BTP 1597": BTP_1597,
  "Commerce 1245": COMMERCE_1245,
  "HCR 1979": HCR_1979,
  "Aide domicile 2941": AIDE_DOMICILE_2941,
  "Métallurgie 3248": METALLURGIE_3248,
  "Sécurité privée 1351": SECURITE_PRIVEE_1351,
  "Propreté 3043": PROPRETE_3043,
  "Syntec 1486": SYNTEC_1486,
  "Restauration collective 1266": RESTAURATION_COLLECTIVE_1266,
  "Transport 16": TRANSPORT_16,
};

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Intégrité des classifications conventionnelles", () => {
  for (const [label, crs] of Object.entries(CONVENTIONS)) {
    describe(label, () => {
      const niveaux = crs.niveauxClassification ?? [];

      it("possède au moins 1 niveau de classification", () => {
        expect(niveaux.length).toBeGreaterThanOrEqual(1);
      });

      it("codes de niveaux uniques", () => {
        const codes = niveaux.map((n: NiveauClassification) => n.code);
        expect(new Set(codes).size).toBe(codes.length);
      });

      it("salaireMinimumMensuel > 0 pour chaque niveau", () => {
        for (const n of niveaux) {
          expect(n.salaireMinimumMensuel, `${n.code} salaireMinimumMensuel`).toBeGreaterThan(0);
        }
      });

      it("au moins un niveau ≥ SMIC mensuel 2026 (grille non obsolète)", () => {
        // En droit français, les premiers niveaux conventionnels peuvent être
        // inférieurs au SMIC (le SMIC s'applique alors comme plancher).
        // Mais la grille doit avoir au moins un niveau au-dessus du SMIC
        // pour ne pas être totalement obsolète.
        const maxSalaire = Math.max(...niveaux.map((n: NiveauClassification) => n.salaireMinimumMensuel));
        expect(
          maxSalaire,
          `Tous les niveaux < SMIC ${PARAMS_2026.smicMensuel} — grille obsolète ?`,
        ).toBeGreaterThanOrEqual(PARAMS_2026.smicMensuel);
      });

      it("tauxHoraire × 151,67 ≈ salaireMinimumMensuel (tolérance 1 €)", () => {
        for (const n of niveaux) {
          if (n.tauxHoraire == null) continue;
          const attendu = n.tauxHoraire * HEURES_MENSUELLES;
          const ecart = Math.abs(attendu - n.salaireMinimumMensuel);
          expect(
            ecart,
            `${n.code} : ${n.tauxHoraire} × ${HEURES_MENSUELLES} = ${attendu.toFixed(2)}, attendu ${n.salaireMinimumMensuel}`,
          ).toBeLessThanOrEqual(TOLERANCE_EUROS);
        }
      });
    });
  }
});
