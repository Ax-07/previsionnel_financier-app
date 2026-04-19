/**
 * Schéma de validation Zod pour les entrées du moteur de simulation de paie.
 *
 * Placé ici pour être utilisable :
 *   - dans simulate() (guard à l'entrée du pipeline)
 *   - côté client (formulaire simulateur)
 *   - dans les tests
 *
 * Les types TS existants (types.ts) restent la source de forme ;
 * ce fichier ajoute les invariants métier (min, max, cohérence).
 */

import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Sous-schémas
// ─────────────────────────────────────────────────────────────────────────────

const typeContratSchema = z.enum([
  "CDI",
  "CDD",
  "apprentissage",
  "contrat_pro",
  "stage",
]);

const statutSchema = z.enum(["cadre", "non_cadre"]);

const modePASSchema = z.enum([
  "personnalise",
  "neutre",
  "individualise",
  "absent",
]);

const apprentissageSchema = z
  .object({
    generation: z.enum(["avant_mars_2025", "depuis_mars_2025"]),
    annee: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    ageApprenti: z.number().int().min(15).max(30),
  })
  .strict();

const absenceTypeSchema = z.enum([
  "maladie_ordinaire",
  "maladie_longue_duree",
  "at_mp",
  "maternite",
  "paternite_accueil",
  "adoption",
  "conge_pathologique",
]);

const absenceEventSchema = z.object({
  type: absenceTypeSchema,
  joursCivils: z.number().int().positive(),
  joursOuvres: z.number().int().positive().optional(),
  ancienneteEnMois: z.number().int().nonnegative(),
  subrogation: z.boolean(),
  salairejournalierRef: z.number().positive().optional(),
  ijssDejaPrecues: z.number().nonnegative().optional(),
});

const salarieSchema = z
  .object({
    statut: statutSchema,
    typeContrat: typeContratSchema,
    alsaceMoselle: z.boolean().optional(),
    heuresContrat: z.number().positive("heuresContrat doit être > 0"),
    heuresTravaillees: z.number().nonnegative().optional(),
    brutMensuel: z.number().nonnegative("brutMensuel doit être ≥ 0"),
    heuresSupplementaires: z.number().nonnegative().optional(),
    tauxMajorationHeuresSup: z.number().min(0).max(2).optional(),
    primesSoumises: z.number().nonnegative().optional(),
    avantagesEnNature: z.number().nonnegative().optional(),
    absencesNonRemunerees: z.number().nonnegative().optional(),
    tauxPAS: z.number().min(0).max(1).optional(),
    modePAS: modePASSchema.optional(),
    dateEntree: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dateSortie: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    moisReference: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    apprentissage: apprentissageSchema.optional(),
    profileCode: z.string().optional(),
    sectionCode: z.string().optional(),
    conventionCode: z.string().optional(),
    absenceEvent: absenceEventSchema.optional(),
    cumulHeuresSup: z.number().nonnegative().optional(),
  })
  .strict();

const garantiePrevoyanceSchema = z.object({
  code: z.string().min(1),
  libelle: z.string().min(1),
  organisme: z.string().min(1),
  tauxSalarie: z.number().min(0).max(1),
  tauxEmployeur: z.number().min(0).max(1),
  deductible: z.boolean(),
  type: z.enum(["mutuelle", "prevoyance"]),
});

const prevoyanceConfigSchema = z.object({
  garanties: z.array(garantiePrevoyanceSchema).min(1),
});

const mutuelleConfigSchema = z.object({
  montantMensuel: z.number().positive(),
  partEmployeur: z.number().min(0.5).max(1),
  organisme: z.string().optional(),
  deductible: z.boolean().optional(),
});

const entrepriseSchema = z
  .object({
    effectif: z.number().int().positive("effectif doit être ≥ 1"),
    tauxATMP: z.number().min(0).max(1),
    tauxMobilite: z.number().min(0).max(1).optional(),
    prevoyance: prevoyanceConfigSchema.optional(),
    mutuelle: mutuelleConfigSchema.optional(),
  })
  .strict();

// ─────────────────────────────────────────────────────────────────────────────
// Schéma racine
// ─────────────────────────────────────────────────────────────────────────────

export const simulationInputSchema = z
  .object({
    millesime: z.string().optional(),
    salarié: salarieSchema,
    entreprise: entrepriseSchema,
  })
  .strict();

export type SimulationInputValidated = z.infer<typeof simulationInputSchema>;
