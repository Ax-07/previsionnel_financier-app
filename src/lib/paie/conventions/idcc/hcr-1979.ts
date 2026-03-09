/**
 * CCN HCR — Convention collective nationale des hôtels, cafés, restaurants
 * IDCC 1979
 *
 * Règles 2026 implémentées :
 * - Prime de nourriture (avantage en nature ou allocation repas) : 4.25 €/repas
 *   → Le calcul dépend du nombre de repas pris dans le mois. Elle est versée au salarié et soumise aux cotisations.
 * - Heures supplémentaires : majoration de 10 % (heures 36–39), 20 % (heures 40–43), 50 % (heures 44 et +).
 * - Maintien légal renforcé en maladie (délai de carence réduit de 7j → 3j dès 1 an d'ancienneté)
 * - Prévoyance collective obligatoire via AG2R La Mondiale
 * - Pas de 13e mois conventionnel dans la branche (accord d'entreprise)
 * - Classification HCR : 5 niveaux (I à V) avec 3 échelons chacun
 *     |           | Niveau 1 | Niveau 2 | Niveau 3 | Niveau 4 | Niveau 5 |
 *     |-----------|----------|----------|----------|----------|----------|
 *     | echelon 1 | 12.02    | 12.28    | 13.32    | 14.40    | 18.43    |
 *     | echelon 2 | 12.08    | 12.55    | 13.54    | 14.77    | 21.78    |
 *     | echelon 3 | 12.18    | 13.17    | 14.00    | 15.40    | 28.12    |
 *
 * Référence : CCN HCR, accord du 30 avril 1997 (ext. 8/09/1997), avenant 2026
 */

import { registerConvention } from "@/lib/paie/conventions/registry";
import type { ConventionRuleSet } from "@/lib/paie/conventions/types";

const HCR_1979: ConventionRuleSet = {
    // ── Primes ──────────────────────────────────────────────────────────────
    primes: [
        {
            code: "hcr_indemnite_repas",
            libelle: "Indemnité repas HCR",
            mode: "fixe",
            // 4.25 €/repas × 2 repas/j × 21j ouvrés estimés
            valeur: 178.50,
            soumiseCotisations: true,
            imposable: false,
            reference: "CCN HCR Art. D3231-2",
        },
    ],

    // ── Classifications (5 niveaux × 3 échelons — taux horaires conventionnels)
    // Salaire mensuel = tauxHoraire × 151.67 h (35h/sem × 52/12)
    // ─────────────────────────────────────────────────────────────────────────
    niveauxClassification: [
        // Niveau I
        { code: "I-1",   libelle: "Niveau I — Échelon 1",   tauxHoraire: 12.02, salaireMinimumMensuel: 1823.08, echelon: 1 },
        { code: "I-2",   libelle: "Niveau I — Échelon 2",   tauxHoraire: 12.08, salaireMinimumMensuel: 1832.18, echelon: 2 },
        { code: "I-3",   libelle: "Niveau I — Échelon 3",   tauxHoraire: 12.18, salaireMinimumMensuel: 1847.34, echelon: 3 },
        // Niveau II
        { code: "II-1",  libelle: "Niveau II — Échelon 1",  tauxHoraire: 12.28, salaireMinimumMensuel: 1862.51, echelon: 1 },
        { code: "II-2",  libelle: "Niveau II — Échelon 2",  tauxHoraire: 12.55, salaireMinimumMensuel: 1903.46, echelon: 2 },
        { code: "II-3",  libelle: "Niveau II — Échelon 3",  tauxHoraire: 13.17, salaireMinimumMensuel: 1997.49, echelon: 3 },
        // Niveau III
        { code: "III-1", libelle: "Niveau III — Échelon 1", tauxHoraire: 13.32, salaireMinimumMensuel: 2020.24, echelon: 1 },
        { code: "III-2", libelle: "Niveau III — Échelon 2", tauxHoraire: 13.54, salaireMinimumMensuel: 2053.62, echelon: 2 },
        { code: "III-3", libelle: "Niveau III — Échelon 3", tauxHoraire: 14.00, salaireMinimumMensuel: 2123.38, echelon: 3 },
        // Niveau IV
        { code: "IV-1",  libelle: "Niveau IV — Échelon 1",  tauxHoraire: 14.40, salaireMinimumMensuel: 2184.05, echelon: 1 },
        { code: "IV-2",  libelle: "Niveau IV — Échelon 2",  tauxHoraire: 14.77, salaireMinimumMensuel: 2240.17, echelon: 2 },
        { code: "IV-3",  libelle: "Niveau IV — Échelon 3",  tauxHoraire: 15.40, salaireMinimumMensuel: 2335.72, echelon: 3 },
        // Niveau V
        { code: "V-1",   libelle: "Niveau V — Échelon 1",   tauxHoraire: 18.43, salaireMinimumMensuel: 2795.27, echelon: 1 },
        { code: "V-2",   libelle: "Niveau V — Échelon 2",   tauxHoraire: 21.78, salaireMinimumMensuel: 3303.37, echelon: 2 },
        { code: "V-3",   libelle: "Niveau V — Échelon 3",   tauxHoraire: 28.12, salaireMinimumMensuel: 4264.98, echelon: 3 },
    ],

    // ── Prévoyance obligatoire AG2R ─────────────────────────────────────────
    prevoyanceObligatoire: [
        {
            code: "hcr_prevoyance_sal",
            libelle: "Prévoyance HCR salarié (AG2R)",
            famille: "prevoyance_prevoyance",
            organisme: "AG2R La Mondiale",
            assiette: "brut",
            tauxSalarie: 0.0040, // 0.40 % brut
            tauxEmployeur: 0.0060, // 0.60 % brut
            deductible: true,
        },
        {
            code: "hcr_mutuelle_sal",
            libelle: "Mutuelle HCR salarié (AG2R)",
            famille: "prevoyance_mutuelle",
            organisme: "AG2R La Mondiale",
            assiette: "brut",
            tauxSalarie: 0.0050,
            tauxEmployeur: 0.0050,
            deductible: false,
        },
    ],

    // ── Majorations heures supplémentaires HCR (dérogatoire au légal) ────────
    // Légal : 25 % h36-43, 50 % h44+
    // HCR   : 10 % h36-39, 20 % h40-43, 50 % h44+
    majorationsHeuresSup: [
        { heureDebut: 36, heureFin: 39,   taux: 0.10 },
        { heureDebut: 40, heureFin: 43,   taux: 0.20 },
        { heureDebut: 44, heureFin: null, taux: 0.50 },
    ],

    // ── Maintien conventionnel (carence réduite dès 1 an) ──────────────────
    politiqueMaintien: {
        maladie_ordinaire: {
            ancienneteMinimumMois: 12,
            joursCarenceEmployeur: 3, // vs 7j légal
            dureeTauxPleinJours: 90,
            tauxMaintienPlein: 0.90,
            dureeTauxPartielJours: 90,
            tauxMaintienPartiel: 2 / 3,
            sousDedictionIjss: true,
        },
    },
};

// Auto-enregistrement à l'import
registerConvention("1979", HCR_1979);

export { HCR_1979 };
